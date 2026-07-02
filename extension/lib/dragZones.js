import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Mtk from 'gi://Mtk';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {TilePreview} from 'resource:///org/gnome/shell/ui/windowManager.js';
import * as Grid from './grid.js';

const POLL_MS = 33;
// Meta.GrabOp.MOVING_UNCONSTRAINED === MOVING | 1024; mascarar antes de comparar.
const UNCONSTRAINED_FLAG = 1024;

// Encaixe ao arrastar: sem modificador, as bordas da tela viram zonas
// (topo = maximizar, como no gesto nativo); segurando Ctrl, a grade inteira
// aparece como zonas. Eventos de motion não chegam durante o grab do
// compositor, então a posição do ponteiro é lida por polling.
export class DragZones {
    constructor(settings, config, mover) {
        this._settings = settings;
        this._config = config;
        this._mover = mover;
        this._mutterSettings = null;
        this._grabWindow = null;
        this._target = null; // {monitor, cell} | {monitor, maximize: true} | null
        this._timerId = 0;
        this._preview = null;
        this._previewRect = null;
        this._overlay = null;
        this._overlaySignature = null;
        this._overlayCells = [];
        this._settingsChangedId = 0;
        this._grabBeginId = 0;
        this._grabEndId = 0;
    }

    enable() {
        this._mutterSettings = new Gio.Settings({schema_id: 'org.gnome.mutter'});
        this._settingsChangedId = this._settings.connect('changed::enable-drag-zones',
            () => this._syncEdgeTilingOverride());
        this._syncEdgeTilingOverride();

        this._grabBeginId = global.display.connect('grab-op-begin',
            (_display, window, op) => this._onGrabBegin(window, op));
        this._grabEndId = global.display.connect('grab-op-end',
            (_display, window, _op) => this._onGrabEnd(window));
    }

    disable() {
        this._stopTracking();
        this._destroyOverlay();
        if (this._preview) {
            this._preview.destroy();
            this._preview = null;
        }
        if (this._grabBeginId) {
            global.display.disconnect(this._grabBeginId);
            this._grabBeginId = 0;
        }
        if (this._grabEndId) {
            global.display.disconnect(this._grabEndId);
            this._grabEndId = 0;
        }
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }
        this._restoreEdgeTiling();
        this._mutterSettings = null;
        this._grabWindow = null;
        this._target = null;
    }

    // O half-tiling nativo (edge-tiling) precisa sair do caminho enquanto as
    // zonas estão ativas. A sentinela did-disable-edge-tiling é gravada ANTES
    // da mutação: se o shell morrer no meio, o próximo disable ainda sabe que
    // o valor original era true.
    _syncEdgeTilingOverride() {
        if (this._settings.get_boolean('enable-drag-zones')) {
            if (this._mutterSettings.get_boolean('edge-tiling')) {
                this._settings.set_boolean('did-disable-edge-tiling', true);
                this._mutterSettings.set_boolean('edge-tiling', false);
            }
        } else {
            this._restoreEdgeTiling();
        }
    }

    _restoreEdgeTiling() {
        if (this._settings.get_boolean('did-disable-edge-tiling')) {
            this._mutterSettings?.set_boolean('edge-tiling', true);
            this._settings.set_boolean('did-disable-edge-tiling', false);
        }
    }

    _onGrabBegin(window, op) {
        if (!this._settings.get_boolean('enable-drag-zones'))
            return;
        if ((op & ~UNCONSTRAINED_FLAG) !== Meta.GrabOp.MOVING)
            return;
        if (!this._mover.isTileable(window))
            return;
        this._grabWindow = window;
        this._target = null;
        this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, POLL_MS, () => {
            this._tick();
            return GLib.SOURCE_CONTINUE;
        });
    }

    // A decisão de "esse grab nos interessa" é tomada no begin: no end o op
    // não é confiável.
    _onGrabEnd(window) {
        if (!this._grabWindow || window !== this._grabWindow)
            return;
        const target = this._target;
        this._stopTracking();
        this._grabWindow = null;
        this._target = null;
        if (!target)
            return;
        if (target.maximize)
            window.maximize();
        else
            this._mover.moveToCell(window, target.monitor, target.cell);
    }

    _tick() {
        const [x, y, mods] = global.get_pointer();
        // Durante o grab o estado carrega bits extras — testar por máscara,
        // nunca por igualdade.
        const ctrlHeld = (mods & Clutter.ModifierType.CONTROL_MASK) !== 0;
        const monitor = this._monitorAt(x, y);
        if (monitor < 0) {
            this._hideOverlay();
            this._setTarget(null);
            return;
        }
        const wa = this._workAreaFor(monitor);
        const grid = this._config.gridForMonitor(monitor);

        if (ctrlHeld) {
            this._showOverlay(monitor, wa, grid);
            this._setTarget({monitor, cell: Grid.cellAtPoint(wa, grid, x, y)});
        } else {
            this._hideOverlay();
            const threshold = this._settings.get_int('edge-threshold');
            const zone = Grid.edgeCellAtPoint(wa, grid, x, y, threshold);
            if (!zone)
                this._setTarget(null);
            else if (zone.maximize)
                this._setTarget({monitor, maximize: true});
            else
                this._setTarget({monitor, cell: zone});
        }
    }

    _workAreaFor(monitor) {
        const rect = Main.layoutManager.getWorkAreaForMonitor(monitor);
        return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
    }

    _monitorAt(x, y) {
        for (const m of Main.layoutManager.monitors) {
            if (x >= m.x && x < m.x + m.width && y >= m.y && y < m.y + m.height)
                return m.index;
        }
        return -1;
    }

    _setTarget(target) {
        this._target = target;
        if (!target) {
            this._previewRect = null;
            this._preview?.close();
            this._highlightOverlayCell(-1, -1);
            return;
        }
        const wa = this._workAreaFor(target.monitor);
        const grid = this._config.gridForMonitor(target.monitor);
        const rect = target.maximize
            ? wa
            : Grid.cellRect(wa, grid, target.cell, this._config.gap);
        if (target.maximize)
            this._highlightOverlayCell(-1, -1);
        else
            this._highlightOverlayCell(target.cell.col, target.cell.row);
        if (!this._previewRect || !Grid.rectsAlmostEqual(this._previewRect, rect, 0)) {
            this._previewRect = rect;
            this._ensurePreview().open(this._grabWindow,
                new Mtk.Rectangle({x: rect.x, y: rect.y, width: rect.width, height: rect.height}),
                target.monitor);
        }
    }

    _ensurePreview() {
        if (!this._preview) {
            this._preview = new TilePreview();
            if (!this._preview.get_parent())
                global.window_group.add_child(this._preview);
        }
        return this._preview;
    }

    _showOverlay(monitor, wa, grid) {
        const gap = this._config.gap;
        const signature =
            `${monitor}:${grid.rows}x${grid.cols}:${wa.x},${wa.y},${wa.width},${wa.height}:${gap}`;
        if (this._overlay && this._overlaySignature === signature) {
            this._overlay.show();
            return;
        }
        this._destroyOverlay();
        this._overlaySignature = signature;
        this._overlay = new St.Widget({reactive: false});
        this._overlayCells = [];
        const visualGap = Math.max(gap, 8); // separação visível mesmo com gap 0
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const rect = Grid.cellRect(wa, grid, {col, row, colSpan: 1, rowSpan: 1}, visualGap);
                const widget = new St.Widget({style_class: 'mwo-zone', reactive: false});
                widget.set_position(rect.x, rect.y);
                widget.set_size(rect.width, rect.height);
                this._overlay.add_child(widget);
                this._overlayCells.push({col, row, widget});
            }
        }
        Main.uiGroup.add_child(this._overlay);
    }

    _highlightOverlayCell(col, row) {
        for (const entry of this._overlayCells) {
            if (entry.col === col && entry.row === row)
                entry.widget.add_style_class_name('mwo-zone-active');
            else
                entry.widget.remove_style_class_name('mwo-zone-active');
        }
    }

    _hideOverlay() {
        this._overlay?.hide();
    }

    _destroyOverlay() {
        this._overlay?.destroy();
        this._overlay = null;
        this._overlaySignature = null;
        this._overlayCells = [];
    }

    _stopTracking() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }
        this._preview?.close();
        this._previewRect = null;
        this._hideOverlay();
    }
}
