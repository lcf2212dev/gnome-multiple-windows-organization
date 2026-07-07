# Multiple Windows Organization

GNOME Shell extension + preferences app that divides **each monitor into a
configurable rows × columns grid** instead of the native two-half
left/right snap. Built for GNOME Shell 50 on Wayland (Manjaro).

```
   DP-1 · ultrawide (1×3)             DP-2 (2×2)          HDMI-1 (2×2)
 ┌───────┬───────┬───────┐         ┌─────┬─────┐        ┌─────┬─────┐
 │       │       │       │         │     │     │        │     │     │
 │       │       │       │         ├─────┼─────┤        ├─────┼─────┤
 │       │       │       │         │     │     │        │     │     │
 └───────┴───────┴───────┘         └─────┴─────┘        └─────┴─────┘
        each monitor has its own grid, configured in the app
```

## Supported systems

Official support: **Linux + GNOME Shell 50 + Wayland**.

The project is developed and tested on Manjaro GNOME. Other Linux distributions
may work if they run GNOME Shell 50 in a Wayland session. Windows, macOS, X11,
and other desktop environments are not supported.

## Why a Shell extension?

On GNOME Wayland, external processes cannot move or resize windows from other
apps. Only code running inside the compositor (Mutter) can do that. That is why
this project is a Shell extension; the "app" is the extension preferences
window, available from the application menu as **Multiple Windows Organization**.

## Installation

```bash
./setup.sh install     # compile the schema, symlink the extension, install the .desktop file
./setup.sh status      # check the current state
./setup.sh uninstall   # remove everything and restore native edge tiling
```

> **First install:** GNOME Shell on Wayland only scans new extensions at login.
> Log out/in, then open the Extensions app and enable
> **Multiple Windows Organization**. If you prefer the terminal, run
> `gnome-extensions enable multiple-windows-organization@lcf2212dev`.
> After that, enable/disable takes effect immediately.

## Usage

### Keyboard

| Shortcut | Action |
|---|---|
| `Super` + `←` / `→` | Move the window by one cell; at the monitor edge, jump to the neighboring monitor |
| `Super` + `↑` | Move up by one row; on the top row, or in a one-row grid, **maximize** |
| `Super` + `↓` | Move down by one row; if maximized, **restore** to the previous cell |
| `Super` + `Ctrl` + arrows | **Expand** the window by one cell in that direction; at the edge, shrink from the opposite side ("push") |
| `Super` + `G` | Open the **grid popup** |
| `Super` + `Ctrl` + `G` | Automatically organize every movable window on the focused monitor |

The native `Super+←/→/↓` shortcuts are taken over by the grid while the
extension is active and returned to Mutter when the extension is disabled.
Nothing is persisted to settings, so a crash does not leave shortcut changes
behind.

A floating window, one that is outside the grid, first **snaps** to the nearest
cell. Later key presses move it cell by cell.

`Super+Ctrl+G` tiles every movable window on the focused monitor. It uses the
monitor grid you configured, and temporarily expands that grid when there are
more windows than configured cells.

### Mouse resizing

When two snapped windows share an edge, resizing one of them **pushes or pulls**
the neighbor to keep the tiling layout without overlap. For example, in a
`1 column × 2 rows` grid, growing the top window downward shrinks and moves the
bottom window; growing the bottom window upward does the inverse.

### Dragging zones

While dragging a window, the screen edges become snap zones:

```
 ┌──────────────── maximize ────────────────┐
 │▓▓                                      ▓▓│
 │▓▓  column 0       (free)      column N ▓▓│
 │▓▓  cursor row                         ▓▓│
 │▓▓                                      ▓▓│
 └──── bottom row, column based on X ──────┘
```

- **Top** = maximize; the native maximize gesture still works.
- **Left/right** = first/last column, on the row that matches the cursor height.
- **Bottom** = last row, on the column that matches the cursor X position. In a
  one-row grid, this is the way to reach middle columns without the keyboard.
- **Hold `Ctrl` while dragging** = show the full grid as drop zones; release on
  any cell.

Dropping outside every zone keeps the normal free drag. Native half tiling
(`org.gnome.mutter edge-tiling`) is disabled while the extension is active and
restored on disable/uninstall, with a crash-safe sentinel.

### Grid popup (`Super+G`)

```
        ┌───────────────────────────────┐
        │  Grid 3×2 — arrows move,      │
        │  Shift expands, Enter applies │
        │  ┌─────┐┌─────┐┌─────┐        │
        │  │ ▓▓▓ ││     ││     │        │
        │  └─────┘└─────┘└─────┘        │
        │  ┌─────┐┌─────┐┌─────┐        │
        │  │     ││     ││     │        │
        │  └─────┘└─────┘└─────┘        │
        └───────────────────────────────┘
```

Arrow keys move the selection, `Shift+arrows` expands the span, `Enter` or click
applies it, and `Esc` cancels.

## Configuration — the app

The easiest way is to open **Multiple Windows Organization** from the
application menu. The terminal fallback is:

```bash
gnome-extensions prefs multiple-windows-organization@lcf2212dev
```

- **Monitors** — rows × columns for each connected display, identified by its
  **connector** (`DP-1`, `HDMI-1`, ...). Two monitors of the same model are
  distinguished by port. If a monitor moves to another port, configure it again;
  the old entry appears as "orphaned" and can be removed.
- **General** — default grid for monitors without a custom configuration, window
  gap, and drag-zone enable/disable.
- **Shortcuts** — reference for active shortcuts. They can be edited through
  `dconf-editor` at
  `/org/gnome/shell/extensions/multiple-windows-organization/`.
- **Languages** — selector under **General → Interface → Language**, with an
  automatic mode that follows GNOME/the system language, or a manual choice
  between English, Portuguese, Spanish, French, German, and Mandarin (`zh_CN`).

Changes apply **immediately** through live reload, without reloading the
extension.

## D-Bus scripting

The extension exposes an automation interface:

```bash
DEST=(--session --dest org.gnome.Shell
      --object-path /br/dev/lcf2212/MultipleWindowsOrganization)
M=br.dev.lcf2212.MultipleWindowsOrganization

gdbus call "${DEST[@]}" --method $M.MoveFocused right
gdbus call "${DEST[@]}" --method $M.SpanFocused down
gdbus call "${DEST[@]}" --method $M.MoveFocusedToCell 0 2 0 1 2   # monitor, col, row, spans
gdbus call "${DEST[@]}" --method $M.OrganizeFocusedMonitor
gdbus call "${DEST[@]}" --method $M.GetState | sed "s/^('//;s/',)$//" | jq .
```

## Development and tests

```bash
gjs -m extension/tests/test-grid.js      # geometry unit tests, no compositor needed
gjs -m extension/tests/test-i18n.js      # localization unit tests
./extension/tests/headless-e2e.sh        # isolated gnome-shell --headless E2E:
                                         # 2 virtual monitors, real window,
                                         # D-Bus-driven moves
```

The E2E test runs in an **isolated** D-Bus and dconf environment; it does not
touch the real session. For visual testing without logging out, such as drag
zones and the popup, use the Mutter 18 devkit:

```bash
sudo pacman -S mutter-devkit

dbus-run-session -- gnome-shell --wayland --devkit \
  --virtual-monitor 3440x1440 --virtual-monitor 1920x1080
```

Keyboard shortcuts do not reach the nested session, so keyboard behavior must be
tested in the real session. When iterating on code, restart the devkit; re-enable
does not reload ESM modules.

## Troubleshooting

- **The extension does not appear after install** — first-install logout/login is
  still pending.
- **Native half snap disappeared after manually removing the extension** —
  restore it with `gsettings set org.gnome.mutter edge-tiling true`. The
  `setup.sh uninstall` command does this automatically.
- **Extension errors** — run `journalctl /usr/bin/gnome-shell -f` and look for
  `[MWO]` or `JS ERROR`.
- **A monitor changed ports and "lost" its grid** — configure it again in the
  app, then remove the old orphaned entry.

## License

[MIT](LICENSE) — Leandro Faria, 2026.
