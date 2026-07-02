import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Grid from './grid.js';

// Popup modal com a miniatura da grade do monitor da janela focada.
// Setas selecionam a célula, Shift+setas expandem o span, Enter/clique
// aplicam, Esc cancela.
export class GridPopup {
    constructor(config, mover) {
        this._config = config;
        this._mover = mover;
        this._backdrop = null;
        this._frameBox = null;
        this._grab = null;
        this._window = null;
        this._monitor = -1;
        this._grid = null;
        this._selection = null;
        this._cellWidgets = [];
    }

    open() {
        if (this._backdrop)
            return;
        if (Main.overview.visible)
            return;
        const window = global.display.focus_window;
        if (!this._mover.isTileable(window))
            return;

        const monitor = window.get_monitor();
        const grid = this._config.gridForMonitor(monitor);
        const waRect = window.get_work_area_for_monitor(monitor);
        const wa = {x: waRect.x, y: waRect.y, width: waRect.width, height: waRect.height};
        const frame = window.get_frame_rect();

        this._window = window;
        this._monitor = monitor;
        this._grid = grid;
        this._selection = Grid.inferCell(wa, grid,
            {x: frame.x, y: frame.y, width: frame.width, height: frame.height},
            this._config.gap);

        const monitorGeometry = Main.layoutManager.monitors[monitor];
        this._backdrop = new St.Widget({
            style_class: 'mwo-popup-backdrop',
            reactive: true,
            can_focus: true,
            x: monitorGeometry.x,
            y: monitorGeometry.y,
            width: monitorGeometry.width,
            height: monitorGeometry.height,
            layout_manager: new Clutter.BinLayout(),
        });

        this._frameBox = new St.BoxLayout({
            style_class: 'mwo-popup-frame',
            vertical: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._frameBox.add_child(new St.Label({
            style_class: 'mwo-popup-title',
            text: `Grade ${grid.cols}×${grid.rows} — setas movem, Shift expande, Enter aplica`,
        }));

        // miniatura proporcional ao work area do monitor
        const miniWidth = Math.round(Math.min(560, wa.width * 0.35));
        const miniHeight = Math.max(120, Math.round(miniWidth * wa.height / wa.width));
        const gridArea = new St.Widget({width: miniWidth, height: miniHeight, reactive: false});
        const miniWa = {x: 0, y: 0, width: miniWidth, height: miniHeight};
        this._cellWidgets = [];
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const rect = Grid.cellRect(miniWa, grid, {col, row, colSpan: 1, rowSpan: 1}, 4);
                const button = new St.Button({style_class: 'mwo-popup-cell', track_hover: true});
                button.set_position(rect.x, rect.y);
                button.set_size(rect.width, rect.height);
                button.connect('clicked', () => {
                    this._selection = {col, row, colSpan: 1, rowSpan: 1};
                    this._apply();
                });
                button.connect('notify::hover', () => {
                    if (button.hover) {
                        this._selection = {col, row, colSpan: 1, rowSpan: 1};
                        this._updateHighlight();
                    }
                });
                gridArea.add_child(button);
                this._cellWidgets.push({col, row, widget: button});
            }
        }
        this._frameBox.add_child(gridArea);
        this._backdrop.add_child(this._frameBox);

        this._backdrop.connect('key-press-event',
            (_actor, event) => this._onKeyPress(event));
        this._backdrop.connect('button-press-event',
            (_actor, event) => this._onBackdropPress(event));

        Main.uiGroup.add_child(this._backdrop);
        this._grab = Main.pushModal(this._backdrop, {actionMode: Shell.ActionMode.POPUP});
        if (this._grab.get_seat_state?.() === Clutter.GrabState.NONE) {
            // outro modal segura o input — desistir sem quebrar nada
            this.close();
            return;
        }
        this._backdrop.grab_key_focus();
        this._updateHighlight();
    }

    close() {
        if (this._grab) {
            Main.popModal(this._grab);
            this._grab = null;
        }
        this._backdrop?.destroy();
        this._backdrop = null;
        this._frameBox = null;
        this._cellWidgets = [];
        this._window = null;
        this._grid = null;
        this._monitor = -1;
        this._selection = null;
    }

    destroy() {
        this.close();
    }

    _apply() {
        const {_window: window, _monitor: monitor, _selection: selection} = this;
        this.close();
        if (window && selection)
            this._mover.moveToCell(window, monitor, selection);
    }

    _onBackdropPress(event) {
        const [px, py] = event.get_coords();
        const [fx, fy] = this._frameBox.get_transformed_position();
        const [fw, fh] = this._frameBox.get_transformed_size();
        const inside = px >= fx && px < fx + fw && py >= fy && py < fy + fh;
        if (!inside) {
            this.close();
            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _onKeyPress(event) {
        const symbol = event.get_key_symbol();
        const shift = (event.get_state() & Clutter.ModifierType.SHIFT_MASK) !== 0;
        switch (symbol) {
        case Clutter.KEY_Escape:
            this.close();
            return Clutter.EVENT_STOP;
        case Clutter.KEY_Return:
        case Clutter.KEY_KP_Enter:
        case Clutter.KEY_space:
            this._apply();
            return Clutter.EVENT_STOP;
        case Clutter.KEY_Left:
        case Clutter.KEY_KP_Left:
            this._moveSelection('left', shift);
            return Clutter.EVENT_STOP;
        case Clutter.KEY_Right:
        case Clutter.KEY_KP_Right:
            this._moveSelection('right', shift);
            return Clutter.EVENT_STOP;
        case Clutter.KEY_Up:
        case Clutter.KEY_KP_Up:
            this._moveSelection('up', shift);
            return Clutter.EVENT_STOP;
        case Clutter.KEY_Down:
        case Clutter.KEY_KP_Down:
            this._moveSelection('down', shift);
            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _moveSelection(dir, extend) {
        if (extend) {
            const pressed = Grid.pressSpan(this._grid, this._selection, dir);
            if (pressed)
                this._selection = pressed;
        } else {
            const single = {
                col: this._selection.col,
                row: this._selection.row,
                colSpan: 1,
                rowSpan: 1,
            };
            this._selection = Grid.moveWithinGrid(this._grid, single, dir).cell;
        }
        this._updateHighlight();
    }

    _updateHighlight() {
        const s = this._selection;
        for (const {col, row, widget} of this._cellWidgets) {
            const selected = col >= s.col && col < s.col + s.colSpan &&
                row >= s.row && row < s.row + s.rowSpan;
            if (selected)
                widget.add_style_class_name('mwo-popup-cell-selected');
            else
                widget.remove_style_class_name('mwo-popup-cell-selected');
        }
    }
}
