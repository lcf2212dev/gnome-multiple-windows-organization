import Gio from 'gi://Gio';
import Meta from 'gi://Meta';

// Interface D-Bus para scripting e testes automatizados. Exportada na conexão
// do próprio gnome-shell, então é alcançável via destino org.gnome.Shell:
//   gdbus call --session --dest org.gnome.Shell \
//     --object-path /br/dev/lcf2212/MultipleWindowsOrganization \
//     --method br.dev.lcf2212.MultipleWindowsOrganization.MoveFocused right
const IFACE = `
<node>
  <interface name="br.dev.lcf2212.MultipleWindowsOrganization">
    <method name="MoveFocused">
      <arg type="s" name="direction" direction="in"/>
      <arg type="s" name="result" direction="out"/>
    </method>
    <method name="SpanFocused">
      <arg type="s" name="direction" direction="in"/>
      <arg type="s" name="result" direction="out"/>
    </method>
    <method name="MoveFocusedToCell">
      <arg type="i" name="monitor" direction="in"/>
      <arg type="i" name="col" direction="in"/>
      <arg type="i" name="row" direction="in"/>
      <arg type="i" name="colSpan" direction="in"/>
      <arg type="i" name="rowSpan" direction="in"/>
      <arg type="s" name="result" direction="out"/>
    </method>
    <method name="OrganizeFocusedMonitor">
      <arg type="s" name="result" direction="out"/>
    </method>
    <method name="GetState">
      <arg type="s" name="json" direction="out"/>
    </method>
  </interface>
</node>`;

const OBJECT_PATH = '/br/dev/lcf2212/MultipleWindowsOrganization';

export class MwoDBus {
    constructor(config, mover) {
        this._config = config;
        this._mover = mover;
        this._impl = null;
    }

    enable() {
        this._impl = Gio.DBusExportedObject.wrapJSObject(IFACE, this);
        this._impl.export(Gio.DBus.session, OBJECT_PATH);
    }

    disable() {
        this._impl?.unexport();
        this._impl = null;
    }

    // Janela focada ou, na falta (ex.: overview aberto), a janela normal mais
    // recente — deixa o hook utilizável em scripts independentemente do foco.
    _window() {
        return global.display.focus_window ??
            global.display.get_tab_list(Meta.TabList.NORMAL, null)[0] ?? null;
    }

    MoveFocused(direction) {
        const window = this._window();
        if (!window)
            return 'no-window';
        if (!['left', 'right', 'up', 'down'].includes(direction))
            return 'bad-direction';
        this._mover.moveDirection(window, direction);
        return 'ok';
    }

    SpanFocused(direction) {
        const window = this._window();
        if (!window)
            return 'no-window';
        if (!['left', 'right', 'up', 'down'].includes(direction))
            return 'bad-direction';
        this._mover.spanDirection(window, direction);
        return 'ok';
    }

    MoveFocusedToCell(monitor, col, row, colSpan, rowSpan) {
        const window = this._window();
        if (!window)
            return 'no-window';
        const ok = this._mover.moveToCell(window, monitor, {col, row, colSpan, rowSpan});
        return ok ? 'ok' : 'not-tileable';
    }

    OrganizeFocusedMonitor() {
        const window = this._window();
        if (!window)
            return 'no-window';
        return `ok:${this._mover.organizeMonitor(window)}`;
    }

    GetState() {
        const workspace = global.workspace_manager.get_active_workspace();
        const rect = r => ({x: r.x, y: r.y, width: r.width, height: r.height});
        const focus = this._window();
        return JSON.stringify({
            gap: this._config.gap,
            monitors: this._config.monitorsSnapshot().map(m => ({
                ...m,
                workArea: rect(workspace.get_work_area_for_monitor(m.index)),
            })),
            focus: focus
                ? {
                    title: focus.get_title(),
                    monitor: focus.get_monitor(),
                    maximized: focus.is_maximized(),
                    cell: this._mover.cellOf(focus),
                    rect: rect(focus.get_frame_rect()),
                }
                : null,
        });
    }
}
