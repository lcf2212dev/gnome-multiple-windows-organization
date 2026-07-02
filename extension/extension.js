import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {MonitorConfigManager} from './lib/monitorConfig.js';
import {WindowMover} from './lib/windowMover.js';
import {GridKeybindings} from './lib/keybindings.js';
import {DragZones} from './lib/dragZones.js';
import {GridPopup} from './lib/popup.js';
import {MwoDBus} from './lib/dbus.js';

export default class MwoExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._config = new MonitorConfigManager(this._settings);
        this._mover = new WindowMover(this._config);
        this._popup = new GridPopup(this._config, this._mover);
        this._keybindings = new GridKeybindings(this._settings, this._mover, this._popup);
        this._keybindings.enable();
        this._dragZones = new DragZones(this._settings, this._config, this._mover);
        this._dragZones.enable();
        this._dbus = new MwoDBus(this._config, this._mover);
        this._dbus.enable();
    }

    disable() {
        this._dbus?.disable();
        this._dbus = null;
        this._dragZones?.disable();
        this._dragZones = null;
        this._keybindings?.disable();
        this._keybindings = null;
        this._popup?.destroy();
        this._popup = null;
        this._mover?.destroy();
        this._mover = null;
        this._config?.destroy();
        this._config = null;
        this._settings = null;
    }
}
