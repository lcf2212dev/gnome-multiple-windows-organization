import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MwoPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window.set_default_size(680, 760);
        window.add(this._buildMonitorsPage(settings));
        window.add(this._buildGeneralPage(settings));
        window.add(this._buildShortcutsPage(settings));
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

    // ---- página Monitores -------------------------------------------------

    _buildMonitorsPage(settings) {
        const page = new Adw.PreferencesPage({
            title: 'Monitores',
            icon_name: 'video-display-symbolic',
        });
        const group = new Adw.PreferencesGroup({
            title: 'Grade por monitor',
            description: 'Linhas × colunas de cada tela conectada. A configuração é ' +
                'guardada pelo conector (DP-1, HDMI-1, ...): se um monitor mudar de ' +
                'porta, configure de novo.',
        });
        page.add(group);

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
            row.add_row(this._gridSpinRow(settings, connector, 'cols', 'Colunas'));
            row.add_row(this._gridSpinRow(settings, connector, 'rows', 'Linhas'));
            group.add(row);
        }

        const orphans = Object.keys(this._readGrids(settings))
            .filter(connector => !connected.includes(connector));
        if (orphans.length > 0) {
            const orphanGroup = new Adw.PreferencesGroup({
                title: 'Configurações órfãs',
                description: 'Conectores com grade salva mas sem monitor presente',
            });
            page.add(orphanGroup);
            for (const connector of orphans) {
                const grids = this._readGrids(settings);
                const entry = grids[connector] ?? {};
                const row = new Adw.ActionRow({
                    title: connector,
                    subtitle: `desconectado — ${entry.cols ?? '?'}×${entry.rows ?? '?'}`,
                });
                const remove = new Gtk.Button({
                    icon_name: 'user-trash-symbolic',
                    valign: Gtk.Align.CENTER,
                    tooltip_text: 'Remover configuração',
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

    _gridSpinRow(settings, connector, key, title) {
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
        });
        return row;
    }

    // ---- página Geral -----------------------------------------------------

    _buildGeneralPage(settings) {
        const page = new Adw.PreferencesPage({
            title: 'Geral',
            icon_name: 'preferences-system-symbolic',
        });

        const gridGroup = new Adw.PreferencesGroup({
            title: 'Grade padrão',
            description: 'Usada por monitores sem configuração própria (1×2 imita o GNOME nativo)',
        });
        gridGroup.add(this._settingsSpinRow(settings, 'default-cols', 'Colunas', 1, 8));
        gridGroup.add(this._settingsSpinRow(settings, 'default-rows', 'Linhas', 1, 8));
        page.add(gridGroup);

        const behaviourGroup = new Adw.PreferencesGroup({title: 'Comportamento'});
        behaviourGroup.add(this._settingsSpinRow(settings, 'gap',
            'Espaço entre janelas (px)', 0, 64));
        const dragRow = new Adw.SwitchRow({
            title: 'Encaixar ao arrastar',
            subtitle: 'Bordas da tela viram zonas da grade (topo maximiza); ' +
                'segure Ctrl durante o arrasto para ver a grade completa',
        });
        settings.bind('enable-drag-zones', dragRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviourGroup.add(dragRow);
        const edgeRow = this._settingsSpinRow(settings, 'edge-threshold',
            'Espessura da zona de borda (px)', 8, 256);
        settings.bind('enable-drag-zones', edgeRow, 'sensitive', Gio.SettingsBindFlags.GET);
        behaviourGroup.add(edgeRow);
        page.add(behaviourGroup);

        return page;
    }

    _settingsSpinRow(settings, key, title, lower, upper) {
        const row = new Adw.SpinRow({
            title,
            adjustment: new Gtk.Adjustment({
                lower, upper, step_increment: 1,
                value: settings.get_int(key),
            }),
        });
        row.connect('notify::value', () => {
            const value = Math.round(row.get_value());
            if (settings.get_int(key) !== value)
                settings.set_int(key, value);
        });
        return row;
    }

    // ---- página Atalhos ---------------------------------------------------

    _buildShortcutsPage(settings) {
        const page = new Adw.PreferencesPage({
            title: 'Atalhos',
            icon_name: 'input-keyboard-symbolic',
        });

        const shortcutRow = (title, accelerator, subtitle = null) => {
            const row = new Adw.ActionRow({title, subtitle});
            row.add_suffix(new Gtk.ShortcutLabel({
                accelerator: accelerator || '',
                disabled_text: 'desativado',
                valign: Gtk.Align.CENTER,
            }));
            return row;
        };
        const fromSettings = (title, key) =>
            shortcutRow(title, settings.get_strv(key)[0] ?? '');

        const moveGroup = new Adw.PreferencesGroup({
            title: 'Mover na grade',
            description: 'Os atalhos nativos de tiling são assumidos pela grade ' +
                'enquanto a extensão está ativa (e devolvidos ao desativá-la)',
        });
        moveGroup.add(shortcutRow('Mover para a esquerda', '<Super>Left'));
        moveGroup.add(shortcutRow('Mover para a direita', '<Super>Right'));
        moveGroup.add(fromSettings('Subir / maximizar', 'move-up'));
        moveGroup.add(shortcutRow('Descer / restaurar', '<Super>Down'));
        page.add(moveGroup);

        const spanGroup = new Adw.PreferencesGroup({
            title: 'Expandir',
            description: 'Cresce uma célula na direção; na borda, encolhe pelo lado oposto',
        });
        spanGroup.add(fromSettings('Expandir para a esquerda', 'span-left'));
        spanGroup.add(fromSettings('Expandir para a direita', 'span-right'));
        spanGroup.add(fromSettings('Expandir para cima', 'span-up'));
        spanGroup.add(fromSettings('Expandir para baixo', 'span-down'));
        page.add(spanGroup);

        const popupGroup = new Adw.PreferencesGroup({title: 'Popup de grade'});
        popupGroup.add(fromSettings('Abrir popup', 'show-popup'));
        popupGroup.add(new Adw.ActionRow({
            title: 'Personalizar atalhos',
            subtitle: 'Edite as chaves em /org/gnome/shell/extensions/' +
                'multiple-windows-organization/ com o dconf-editor',
        }));
        page.add(popupGroup);

        return page;
    }
}
