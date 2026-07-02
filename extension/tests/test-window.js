// Janela GTK4 mínima para os testes headless.
// Uso: GDK_BACKEND=wayland WAYLAND_DISPLAY=wayland-N gjs -m test-window.js
import Gtk from 'gi://Gtk?version=4.0';

const app = new Gtk.Application({application_id: 'br.dev.lcf2212.MwoTestWindow'});
app.connect('activate', () => {
    const win = new Gtk.ApplicationWindow({
        application: app,
        title: 'MWO Test Window',
        default_width: 500,
        default_height: 400,
    });
    win.present();
});
app.run([]);
