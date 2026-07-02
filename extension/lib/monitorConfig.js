import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Resolve a grade (linhas × colunas) de cada monitor a partir do gsettings,
// chaveada pelo CONECTOR (DP-1, HDMI-1, ...) — obrigatório aqui porque há
// monitores de modelo idêntico em portas diferentes.
export class MonitorConfigManager {
    constructor(settings) {
        this._settings = settings;
        this._listeners = new Set();
        this._grids = {};
        this._gap = 0;
        this._defaults = {rows: 1, cols: 2};
        this._connectorByIndex = new Map();

        this._settingsChangedId = settings.connect('changed', (_s, key) => {
            if (['monitor-grids', 'default-rows', 'default-cols', 'gap'].includes(key)) {
                this._loadSettings();
                this._emit();
            }
        });
        this._monitorsChangedId = Main.layoutManager.connect('monitors-changed', () => {
            this._mapConnectors();
            this._emit();
        });

        this._loadSettings();
        this._mapConnectors();
    }

    _loadSettings() {
        this._defaults = {
            rows: this._settings.get_int('default-rows'),
            cols: this._settings.get_int('default-cols'),
        };
        this._gap = this._settings.get_int('gap');
        try {
            const parsed = JSON.parse(this._settings.get_string('monitor-grids'));
            this._grids = parsed && typeof parsed === 'object' ? parsed : {};
        } catch (e) {
            console.warn(`[MWO] monitor-grids inválido, usando defaults: ${e.message}`);
            this._grids = {};
        }
    }

    _mapConnectors() {
        this._connectorByIndex.clear();
        try {
            const monitorManager = global.backend.get_monitor_manager();
            for (const logical of monitorManager.get_logical_monitors()) {
                const monitors = logical.get_monitors();
                if (monitors.length > 0)
                    this._connectorByIndex.set(logical.get_number(), monitors[0].get_connector());
            }
        } catch (e) {
            // Sem mapeamento todos os monitores caem nos defaults — degradação suave.
            console.warn(`[MWO] falha ao mapear conectores: ${e.message}`);
        }
    }

    get gap() {
        return this._gap;
    }

    connectorForMonitor(index) {
        return this._connectorByIndex.get(index) ?? null;
    }

    gridForMonitor(index) {
        const connector = this.connectorForMonitor(index);
        const entry = connector ? this._grids[connector] : null;
        const rows = Math.min(Math.max(1, (entry?.rows ?? this._defaults.rows) | 0), 8);
        const cols = Math.min(Math.max(1, (entry?.cols ?? this._defaults.cols) | 0), 8);
        return {rows, cols};
    }

    monitorsSnapshot() {
        return [...this._connectorByIndex.entries()].map(([index, connector]) => ({
            index,
            connector,
            grid: this.gridForMonitor(index),
        }));
    }

    onChanged(callback) {
        this._listeners.add(callback);
    }

    _emit() {
        for (const callback of this._listeners) {
            try {
                callback();
            } catch (e) {
                console.warn(`[MWO] listener de config falhou: ${e.message}`);
            }
        }
    }

    destroy() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }
        if (this._monitorsChangedId) {
            Main.layoutManager.disconnect(this._monitorsChangedId);
            this._monitorsChangedId = 0;
        }
        this._listeners.clear();
        this._connectorByIndex.clear();
    }
}
