import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Atalhos nativos assumidos enquanto a extensão está ativa. Restaurar com
// handler null devolve o comportamento builtin do Mutter (handler é nullable
// no GIR) — nada persistente é alterado, então crash não deixa rastro.
const TAKEOVER_NAMES = ['toggle-tiled-left', 'toggle-tiled-right', 'unmaximize'];

export class GridKeybindings {
    constructor(settings, mover, popup) {
        this._settings = settings;
        this._mover = mover;
        this._popup = popup;
        this._ownNames = [];
    }

    enable() {
        const move = dir => (_display, window) => {
            const target = window ?? global.display.focus_window;
            if (target)
                this._mover.moveDirection(target, dir);
        };
        const span = dir => (_display, window) => {
            const target = window ?? global.display.focus_window;
            if (target)
                this._mover.spanDirection(target, dir);
        };
        const organize = (_display, window) => {
            const target = window ?? global.display.focus_window;
            if (target)
                this._mover.organizeMonitor(target);
        };

        Main.wm.setCustomKeybindingHandler('toggle-tiled-left', Shell.ActionMode.NORMAL, move('left'));
        Main.wm.setCustomKeybindingHandler('toggle-tiled-right', Shell.ActionMode.NORMAL, move('right'));
        Main.wm.setCustomKeybindingHandler('unmaximize', Shell.ActionMode.NORMAL, move('down'));

        const add = (name, handler) => {
            Main.wm.addKeybinding(name, this._settings,
                Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, handler);
            this._ownNames.push(name);
        };
        add('move-up', move('up'));
        add('move-left', move('left'));
        add('move-right', move('right'));
        add('move-down', move('down'));
        for (const dir of ['left', 'right', 'up', 'down'])
            add(`span-${dir}`, span(dir));
        add('show-popup', () => this._popup?.open());
        add('organize-monitor', organize);
    }

    disable() {
        for (const name of TAKEOVER_NAMES)
            Main.wm.setCustomKeybindingHandler(name, Shell.ActionMode.NORMAL, null);
        for (const name of this._ownNames)
            Main.wm.removeKeybinding(name);
        this._ownNames = [];
    }
}
