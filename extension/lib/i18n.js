import GLib from 'gi://GLib';

export const SYSTEM_LANGUAGE = 'system';

export const LANGUAGE_OPTIONS = Object.freeze([
    {code: SYSTEM_LANGUAGE, label: 'Automatic (system language)'},
    {code: 'en', label: 'English'},
    {code: 'pt', label: 'Português'},
    {code: 'es', label: 'Español'},
    {code: 'fr', label: 'Français'},
    {code: 'de', label: 'Deutsch'},
    {code: 'zh_CN', label: '中文'},
]);

const SUPPORTED_LANGUAGE_CODES = new Set(LANGUAGE_OPTIONS.map(option => option.code));
const TRANSLATIONS = {
    "de": {
        "Applies immediately to this preferences window. The Shell popup follows the chosen language the next time it opens.": "Wird sofort auf dieses Einstellungsfenster angewendet. Das Shell-Popup verwendet die gewählte Sprache beim nächsten Öffnen.",
        "Automatic (system language)": "Automatisch (Systemsprache)",
        "Automatic layout": "Automatische Anordnung",
        "Behavior": "Verhalten",
        "Choose the language used by this app. “Automatic” follows the GNOME/system language.": "Wählen Sie die Sprache dieser App. „Automatisch“ folgt der GNOME-/Systemsprache.",
        "Columns": "Spalten",
        "Configurable tiling grid (rows × columns) per monitor: keyboard shortcuts, drag zones, and a grid popup.": "Konfigurierbares Kachelraster (Zeilen × Spalten) pro Monitor: Tastenkürzel, Ziehzonen und Raster-Popup.",
        "Connectors with a saved grid but no currently connected monitor": "Anschlüsse mit gespeichertem Raster, aber ohne aktuell verbundenen Monitor",
        "Customize shortcuts": "Tastenkürzel anpassen",
        "Default columns for monitors without a custom setting": "Standardspalten für Monitore ohne eigene Einstellung",
        "Default grid": "Standardraster",
        "Default rows for monitors without a custom setting": "Standardzeilen für Monitore ohne eigene Einstellung",
        "Edge zone thickness (px)": "Dicke der Randzone (px)",
        "Edge zone thickness while dragging, in pixels": "Dicke der Randzone beim Ziehen, in Pixeln",
        "Edit keys under /org/gnome/shell/extensions/multiple-windows-organization/ with dconf-editor": "Bearbeiten Sie die Schlüssel unter /org/gnome/shell/extensions/multiple-windows-organization/ mit dconf-editor",
        "Expand": "Erweitern",
        "Expand down": "Nach unten erweitern",
        "Expand left": "Nach links erweitern",
        "Expand right": "Nach rechts erweitern",
        "Expand the window one cell down (at the edge: shrink from the top)": "Fenster eine Zelle nach unten erweitern (am Rand: von oben schrumpfen)",
        "Expand the window one cell left (at the edge: shrink from the right)": "Fenster eine Zelle nach links erweitern (am Rand: von rechts schrumpfen)",
        "Expand the window one cell right (at the edge: shrink from the left)": "Fenster eine Zelle nach rechts erweitern (am Rand: von links schrumpfen)",
        "Expand the window one cell up (at the edge: shrink from the bottom)": "Fenster eine Zelle nach oben erweitern (am Rand: von unten schrumpfen)",
        "Expand up": "Nach oben erweitern",
        "Gap between windows (px)": "Abstand zwischen Fenstern (px)",
        "General": "Allgemein",
        "Grid %d×%d — arrow keys move, Shift expands, Enter applies": "Raster %d×%d — Pfeiltasten verschieben, Umschalt erweitert, Eingabe übernimmt",
        "Grid per monitor": "Raster pro Monitor",
        "Grid popup": "Raster-Popup",
        "Grows one cell in the chosen direction; at the edge, shrinks from the opposite side": "Wächst um eine Zelle in die gewählte Richtung; am Rand schrumpft es von der gegenüberliegenden Seite",
        "Interface": "Oberfläche",
        "Internal sentinel: the extension disabled native edge tiling": "Interner Marker: Die Erweiterung hat natives Rand-Kacheln deaktiviert",
        "JSON keyed by connector, e.g. {\"DP-1\":{\"rows\":1,\"cols\":3}}": "JSON nach Anschluss, z. B. {\"DP-1\":{\"rows\":1,\"cols\":3}}",
        "Language": "Sprache",
        "Monitors": "Monitore",
        "Move down / restore": "Nach unten / wiederherstellen",
        "Move in grid": "Im Raster verschieben",
        "Move left": "Nach links verschieben",
        "Move right": "Nach rechts verschieben",
        "Move the window one cell down (optional; the default comes from native Super+Down)": "Fenster eine Zelle nach unten verschieben (optional; Standard kommt von nativem Super+Runter)",
        "Move the window one cell left (optional; the default comes from native Super+Left)": "Fenster eine Zelle nach links verschieben (optional; Standard kommt von nativem Super+Links)",
        "Move the window one cell right (optional; the default comes from native Super+Right)": "Fenster eine Zelle nach rechts verschieben (optional; Standard kommt von nativem Super+Rechts)",
        "Move the window one cell up (at the top: maximize)": "Fenster eine Zelle nach oben verschieben (oben: maximieren)",
        "Move up / maximize": "Nach oben / maximieren",
        "Multiple Windows Organization": "Fensterorganisation",
        "Native tiling shortcuts are handled by the grid while the extension is active (and restored when disabled)": "Native Kachel-Tastenkürzel werden vom Raster behandelt, solange die Erweiterung aktiv ist (und beim Deaktivieren wiederhergestellt)",
        "Open popup": "Popup öffnen",
        "Open the grid popup": "Raster-Popup öffnen",
        "Organize monitor": "Monitor anordnen",
        "Orphaned settings": "Verwaiste Einstellungen",
        "Remove setting": "Einstellung entfernen",
        "Rows": "Zeilen",
        "Rows × columns for each connected display. The setting is saved by connector (DP-1, HDMI-1, ...): if a monitor changes ports, configure it again.": "Zeilen × Spalten für jede verbundene Anzeige. Die Einstellung wird pro Anschluss gespeichert (DP-1, HDMI-1, ...): Wenn ein Monitor den Anschluss wechselt, konfigurieren Sie ihn erneut.",
        "Screen edges become grid zones (top maximizes); hold Ctrl while dragging to show the full grid": "Bildschirmränder werden zu Rasterzonen (oben maximiert); halten Sie beim Ziehen Strg gedrückt, um das ganze Raster zu zeigen",
        "Shortcuts": "Tastenkürzel",
        "Snap while dragging": "Beim Ziehen einrasten",
        "Snap windows to the grid while dragging": "Fenster beim Ziehen am Raster einrasten",
        "Space between cells and around edges, in logical pixels": "Abstand zwischen Zellen und an den Rändern, in logischen Pixeln",
        "Tile every movable window on the focused monitor": "Ordnet jedes verschiebbare Fenster auf dem fokussierten Monitor an",
        "Uses the monitor grid and expands it when there are more windows than cells": "Verwendet das Monitorraster und erweitert es, wenn es mehr Fenster als Zellen gibt",
        "Used by monitors without their own setting (1×2 mimics native GNOME tiling)": "Wird für Monitore ohne eigene Einstellung verwendet (1×2 imitiert das native GNOME-Kacheln)",
        "Used to safely restore org.gnome.mutter edge-tiling even after a crash.": "Wird verwendet, um org.gnome.mutter edge-tiling auch nach einem Absturz sicher wiederherzustellen.",
        "disabled": "deaktiviert",
        "disconnected — %s×%s": "getrennt — %s×%s"
    },
    "es": {
        "Applies immediately to this preferences window. The Shell popup follows the chosen language the next time it opens.": "Se aplica inmediatamente a esta ventana de preferencias. La ventana emergente del Shell usará el idioma elegido la próxima vez que se abra.",
        "Automatic (system language)": "Automático (idioma del sistema)",
        "Automatic layout": "Diseño automático",
        "Behavior": "Comportamiento",
        "Choose the language used by this app. “Automatic” follows the GNOME/system language.": "Elige el idioma usado por esta app. “Automático” sigue el idioma de GNOME/sistema.",
        "Columns": "Columnas",
        "Configurable tiling grid (rows × columns) per monitor: keyboard shortcuts, drag zones, and a grid popup.": "Cuadrícula de mosaico configurable (filas × columnas) por monitor: atajos de teclado, zonas al arrastrar y ventana emergente de cuadrícula.",
        "Connectors with a saved grid but no currently connected monitor": "Conectores con una cuadrícula guardada pero sin monitor conectado actualmente",
        "Customize shortcuts": "Personalizar atajos",
        "Default columns for monitors without a custom setting": "Columnas predeterminadas para monitores sin configuración personalizada",
        "Default grid": "Cuadrícula predeterminada",
        "Default rows for monitors without a custom setting": "Filas predeterminadas para monitores sin configuración personalizada",
        "Edge zone thickness (px)": "Grosor de la zona de borde (px)",
        "Edge zone thickness while dragging, in pixels": "Grosor de la zona de borde al arrastrar, en píxeles",
        "Edit keys under /org/gnome/shell/extensions/multiple-windows-organization/ with dconf-editor": "Edite las claves en /org/gnome/shell/extensions/multiple-windows-organization/ con dconf-editor",
        "Expand": "Expandir",
        "Expand down": "Expandir hacia abajo",
        "Expand left": "Expandir a la izquierda",
        "Expand right": "Expandir a la derecha",
        "Expand the window one cell down (at the edge: shrink from the top)": "Expandir la ventana una celda hacia abajo (en el borde: reducir desde arriba)",
        "Expand the window one cell left (at the edge: shrink from the right)": "Expandir la ventana una celda a la izquierda (en el borde: reducir desde la derecha)",
        "Expand the window one cell right (at the edge: shrink from the left)": "Expandir la ventana una celda a la derecha (en el borde: reducir desde la izquierda)",
        "Expand the window one cell up (at the edge: shrink from the bottom)": "Expandir la ventana una celda hacia arriba (en el borde: reducir desde abajo)",
        "Expand up": "Expandir hacia arriba",
        "Gap between windows (px)": "Espacio entre ventanas (px)",
        "General": "General",
        "Grid %d×%d — arrow keys move, Shift expands, Enter applies": "Cuadrícula %d×%d — las flechas mueven, Shift expande, Enter aplica",
        "Grid per monitor": "Cuadrícula por monitor",
        "Grid popup": "Ventana emergente de cuadrícula",
        "Grows one cell in the chosen direction; at the edge, shrinks from the opposite side": "Crece una celda en la dirección elegida; en el borde, se reduce desde el lado opuesto",
        "Interface": "Interfaz",
        "Internal sentinel: the extension disabled native edge tiling": "Centinela interna: la extensión desactivó el mosaico nativo de bordes",
        "JSON keyed by connector, e.g. {\"DP-1\":{\"rows\":1,\"cols\":3}}": "JSON indexado por conector, p. ej. {\"DP-1\":{\"rows\":1,\"cols\":3}}",
        "Language": "Idioma",
        "Monitors": "Monitores",
        "Move down / restore": "Bajar / restaurar",
        "Move in grid": "Mover en la cuadrícula",
        "Move left": "Mover a la izquierda",
        "Move right": "Mover a la derecha",
        "Move the window one cell down (optional; the default comes from native Super+Down)": "Mover la ventana una celda hacia abajo (opcional; el valor predeterminado viene de Super+Down nativo)",
        "Move the window one cell left (optional; the default comes from native Super+Left)": "Mover la ventana una celda a la izquierda (opcional; el valor predeterminado viene de Super+Left nativo)",
        "Move the window one cell right (optional; the default comes from native Super+Right)": "Mover la ventana una celda a la derecha (opcional; el valor predeterminado viene de Super+Right nativo)",
        "Move the window one cell up (at the top: maximize)": "Mover la ventana una celda hacia arriba (arriba: maximizar)",
        "Move up / maximize": "Subir / maximizar",
        "Multiple Windows Organization": "Organización de ventanas",
        "Native tiling shortcuts are handled by the grid while the extension is active (and restored when disabled)": "Los atajos nativos de mosaico son gestionados por la cuadrícula mientras la extensión está activa (y se restauran al desactivarla)",
        "Open popup": "Abrir ventana emergente",
        "Open the grid popup": "Abrir la ventana emergente de cuadrícula",
        "Organize monitor": "Organizar monitor",
        "Orphaned settings": "Configuraciones huérfanas",
        "Remove setting": "Eliminar configuración",
        "Rows": "Filas",
        "Rows × columns for each connected display. The setting is saved by connector (DP-1, HDMI-1, ...): if a monitor changes ports, configure it again.": "Filas × columnas para cada pantalla conectada. La configuración se guarda por conector (DP-1, HDMI-1, ...): si un monitor cambia de puerto, configúrelo de nuevo.",
        "Screen edges become grid zones (top maximizes); hold Ctrl while dragging to show the full grid": "Los bordes de la pantalla se convierten en zonas de la cuadrícula (arriba maximiza); mantenga Ctrl al arrastrar para mostrar la cuadrícula completa",
        "Shortcuts": "Atajos",
        "Snap while dragging": "Encajar al arrastrar",
        "Snap windows to the grid while dragging": "Encajar ventanas en la cuadrícula al arrastrar",
        "Space between cells and around edges, in logical pixels": "Espacio entre celdas y en los bordes, en píxeles lógicos",
        "Tile every movable window on the focused monitor": "Coloca en mosaico todas las ventanas movibles en el monitor enfocado",
        "Uses the monitor grid and expands it when there are more windows than cells": "Usa la cuadrícula del monitor y la amplía cuando hay más ventanas que celdas",
        "Used by monitors without their own setting (1×2 mimics native GNOME tiling)": "Usada por monitores sin configuración propia (1×2 imita el mosaico nativo de GNOME)",
        "Used to safely restore org.gnome.mutter edge-tiling even after a crash.": "Se usa para restaurar de forma segura org.gnome.mutter edge-tiling incluso después de un fallo.",
        "disabled": "desactivado",
        "disconnected — %s×%s": "desconectado — %s×%s"
    },
    "fr": {
        "Applies immediately to this preferences window. The Shell popup follows the chosen language the next time it opens.": "S’applique immédiatement à cette fenêtre de préférences. La fenêtre de Shell utilisera la langue choisie à sa prochaine ouverture.",
        "Automatic (system language)": "Automatique (langue du système)",
        "Automatic layout": "Disposition automatique",
        "Behavior": "Comportement",
        "Choose the language used by this app. “Automatic” follows the GNOME/system language.": "Choisissez la langue utilisée par cette application. « Automatique » suit la langue de GNOME/du système.",
        "Columns": "Colonnes",
        "Configurable tiling grid (rows × columns) per monitor: keyboard shortcuts, drag zones, and a grid popup.": "Grille de pavage configurable (lignes × colonnes) par moniteur : raccourcis clavier, zones de glisser et fenêtre contextuelle de grille.",
        "Connectors with a saved grid but no currently connected monitor": "Connecteurs avec une grille enregistrée mais sans moniteur connecté actuellement",
        "Customize shortcuts": "Personnaliser les raccourcis",
        "Default columns for monitors without a custom setting": "Colonnes par défaut pour les moniteurs sans réglage personnalisé",
        "Default grid": "Grille par défaut",
        "Default rows for monitors without a custom setting": "Lignes par défaut pour les moniteurs sans réglage personnalisé",
        "Edge zone thickness (px)": "Épaisseur de la zone de bord (px)",
        "Edge zone thickness while dragging, in pixels": "Épaisseur de la zone de bord pendant le glisser, en pixels",
        "Edit keys under /org/gnome/shell/extensions/multiple-windows-organization/ with dconf-editor": "Modifiez les clés sous /org/gnome/shell/extensions/multiple-windows-organization/ avec dconf-editor",
        "Expand": "Agrandir",
        "Expand down": "Agrandir vers le bas",
        "Expand left": "Agrandir à gauche",
        "Expand right": "Agrandir à droite",
        "Expand the window one cell down (at the edge: shrink from the top)": "Agrandir la fenêtre d’une cellule vers le bas (au bord : réduire depuis le haut)",
        "Expand the window one cell left (at the edge: shrink from the right)": "Agrandir la fenêtre d’une cellule à gauche (au bord : réduire depuis la droite)",
        "Expand the window one cell right (at the edge: shrink from the left)": "Agrandir la fenêtre d’une cellule à droite (au bord : réduire depuis la gauche)",
        "Expand the window one cell up (at the edge: shrink from the bottom)": "Agrandir la fenêtre d’une cellule vers le haut (au bord : réduire depuis le bas)",
        "Expand up": "Agrandir vers le haut",
        "Gap between windows (px)": "Espace entre les fenêtres (px)",
        "General": "Général",
        "Grid %d×%d — arrow keys move, Shift expands, Enter applies": "Grille %d×%d — les flèches déplacent, Shift agrandit, Entrée applique",
        "Grid per monitor": "Grille par moniteur",
        "Grid popup": "Fenêtre de grille",
        "Grows one cell in the chosen direction; at the edge, shrinks from the opposite side": "Agrandit d’une cellule dans la direction choisie ; au bord, réduit depuis le côté opposé",
        "Interface": "Interface",
        "Internal sentinel: the extension disabled native edge tiling": "Sentinelle interne : l’extension a désactivé le pavage natif des bords",
        "JSON keyed by connector, e.g. {\"DP-1\":{\"rows\":1,\"cols\":3}}": "JSON indexé par connecteur, p. ex. {\"DP-1\":{\"rows\":1,\"cols\":3}}",
        "Language": "Langue",
        "Monitors": "Moniteurs",
        "Move down / restore": "Descendre / restaurer",
        "Move in grid": "Déplacer dans la grille",
        "Move left": "Déplacer à gauche",
        "Move right": "Déplacer à droite",
        "Move the window one cell down (optional; the default comes from native Super+Down)": "Déplacer la fenêtre d’une cellule vers le bas (facultatif ; la valeur par défaut vient du Super+Bas natif)",
        "Move the window one cell left (optional; the default comes from native Super+Left)": "Déplacer la fenêtre d’une cellule à gauche (facultatif ; la valeur par défaut vient du Super+Gauche natif)",
        "Move the window one cell right (optional; the default comes from native Super+Right)": "Déplacer la fenêtre d’une cellule à droite (facultatif ; la valeur par défaut vient du Super+Droite natif)",
        "Move the window one cell up (at the top: maximize)": "Déplacer la fenêtre d’une cellule vers le haut (en haut : maximiser)",
        "Move up / maximize": "Monter / maximiser",
        "Multiple Windows Organization": "Organisation des fenêtres",
        "Native tiling shortcuts are handled by the grid while the extension is active (and restored when disabled)": "Les raccourcis de pavage natifs sont gérés par la grille pendant que l’extension est active (et restaurés à la désactivation)",
        "Open popup": "Ouvrir la fenêtre",
        "Open the grid popup": "Ouvrir la fenêtre de grille",
        "Organize monitor": "Organiser le moniteur",
        "Orphaned settings": "Réglages orphelins",
        "Remove setting": "Supprimer le réglage",
        "Rows": "Lignes",
        "Rows × columns for each connected display. The setting is saved by connector (DP-1, HDMI-1, ...): if a monitor changes ports, configure it again.": "Lignes × colonnes pour chaque écran connecté. Le réglage est enregistré par connecteur (DP-1, HDMI-1, ...) : si un moniteur change de port, configurez-le à nouveau.",
        "Screen edges become grid zones (top maximizes); hold Ctrl while dragging to show the full grid": "Les bords de l’écran deviennent des zones de grille (le haut maximise) ; maintenez Ctrl pendant le glisser pour afficher toute la grille",
        "Shortcuts": "Raccourcis",
        "Snap while dragging": "Ancrer pendant le glisser",
        "Snap windows to the grid while dragging": "Ancrer les fenêtres à la grille pendant le glisser",
        "Space between cells and around edges, in logical pixels": "Espace entre les cellules et autour des bords, en pixels logiques",
        "Tile every movable window on the focused monitor": "Dispose toutes les fenêtres déplaçables sur le moniteur actif",
        "Uses the monitor grid and expands it when there are more windows than cells": "Utilise la grille du moniteur et l’agrandit lorsqu’il y a plus de fenêtres que de cellules",
        "Used by monitors without their own setting (1×2 mimics native GNOME tiling)": "Utilisée par les moniteurs sans réglage propre (1×2 imite le pavage natif de GNOME)",
        "Used to safely restore org.gnome.mutter edge-tiling even after a crash.": "Utilisé pour restaurer en sécurité org.gnome.mutter edge-tiling même après un plantage.",
        "disabled": "désactivé",
        "disconnected — %s×%s": "déconnecté — %s×%s"
    },
    "pt": {
        "Applies immediately to this preferences window. The Shell popup follows the chosen language the next time it opens.": "Aplica imediatamente nesta janela de preferências. O popup do Shell usa o idioma escolhido na próxima vez que abrir.",
        "Automatic (system language)": "Automático (idioma do sistema)",
        "Automatic layout": "Organização automática",
        "Behavior": "Comportamento",
        "Choose the language used by this app. “Automatic” follows the GNOME/system language.": "Escolha o idioma usado por este app. “Automático” segue o idioma do GNOME/sistema.",
        "Columns": "Colunas",
        "Configurable tiling grid (rows × columns) per monitor: keyboard shortcuts, drag zones, and a grid popup.": "Grade de tiling configurável (linhas × colunas) por monitor: atalhos de teclado, zonas ao arrastar e popup de grade.",
        "Connectors with a saved grid but no currently connected monitor": "Conectores com grade salva mas sem monitor conectado no momento",
        "Customize shortcuts": "Personalizar atalhos",
        "Default columns for monitors without a custom setting": "Colunas padrão para monitores sem configuração própria",
        "Default grid": "Grade padrão",
        "Default rows for monitors without a custom setting": "Linhas padrão para monitores sem configuração própria",
        "Edge zone thickness (px)": "Espessura da zona de borda (px)",
        "Edge zone thickness while dragging, in pixels": "Espessura da zona de borda durante o arrasto, em pixels",
        "Edit keys under /org/gnome/shell/extensions/multiple-windows-organization/ with dconf-editor": "Edite as chaves em /org/gnome/shell/extensions/multiple-windows-organization/ com o dconf-editor",
        "Expand": "Expandir",
        "Expand down": "Expandir para baixo",
        "Expand left": "Expandir para a esquerda",
        "Expand right": "Expandir para a direita",
        "Expand the window one cell down (at the edge: shrink from the top)": "Expandir a janela uma célula abaixo (na borda: encolher por cima)",
        "Expand the window one cell left (at the edge: shrink from the right)": "Expandir a janela uma célula à esquerda (na borda: encolher pela direita)",
        "Expand the window one cell right (at the edge: shrink from the left)": "Expandir a janela uma célula à direita (na borda: encolher pela esquerda)",
        "Expand the window one cell up (at the edge: shrink from the bottom)": "Expandir a janela uma célula acima (na borda: encolher por baixo)",
        "Expand up": "Expandir para cima",
        "Gap between windows (px)": "Espaço entre janelas (px)",
        "General": "Geral",
        "Grid %d×%d — arrow keys move, Shift expands, Enter applies": "Grade %d×%d — setas movem, Shift expande, Enter aplica",
        "Grid per monitor": "Grade por monitor",
        "Grid popup": "Popup de grade",
        "Grows one cell in the chosen direction; at the edge, shrinks from the opposite side": "Cresce uma célula na direção escolhida; na borda, encolhe pelo lado oposto",
        "Interface": "Interface",
        "Internal sentinel: the extension disabled native edge tiling": "Sentinela interna: a extensão desativou o edge tiling nativo",
        "JSON keyed by connector, e.g. {\"DP-1\":{\"rows\":1,\"cols\":3}}": "JSON chaveado por conector, ex.: {\"DP-1\":{\"rows\":1,\"cols\":3}}",
        "Language": "Idioma",
        "Monitors": "Monitores",
        "Move down / restore": "Descer / restaurar",
        "Move in grid": "Mover na grade",
        "Move left": "Mover para a esquerda",
        "Move right": "Mover para a direita",
        "Move the window one cell down (optional; the default comes from native Super+Down)": "Mover a janela uma célula abaixo (opcional; o padrão vem do Super+Down nativo)",
        "Move the window one cell left (optional; the default comes from native Super+Left)": "Mover a janela uma célula à esquerda (opcional; o padrão vem do Super+Left nativo)",
        "Move the window one cell right (optional; the default comes from native Super+Right)": "Mover a janela uma célula à direita (opcional; o padrão vem do Super+Right nativo)",
        "Move the window one cell up (at the top: maximize)": "Mover a janela uma célula acima (no topo: maximizar)",
        "Move up / maximize": "Subir / maximizar",
        "Multiple Windows Organization": "Organização de Janelas",
        "Native tiling shortcuts are handled by the grid while the extension is active (and restored when disabled)": "Os atalhos nativos de tiling são assumidos pela grade enquanto a extensão está ativa (e restaurados ao desativá-la)",
        "Open popup": "Abrir popup",
        "Open the grid popup": "Abrir o popup de grade",
        "Organize monitor": "Organizar monitor",
        "Orphaned settings": "Configurações órfãs",
        "Remove setting": "Remover configuração",
        "Rows": "Linhas",
        "Rows × columns for each connected display. The setting is saved by connector (DP-1, HDMI-1, ...): if a monitor changes ports, configure it again.": "Linhas × colunas de cada tela conectada. A configuração é salva pelo conector (DP-1, HDMI-1, ...): se um monitor mudar de porta, configure de novo.",
        "Screen edges become grid zones (top maximizes); hold Ctrl while dragging to show the full grid": "As bordas da tela viram zonas da grade (o topo maximiza); segure Ctrl durante o arrasto para ver a grade completa",
        "Shortcuts": "Atalhos",
        "Snap while dragging": "Encaixar ao arrastar",
        "Snap windows to the grid while dragging": "Encaixar janelas na grade ao arrastar",
        "Space between cells and around edges, in logical pixels": "Espaço entre células e nas bordas, em pixels lógicos",
        "Tile every movable window on the focused monitor": "Organiza em mosaico todas as janelas movíveis no monitor em foco",
        "Uses the monitor grid and expands it when there are more windows than cells": "Usa a grade do monitor e a expande quando há mais janelas do que células",
        "Used by monitors without their own setting (1×2 mimics native GNOME tiling)": "Usada por monitores sem configuração própria (1×2 imita o tiling nativo do GNOME)",
        "Used to safely restore org.gnome.mutter edge-tiling even after a crash.": "Usada para restaurar org.gnome.mutter edge-tiling com segurança mesmo após um crash.",
        "disabled": "desativado",
        "disconnected — %s×%s": "desconectado — %s×%s"
    },
    "zh_CN": {
        "Applies immediately to this preferences window. The Shell popup follows the chosen language the next time it opens.": "会立即应用到此首选项窗口。Shell 弹窗会在下次打开时使用所选语言。",
        "Automatic (system language)": "自动（系统语言）",
        "Automatic layout": "自动布局",
        "Behavior": "行为",
        "Choose the language used by this app. “Automatic” follows the GNOME/system language.": "选择此应用使用的语言。“自动”会跟随 GNOME/系统语言。",
        "Columns": "列",
        "Configurable tiling grid (rows × columns) per monitor: keyboard shortcuts, drag zones, and a grid popup.": "按显示器配置的平铺网格（行 × 列）：键盘快捷键、拖拽区域和网格弹窗。",
        "Connectors with a saved grid but no currently connected monitor": "已保存网格但当前没有连接显示器的接口",
        "Customize shortcuts": "自定义快捷键",
        "Default columns for monitors without a custom setting": "没有自定义设置的显示器的默认列数",
        "Default grid": "默认网格",
        "Default rows for monitors without a custom setting": "没有自定义设置的显示器的默认行数",
        "Edge zone thickness (px)": "边缘区域厚度（像素）",
        "Edge zone thickness while dragging, in pixels": "拖拽时边缘区域的厚度（像素）",
        "Edit keys under /org/gnome/shell/extensions/multiple-windows-organization/ with dconf-editor": "使用 dconf-editor 编辑 /org/gnome/shell/extensions/multiple-windows-organization/ 下的按键",
        "Expand": "扩展",
        "Expand down": "向下扩展",
        "Expand left": "向左扩展",
        "Expand right": "向右扩展",
        "Expand the window one cell down (at the edge: shrink from the top)": "将窗口向下扩展一个单元（到边缘时从顶部收缩）",
        "Expand the window one cell left (at the edge: shrink from the right)": "将窗口向左扩展一个单元（到边缘时从右侧收缩）",
        "Expand the window one cell right (at the edge: shrink from the left)": "将窗口向右扩展一个单元（到边缘时从左侧收缩）",
        "Expand the window one cell up (at the edge: shrink from the bottom)": "将窗口向上扩展一个单元（到边缘时从底部收缩）",
        "Expand up": "向上扩展",
        "Gap between windows (px)": "窗口间距（像素）",
        "General": "常规",
        "Grid %d×%d — arrow keys move, Shift expands, Enter applies": "网格 %d×%d — 方向键移动，Shift 扩展，Enter 应用",
        "Grid per monitor": "每台显示器的网格",
        "Grid popup": "网格弹窗",
        "Grows one cell in the chosen direction; at the edge, shrinks from the opposite side": "向所选方向扩展一个单元；到达边缘时从相反一侧收缩",
        "Interface": "界面",
        "Internal sentinel: the extension disabled native edge tiling": "内部标记：扩展已禁用原生边缘平铺",
        "JSON keyed by connector, e.g. {\"DP-1\":{\"rows\":1,\"cols\":3}}": "按接口键控的 JSON，例如 {\"DP-1\":{\"rows\":1,\"cols\":3}}",
        "Language": "语言",
        "Monitors": "显示器",
        "Move down / restore": "向下移动 / 恢复",
        "Move in grid": "在网格中移动",
        "Move left": "向左移动",
        "Move right": "向右移动",
        "Move the window one cell down (optional; the default comes from native Super+Down)": "将窗口向下移动一个单元（可选；默认来自原生 Super+Down）",
        "Move the window one cell left (optional; the default comes from native Super+Left)": "将窗口向左移动一个单元（可选；默认来自原生 Super+Left）",
        "Move the window one cell right (optional; the default comes from native Super+Right)": "将窗口向右移动一个单元（可选；默认来自原生 Super+Right）",
        "Move the window one cell up (at the top: maximize)": "将窗口向上移动一个单元（到顶部时最大化）",
        "Move up / maximize": "向上移动 / 最大化",
        "Multiple Windows Organization": "多窗口组织",
        "Native tiling shortcuts are handled by the grid while the extension is active (and restored when disabled)": "扩展启用时，原生平铺快捷键由网格处理（禁用后恢复）",
        "Open popup": "打开弹窗",
        "Open the grid popup": "打开网格弹窗",
        "Organize monitor": "整理显示器",
        "Orphaned settings": "孤立设置",
        "Remove setting": "移除设置",
        "Rows": "行",
        "Rows × columns for each connected display. The setting is saved by connector (DP-1, HDMI-1, ...): if a monitor changes ports, configure it again.": "为每个已连接的显示器设置行 × 列。设置按接口保存（DP-1、HDMI-1 等）：如果显示器更换接口，请重新配置。",
        "Screen edges become grid zones (top maximizes); hold Ctrl while dragging to show the full grid": "屏幕边缘会变成网格区域（顶部为最大化）；拖拽时按住 Ctrl 可显示完整网格",
        "Shortcuts": "快捷键",
        "Snap while dragging": "拖拽时吸附",
        "Snap windows to the grid while dragging": "拖拽时将窗口吸附到网格",
        "Space between cells and around edges, in logical pixels": "单元格之间及边缘周围的间距，以逻辑像素为单位",
        "Tile every movable window on the focused monitor": "平铺当前聚焦显示器上的所有可移动窗口",
        "Uses the monitor grid and expands it when there are more windows than cells": "使用显示器网格；当窗口多于单元格时会扩展网格",
        "Used by monitors without their own setting (1×2 mimics native GNOME tiling)": "用于没有单独设置的显示器（1×2 模拟 GNOME 原生平铺）",
        "Used to safely restore org.gnome.mutter edge-tiling even after a crash.": "用于在崩溃后安全恢复 org.gnome.mutter edge-tiling。",
        "disabled": "已禁用",
        "disconnected — %s×%s": "已断开 — %s×%s"
    }
};

export function normalizeLanguageCode(code) {
    if (!code)
        return 'en';

    const normalized = String(code)
        .split(':')[0]
        .split('.')[0]
        .split('@')[0]
        .replace('-', '_');

    if (normalized === SYSTEM_LANGUAGE)
        return SYSTEM_LANGUAGE;
    if (normalized === 'C' || normalized === 'POSIX')
        return 'en';
    if (normalized === 'zh_CN' || normalized.startsWith('zh'))
        return 'zh_CN';
    if (normalized.startsWith('pt'))
        return 'pt';
    if (normalized.startsWith('es'))
        return 'es';
    if (normalized.startsWith('fr'))
        return 'fr';
    if (normalized.startsWith('de'))
        return 'de';
    if (normalized.startsWith('en'))
        return 'en';

    return 'en';
}

export function detectSystemLanguageCode() {
    for (const variable of ['LANGUAGE', 'LC_ALL', 'LC_MESSAGES', 'LANG']) {
        const value = GLib.getenv(variable);
        if (!value)
            continue;
        for (const candidate of value.split(':')) {
            const normalized = normalizeLanguageCode(candidate);
            if (SUPPORTED_LANGUAGE_CODES.has(normalized) && normalized !== SYSTEM_LANGUAGE)
                return normalized;
        }
    }
    return 'en';
}

export function configuredLanguageCode(settings) {
    if (!settings?.get_string)
        return SYSTEM_LANGUAGE;

    try {
        const code = settings.get_string('ui-language');
        if (code === SYSTEM_LANGUAGE)
            return SYSTEM_LANGUAGE;
        const normalized = normalizeLanguageCode(code);
        if (SUPPORTED_LANGUAGE_CODES.has(normalized) && normalized !== SYSTEM_LANGUAGE)
            return normalized;
    } catch (_error) {
        // Older compiled schemas may not have ui-language yet. Follow the system
        // until setup.sh recompiles schemas.
    }

    return SYSTEM_LANGUAGE;
}

export function selectedLanguageCode(settings) {
    const configured = configuredLanguageCode(settings);
    return configured === SYSTEM_LANGUAGE ? detectSystemLanguageCode() : configured;
}

export function languageIndex(settingsOrCode) {
    const code = typeof settingsOrCode === 'string'
        ? settingsOrCode
        : configuredLanguageCode(settingsOrCode);
    const normalized = code === SYSTEM_LANGUAGE ? SYSTEM_LANGUAGE : normalizeLanguageCode(code);
    const index = LANGUAGE_OPTIONS.findIndex(option => option.code === normalized);
    return index >= 0 ? index : 0;
}

export function languageCodeAt(index) {
    return LANGUAGE_OPTIONS[index]?.code ?? SYSTEM_LANGUAGE;
}

export function languageLabels(translate = message => message) {
    return LANGUAGE_OPTIONS.map(option => option.code === SYSTEM_LANGUAGE
        ? translate(option.label)
        : option.label);
}

export function translate(message, settings = null, fallbackGettext = null) {
    const configured = configuredLanguageCode(settings);

    if (configured === SYSTEM_LANGUAGE) {
        if (fallbackGettext)
            return fallbackGettext(message);
        const systemLanguage = detectSystemLanguageCode();
        if (systemLanguage === 'en')
            return message;
        return TRANSLATIONS[systemLanguage]?.[message] ?? message;
    }

    if (configured === 'en')
        return message;

    return TRANSLATIONS[configured]?.[message] ?? message;
}
