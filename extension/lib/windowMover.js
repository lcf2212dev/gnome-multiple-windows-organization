import Meta from 'gi://Meta';
import * as Grid from './grid.js';

// Aplica células/spans em Meta.Window e mantém o estado "em que célula esta
// janela está" — invalidado quando o usuário inicia um grab (arrastar ou
// redimensionar por conta própria) e limpo quando a janela morre.
export class WindowMover {
    constructor(config) {
        this._config = config;
        this._states = new Map(); // Meta.Window → {unmanagedId, monitor, cell}

        // Qualquer grab do usuário tira a janela da grade lógica; se ela for
        // solta numa zona, o DragZones re-registra via moveToCell no fim.
        this._grabOpId = global.display.connect('grab-op-begin',
            (_display, window, _op) => {
                if (window && this._states.has(window))
                    this._forget(window);
            });
    }

    isTileable(window) {
        if (!window || window.window_type !== Meta.WindowType.NORMAL ||
            window.is_fullscreen())
            return false;
        // Maximizada: allows_move/resize retornam false, mas ela é elegível —
        // todo caminho de aplicação desmaximiza antes de mover.
        if (window.is_maximized())
            return true;
        return window.allows_move() && window.allows_resize();
    }

    _workAreaFor(window, monitorIndex) {
        const rect = window.get_work_area_for_monitor(monitorIndex);
        return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
    }

    _frameOf(window) {
        const rect = window.get_frame_rect();
        return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
    }

    _forget(window) {
        const state = this._states.get(window);
        if (!state)
            return;
        window.disconnect(state.unmanagedId);
        this._states.delete(window);
    }

    _remember(window, monitor, cell) {
        let state = this._states.get(window);
        if (!state) {
            state = {unmanagedId: window.connect('unmanaged', () => this._forget(window))};
            this._states.set(window, state);
        }
        state.monitor = monitor;
        state.cell = cell;
    }

    _currentCell(window, monitor, grid) {
        const state = this._states.get(window);
        if (state?.cell && state.monitor === monitor)
            return {cell: Grid.clampCell(grid, state.cell), tracked: true};
        const workArea = this._workAreaFor(window, monitor);
        const cell = Grid.inferCell(workArea, grid, this._frameOf(window), this._config.gap);
        return {cell, tracked: false};
    }

    moveToCell(window, monitorIndex, cell) {
        if (!this.isTileable(window))
            return false;
        if (window.is_maximized())
            window.unmaximize();
        const grid = this._config.gridForMonitor(monitorIndex);
        const clamped = Grid.clampCell(grid, cell);
        const workArea = this._workAreaFor(window, monitorIndex);
        const rect = Grid.cellRect(workArea, grid, clamped, this._config.gap);
        window.move_resize_frame(true, rect.x, rect.y, rect.width, rect.height);
        this._remember(window, monitorIndex, clamped);
        return true;
    }

    moveDirection(window, dir) {
        if (!this.isTileable(window))
            return;
        const monitor = window.get_monitor();
        const grid = this._config.gridForMonitor(monitor);

        if (window.is_maximized()) {
            if (dir === 'up')
                return;
            if (dir === 'down') {
                const state = this._states.get(window);
                window.unmaximize();
                if (state?.cell && state.monitor === monitor)
                    this.moveToCell(window, monitor, state.cell);
                return;
            }
            // esquerda/direita a partir de maximizada: coluna cheia na borda,
            // preservando a memória muscular do half-tile nativo
            window.unmaximize();
            const col = dir === 'left' ? 0 : grid.cols - 1;
            this.moveToCell(window, monitor, {col, row: 0, colSpan: 1, rowSpan: grid.rows});
            return;
        }

        const {cell: current, tracked} = this._currentCell(window, monitor, grid);
        const {cell: moved, atEdge} = Grid.moveWithinGrid(grid, current, dir);

        if (!atEdge) {
            this.moveToCell(window, monitor, moved);
            return;
        }

        if (dir === 'up') {
            // acima da primeira linha: maximizar (célula fica guardada para o down)
            this._remember(window, monitor, current);
            window.maximize();
            return;
        }
        if (dir === 'down')
            return;

        if (!tracked) {
            // janela flutuante: o primeiro aperto só encaixa na célula inferida
            this.moveToCell(window, monitor, current);
            return;
        }

        const direction = dir === 'left' ? Meta.DisplayDirection.LEFT : Meta.DisplayDirection.RIGHT;
        const neighbor = global.display.get_monitor_neighbor_index(monitor, direction);
        if (neighbor < 0)
            return;
        const targetGrid = this._config.gridForMonitor(neighbor);
        const colSpan = Math.min(current.colSpan, targetGrid.cols);
        const rowSpan = Math.min(current.rowSpan, targetGrid.rows);
        const col = dir === 'left' ? targetGrid.cols - colSpan : 0;
        this.moveToCell(window, neighbor, {col, row: current.row, colSpan, rowSpan});
    }

    spanDirection(window, dir) {
        if (!this.isTileable(window) || window.is_maximized())
            return;
        const monitor = window.get_monitor();
        const grid = this._config.gridForMonitor(monitor);
        const {cell: current} = this._currentCell(window, monitor, grid);
        const pressed = Grid.pressSpan(grid, current, dir);
        if (pressed)
            this.moveToCell(window, monitor, pressed);
    }

    cellOf(window) {
        return this._states.get(window)?.cell ?? null;
    }

    destroy() {
        if (this._grabOpId) {
            global.display.disconnect(this._grabOpId);
            this._grabOpId = 0;
        }
        for (const window of [...this._states.keys()])
            this._forget(window);
    }
}
