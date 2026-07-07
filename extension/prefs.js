import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as gettext,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import * as I18n from './lib/i18n.js';

const PAGE_NAMES = Object.freeze({
    MONITORS: 'monitors',
    GENERAL: 'general',
    SHORTCUTS: 'shortcuts',
});

export default class MwoPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        this._settings = settings;
        this._window = window;
        this._pages = [];
        window.set_title(this._('Multiple Windows Organization'));
        window.set_default_size(760, 720);
        window.set_search_enabled?.(true);
        this._rebuildPreferencesWindow(window, settings);
    }

    _rebuildPreferencesWindow(window, settings, pageToRestore = null) {
        const visiblePageName = pageToRestore ??
            window.get_visible_page_name?.() ??
            PAGE_NAMES.MONITORS;
        for (const page of this._pages ?? [])
            window.remove(page);
        this._pages = [
            this._buildMonitorsPage(settings),
            this._buildGeneralPage(settings),
            this._buildShortcutsPage(settings),
        ];
        for (const page of this._pages)
            window.add(page);
        if (Object.values(PAGE_NAMES).includes(visiblePageName))
            window.set_visible_page_name(visiblePageName);
    }

    _(message) {
        return I18n.translate(message, this._settings, gettext);
    }

    _readGrids(settings) {
        try {
            const parsed = JSON.parse(settings.get_string('monitor-grids'));
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_e) {
            return {};
        }
    }

    _writeGrids(settings, grids) {
        settings.set_string('monitor-grids', JSON.stringify(grids));
    }

    _gridForConnector(settings, connector) {
        const grids = this._readGrids(settings);
        return {
            rows: grids[connector]?.rows ?? settings.get_int('default-rows'),
            cols: grids[connector]?.cols ?? settings.get_int('default-cols'),
        };
    }

    _gridLabel(settings, connector = null) {
        const grid = connector
            ? this._gridForConnector(settings, connector)
            : {
                rows: settings.get_int('default-rows'),
                cols: settings.get_int('default-cols'),
            };
        return `${grid.cols}×${grid.rows}`;
    }

    _hasCustomGrid(settings, connector) {
        return Object.prototype.hasOwnProperty.call(this._readGrids(settings), connector);
    }

    _rowIcon(iconName) {
        const icon = new Gtk.Image({
            icon_name: iconName,
            valign: Gtk.Align.CENTER,
        });
        icon.add_css_class('dim-label');
        return icon;
    }

    _layoutBadge(label) {
        const badge = new Gtk.Label({
            label,
            valign: Gtk.Align.CENTER,
            xalign: 0.5,
        });
        badge.add_css_class('caption');
        badge.add_css_class('dim-label');
        badge.add_css_class('numeric');
        return badge;
    }

    // ---- Monitors page -----------------------------------------------------

    _buildMonitorsPage(settings) {
        const page = new Adw.PreferencesPage({
            name: PAGE_NAMES.MONITORS,
            title: this._('Monitors'),
            icon_name: 'video-display-symbolic',
        });
        const group = new Adw.PreferencesGroup({
            title: this._('Grid per monitor'),
            description: this._('Rows × columns for each connected display. The setting is saved by connector (DP-1, HDMI-1, ...): if a monitor changes ports, configure it again.'),
        });
        page.add(group);

        const defaultRow = new Adw.ActionRow({
            title: this._('Default grid'),
            subtitle: this._('Used by monitors without their own setting (1×2 mimics native GNOME tiling)'),
        });
        defaultRow.add_prefix(this._rowIcon('view-grid-symbolic'));
        defaultRow.add_suffix(this._layoutBadge(this._gridLabel(settings)));
        group.add(defaultRow);

        const connected = [];
        const monitors = Gdk.Display.get_default().get_monitors();
        for (let i = 0; i < monitors.get_n_items(); i++) {
            const monitor = monitors.get_item(i);
            const connector = monitor.get_connector() ?? `monitor-${i}`;
            connected.push(connector);
            const geometry = monitor.get_geometry();
            const row = new Adw.ExpanderRow({
                title: monitor.get_description() || monitor.get_model() || connector,
                subtitle: `${connector} — ${geometry.width}×${geometry.height}`,
                expanded: true,
            });
            const badge = this._layoutBadge(this._gridLabel(settings, connector));
            const reset = new Gtk.Button({
                icon_name: 'edit-clear-symbolic',
                tooltip_text: this._('Remove setting'),
                valign: Gtk.Align.CENTER,
            });
            reset.add_css_class('flat');
            reset.add_css_class('circular');
            reset.set_sensitive(this._hasCustomGrid(settings, connector));
            reset.connect('clicked', () => {
                const current = this._readGrids(settings);
                delete current[connector];
                this._writeGrids(settings, current);
                this._rebuildPreferencesWindow(this._window, settings, PAGE_NAMES.MONITORS);
            });
            const refresh = () => {
                badge.set_label(this._gridLabel(settings, connector));
                reset.set_sensitive(this._hasCustomGrid(settings, connector));
            };

            row.add_prefix(this._rowIcon('video-display-symbolic'));
            row.add_suffix(badge);
            row.add_action(reset);
            row.add_row(this._gridSpinRow(settings, connector, 'cols', this._('Columns'), refresh));
            row.add_row(this._gridSpinRow(settings, connector, 'rows', this._('Rows'), refresh));
            group.add(row);
        }

        const orphans = Object.keys(this._readGrids(settings))
            .filter(connector => !connected.includes(connector));
        if (orphans.length > 0) {
            const orphanGroup = new Adw.PreferencesGroup({
                title: this._('Orphaned settings'),
                description: this._('Connectors with a saved grid but no currently connected monitor'),
            });
            page.add(orphanGroup);
            for (const connector of orphans) {
                const grids = this._readGrids(settings);
                const entry = grids[connector] ?? {};
                const row = new Adw.ActionRow({
                    title: connector,
                    subtitle: this._('disconnected — %s×%s').format(entry.cols ?? '?', entry.rows ?? '?'),
                });
                row.add_prefix(this._rowIcon('video-display-symbolic'));
                const remove = new Gtk.Button({
                    icon_name: 'user-trash-symbolic',
                    valign: Gtk.Align.CENTER,
                    tooltip_text: this._('Remove setting'),
                });
                remove.add_css_class('flat');
                remove.connect('clicked', () => {
                    const current = this._readGrids(settings);
                    delete current[connector];
                    this._writeGrids(settings, current);
                    row.hide();
                });
                row.add_suffix(remove);
                orphanGroup.add(row);
            }
        }
        return page;
    }

    _gridSpinRow(settings, connector, key, title, onChanged = null) {
        const grids = this._readGrids(settings);
        const initial = grids[connector]?.[key] ??
            settings.get_int(key === 'rows' ? 'default-rows' : 'default-cols');
        const row = new Adw.SpinRow({
            title,
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 8, step_increment: 1, value: initial,
            }),
        });
        row.connect('notify::value', () => {
            const current = this._readGrids(settings);
            const entry = current[connector] ?? {
                rows: settings.get_int('default-rows'),
                cols: settings.get_int('default-cols'),
            };
            entry[key] = Math.round(row.get_value());
            current[connector] = entry;
            this._writeGrids(settings, current);
            onChanged?.();
        });
        return row;
    }

    // ---- General page ------------------------------------------------------

    _buildGeneralPage(settings) {
        const page = new Adw.PreferencesPage({
            name: PAGE_NAMES.GENERAL,
            title: this._('General'),
            icon_name: 'preferences-system-symbolic',
        });

        const gridGroup = new Adw.PreferencesGroup({
            title: this._('Default grid'),
            description: this._('Used by monitors without their own setting (1×2 mimics native GNOME tiling)'),
        });
        gridGroup.add(this._settingsSpinRow(settings, 'default-cols', this._('Columns'), 1, 8,
            'view-grid-symbolic'));
        gridGroup.add(this._settingsSpinRow(settings, 'default-rows', this._('Rows'), 1, 8,
            'view-grid-symbolic'));
        page.add(gridGroup);

        const behaviourGroup = new Adw.PreferencesGroup({title: this._('Behavior')});
        behaviourGroup.add(this._settingsSpinRow(settings, 'gap',
            this._('Gap between windows (px)'), 0, 64, 'preferences-system-symbolic'));
        const dragRow = new Adw.SwitchRow({
            title: this._('Snap while dragging'),
            subtitle: this._('Screen edges become grid zones (top maximizes); hold Ctrl while dragging to show the full grid'),
        });
        dragRow.add_prefix(this._rowIcon('input-mouse-symbolic'));
        settings.bind('enable-drag-zones', dragRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviourGroup.add(dragRow);
        const edgeRow = this._settingsSpinRow(settings, 'edge-threshold',
            this._('Edge zone thickness (px)'), 8, 256, 'preferences-system-symbolic');
        settings.bind('enable-drag-zones', edgeRow, 'sensitive', Gio.SettingsBindFlags.GET);
        behaviourGroup.add(edgeRow);
        page.add(behaviourGroup);
        page.add(this._buildInterfaceGroup(settings));

        return page;
    }

    _buildInterfaceGroup(settings) {
        const group = new Adw.PreferencesGroup({
            title: this._('Interface'),
            description: this._('Choose the language used by this app. “Automatic” follows the GNOME/system language.'),
        });
        const languageRow = new Adw.ComboRow({
            title: this._('Language'),
            subtitle: this._('Applies immediately to this preferences window. The Shell popup follows the chosen language the next time it opens.'),
            model: Gtk.StringList.new(I18n.languageLabels(message => this._(message))),
            selected: I18n.languageIndex(settings),
        });
        languageRow.add_prefix(this._rowIcon('preferences-desktop-locale-symbolic'));
        languageRow.connect('notify::selected', () => {
            const selected = I18n.languageCodeAt(languageRow.get_selected());
            if (I18n.configuredLanguageCode(settings) === selected)
                return;
            settings.set_string('ui-language', selected);
            const visiblePageName = this._window.get_visible_page_name?.() ?? PAGE_NAMES.GENERAL;
            this._rebuildPreferencesWindow(this._window, settings, visiblePageName);
        });
        group.add(languageRow);
        return group;
    }

    _settingsSpinRow(settings, key, title, lower, upper, iconName = null) {
        const row = new Adw.SpinRow({
            title,
            adjustment: new Gtk.Adjustment({
                lower, upper, step_increment: 1,
                value: settings.get_int(key),
            }),
        });
        if (iconName)
            row.add_prefix(this._rowIcon(iconName));
        row.connect('notify::value', () => {
            const value = Math.round(row.get_value());
            if (settings.get_int(key) !== value)
                settings.set_int(key, value);
        });
        return row;
    }

    // ---- Shortcuts page ----------------------------------------------------

    _buildShortcutsPage(settings) {
        const page = new Adw.PreferencesPage({
            name: PAGE_NAMES.SHORTCUTS,
            title: this._('Shortcuts'),
            icon_name: 'input-keyboard-symbolic',
        });

        const shortcutRow = (title, accelerator, subtitle = null) => {
            const row = new Adw.ActionRow({title, subtitle});
            row.add_prefix(this._rowIcon('input-keyboard-symbolic'));
            row.add_suffix(new Gtk.ShortcutLabel({
                accelerator: accelerator || '',
                disabled_text: this._('disabled'),
                valign: Gtk.Align.CENTER,
            }));
            return row;
        };
        const fromSettings = (title, key, subtitle = null) =>
            shortcutRow(title, settings.get_strv(key)[0] ?? '', subtitle);

        const moveGroup = new Adw.PreferencesGroup({
            title: this._('Move in grid'),
            description: this._('Native tiling shortcuts are handled by the grid while the extension is active (and restored when disabled)'),
        });
        moveGroup.add(shortcutRow(this._('Move left'), '<Super>Left'));
        moveGroup.add(shortcutRow(this._('Move right'), '<Super>Right'));
        moveGroup.add(fromSettings(this._('Move up / maximize'), 'move-up'));
        moveGroup.add(shortcutRow(this._('Move down / restore'), '<Super>Down'));
        page.add(moveGroup);

        const spanGroup = new Adw.PreferencesGroup({
            title: this._('Expand'),
            description: this._('Grows one cell in the chosen direction; at the edge, shrinks from the opposite side'),
        });
        spanGroup.add(fromSettings(this._('Expand left'), 'span-left'));
        spanGroup.add(fromSettings(this._('Expand right'), 'span-right'));
        spanGroup.add(fromSettings(this._('Expand up'), 'span-up'));
        spanGroup.add(fromSettings(this._('Expand down'), 'span-down'));
        page.add(spanGroup);

        const autoGroup = new Adw.PreferencesGroup({
            title: this._('Automatic layout'),
            description: this._('Tile every movable window on the focused monitor'),
        });
        autoGroup.add(fromSettings(this._('Organize monitor'), 'organize-monitor',
            this._('Uses the monitor grid and expands it when there are more windows than cells')));
        page.add(autoGroup);

        const popupGroup = new Adw.PreferencesGroup({title: this._('Grid popup')});
        popupGroup.add(fromSettings(this._('Open popup'), 'show-popup'));
        const customizeRow = new Adw.ActionRow({
            title: this._('Customize shortcuts'),
            subtitle: this._('Edit keys under /org/gnome/shell/extensions/multiple-windows-organization/ with dconf-editor'),
        });
        customizeRow.add_prefix(this._rowIcon('document-edit-symbolic'));
        popupGroup.add(customizeRow);
        page.add(popupGroup);

        return page;
    }
}
