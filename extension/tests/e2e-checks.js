// Exercita a extensão via D-Bus num gnome-shell headless já em execução.
// Uso: gjs -m e2e-checks.js <dir com gschemas.compiled>
// Pré-condições: extensão ACTIVE e uma janela de teste mapeada/focada.
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import System from 'system';
import * as Grid from '../lib/grid.js';

const BUS_NAME = 'org.gnome.Shell';
const OBJECT_PATH = '/br/dev/lcf2212/MultipleWindowsOrganization';
const IFACE = 'br.dev.lcf2212.MultipleWindowsOrganization';
const SCHEMA_ID = 'org.gnome.shell.extensions.multiple-windows-organization';

const connection = Gio.DBus.session;

function call(method, params = null) {
    const reply = connection.call_sync(BUS_NAME, OBJECT_PATH, IFACE, method,
        params, null, Gio.DBusCallFlags.NONE, 8000, null);
    return reply.deep_unpack()[0];
}

const getState = () => JSON.parse(call('GetState'));
const move = dir => call('MoveFocused', new GLib.Variant('(s)', [dir]));
const span = dir => call('SpanFocused', new GLib.Variant('(s)', [dir]));
const moveToCell = (monitor, c) => call('MoveFocusedToCell',
    new GLib.Variant('(iiiii)', [monitor, c.col, c.row, c.colSpan, c.rowSpan]));

function sleepMs(ms) {
    const loop = new GLib.MainLoop(null, false);
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
        loop.quit();
        return GLib.SOURCE_REMOVE;
    });
    loop.run();
}

let failures = 0;
let checks = 0;

// Wayland aplica move/resize de forma assíncrona: sempre esperar com polling.
function expectRect(label, expected, tolerance = 2) {
    checks++;
    let last = null;
    for (let i = 0; i < 40; i++) {
        last = getState().focus?.rect ?? null;
        if (last && Grid.rectsAlmostEqual(last, expected, tolerance)) {
            print(`✓ ${label}`);
            return;
        }
        sleepMs(100);
    }
    failures++;
    print(`✗ ${label}\n    esperado ${JSON.stringify(expected)}\n    obtido   ${JSON.stringify(last)}`);
}

function expectState(label, predicate) {
    checks++;
    let state = null;
    for (let i = 0; i < 40; i++) {
        state = getState();
        if (predicate(state)) {
            print(`✓ ${label}`);
            return;
        }
        sleepMs(100);
    }
    failures++;
    print(`✗ ${label}\n    último estado: ${JSON.stringify(state?.focus)}`);
}

const cell = (col, row, colSpan = 1, rowSpan = 1) => ({col, row, colSpan, rowSpan});

// ---- espera a janela de teste ganhar foco ----
let state = null;
for (let i = 0; i < 60; i++) {
    state = getState();
    if (state.focus)
        break;
    sleepMs(250);
}
if (!state?.focus) {
    print('✗ nenhuma janela focada no headless');
    System.exit(1);
}
print(`janela focada: "${state.focus.title}" · monitores: ${
    state.monitors.map(m => `${m.index}=${m.connector}`).join(', ')}`);

if (state.monitors.length < 2) {
    print('✗ esperava 2 monitores virtuais');
    System.exit(1);
}

// ---- configura grades por conector (exercita o live-reload) ----
const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
    ARGV[0], Gio.SettingsSchemaSource.get_default(), false);
const settings = new Gio.Settings({
    settings_schema: schemaSource.lookup(SCHEMA_ID, false),
});
const connectorOf = index => state.monitors.find(m => m.index === index).connector;
settings.set_string('monitor-grids', JSON.stringify({
    [connectorOf(0)]: {rows: 2, cols: 3},
    [connectorOf(1)]: {rows: 1, cols: 2},
}));
settings.set_int('gap', 0);
Gio.Settings.sync();

expectState('live-reload: monitor 0 virou 3×2',
    s => s.monitors.find(m => m.index === 0)?.grid.cols === 3 &&
        s.monitors.find(m => m.index === 0)?.grid.rows === 2);

state = getState();
const m0 = state.monitors.find(m => m.index === 0);
const m1 = state.monitors.find(m => m.index === 1);
const rect0 = c => Grid.cellRect(m0.workArea, m0.grid, c, 0);
const rect1 = c => Grid.cellRect(m1.workArea, m1.grid, c, 0);

// ---- movimentos ----
moveToCell(0, cell(0, 0));
expectRect('célula (0,0) do monitor 0', rect0(cell(0, 0)));

move('right');
expectRect('right → (1,0)', rect0(cell(1, 0)));

move('right');
expectRect('right → (2,0)', rect0(cell(2, 0)));

move('right');
expectRect('right na borda → monitor 1, célula (0,0)', rect1(cell(0, 0)));

move('down');
expectRect('down sem linha abaixo: no-op', rect1(cell(0, 0)));

move('left');
expectRect('left → volta ao monitor 0 pela coluna 2', rect0(cell(2, 0)));

span('left');
expectRect('span left cresce → colunas 1-2', rect0(cell(1, 0, 2, 1)));

move('up');
expectState('up na linha 0 maximiza', s => s.focus?.maximized === true);

move('down');
expectState('down desmaximiza', s => s.focus?.maximized === false);
expectRect('e restaura a célula anterior', rect0(cell(1, 0, 2, 1)));

move('down');
expectRect('down → linha 1', rect0(cell(1, 1, 2, 1)));

span('right');
expectRect('span right na borda encolhe pela esquerda → célula (2,1)',
    rect0(cell(2, 1)));

// ---- gap dinâmico ----
settings.set_int('gap', 12);
Gio.Settings.sync();
expectState('gap=12 propagado ao shell', s => s.gap === 12);
moveToCell(0, cell(0, 1));
expectRect('gap=12 aplicado na célula (0,1)',
    Grid.cellRect(m0.workArea, m0.grid, cell(0, 1), 12));

settings.set_int('gap', 0);
Gio.Settings.sync();

print(failures > 0
    ? `\n${failures}/${checks} verificações E2E FALHARAM`
    : `\n✓ ${checks} verificações E2E passaram`);
System.exit(failures > 0 ? 1 : 0);
