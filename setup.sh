#!/usr/bin/env bash
# Multiple Windows Organization — installer / uninstaller
# Usage:
#   ./setup.sh install      # compila o schema, symlinka a extensão, instala o .desktop
#   ./setup.sh uninstall    # remove tudo e restaura o edge-tiling nativo
#   ./setup.sh status       # relata o estado atual

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UUID="multiple-windows-organization@lcf2212dev"
EXT_BASE="${HOME}/.local/share/gnome-shell/extensions"
EXT_LINK="${EXT_BASE}/${UUID}"
USER_APP_DIR="${HOME}/.local/share/applications"
DESKTOP_FILE="br.dev.lcf2212.MultipleWindowsOrganization.desktop"
SCHEMA_DIR="${REPO_DIR}/extension/schemas"
MWO_SCHEMA="org.gnome.shell.extensions.multiple-windows-organization"

step() { printf "\n\033[1;36m==> %s\033[0m\n" "$1"; }
ok()   { printf "    \033[1;32m✓\033[0m %s\n" "$1"; }
warn() { printf "    \033[1;33m!\033[0m %s\n" "$1"; }
fail() { printf "    \033[1;31m✗\033[0m %s\n" "$1"; }

mwo_gsettings() {
    GSETTINGS_SCHEMA_DIR="${SCHEMA_DIR}" gsettings "$@"
}

check_shell_version() {
    step "Verificando GNOME Shell"
    local version
    version="$(gnome-shell --version 2>/dev/null | grep -oE '[0-9]+' | head -1 || true)"
    if [[ -z "${version}" ]]; then
        warn "gnome-shell não encontrado no PATH."
        return
    fi
    if [[ "${version}" -ne 50 ]]; then
        warn "Extensão testada no GNOME 50; você tem ${version}."
        warn "Ajuste \"shell-version\" em extension/metadata.json se precisar."
    else
        ok "GNOME Shell ${version}."
    fi
}

do_install() {
    check_shell_version

    step "Compilando schema GSettings"
    glib-compile-schemas "${SCHEMA_DIR}"
    ok "gschemas.compiled gerado."

    step "Instalando a extensão (symlink)"
    mkdir -p "${EXT_BASE}"
    ln -sfn "${REPO_DIR}/extension" "${EXT_LINK}"
    ok "${EXT_LINK} → extension/"

    step "Instalando o lançador (.desktop)"
    mkdir -p "${USER_APP_DIR}"
    sed "s|__ICON_PATH__|${REPO_DIR}/app/icon.svg|" \
        "${REPO_DIR}/app/${DESKTOP_FILE}" > "${USER_APP_DIR}/${DESKTOP_FILE}"
    update-desktop-database -q "${USER_APP_DIR}" 2>/dev/null || true
    ok "App \"Organização de Janelas\" disponível no menu."

    step "Habilitando a extensão"
    if gnome-extensions enable "${UUID}" 2>/dev/null; then
        ok "Extensão marcada como habilitada."
    else
        warn "Não deu para habilitar agora (shell ainda não escaneou a extensão)."
    fi
    warn "Na PRIMEIRA instalação o GNOME Shell (Wayland) só carrega a extensão"
    warn "após logout/login. Depois disso, enable/disable valem na hora."
}

do_uninstall() {
    step "Desabilitando a extensão"
    gnome-extensions disable "${UUID}" 2>/dev/null || true
    ok "Desabilitada (se estava ativa, os atalhos nativos já voltaram)."

    step "Restaurando edge-tiling nativo (se necessário)"
    if [[ -f "${SCHEMA_DIR}/gschemas.compiled" ]]; then
        local sentinel
        sentinel="$(mwo_gsettings get "${MWO_SCHEMA}" did-disable-edge-tiling 2>/dev/null || echo false)"
        if [[ "${sentinel}" == "true" ]]; then
            gsettings set org.gnome.mutter edge-tiling true
            mwo_gsettings set "${MWO_SCHEMA}" did-disable-edge-tiling false 2>/dev/null || true
            ok "org.gnome.mutter edge-tiling restaurado para true."
        else
            ok "Nada a restaurar (a extensão não tinha mexido no edge-tiling)."
        fi
    else
        warn "Schema não compilado; confira manualmente:"
        printf "        gsettings get org.gnome.mutter edge-tiling\n"
    fi

    step "Removendo arquivos"
    rm -f "${EXT_LINK}"
    rm -f "${USER_APP_DIR}/${DESKTOP_FILE}"
    update-desktop-database -q "${USER_APP_DIR}" 2>/dev/null || true
    ok "Symlink e .desktop removidos."
    warn "Configurações no dconf foram mantidas. Para apagar de vez:"
    printf "        dconf reset -f /org/gnome/shell/extensions/multiple-windows-organization/\n"
}

do_status() {
    step "Status"
    if [[ -L "${EXT_LINK}" ]]; then
        ok "symlink: ${EXT_LINK} → $(readlink "${EXT_LINK}")"
    else
        fail "symlink ausente (rode ./setup.sh install)"
    fi
    if [[ -f "${SCHEMA_DIR}/gschemas.compiled" ]]; then
        ok "schema compilado"
    else
        fail "schema NÃO compilado (rode ./setup.sh install)"
    fi
    if [[ -f "${USER_APP_DIR}/${DESKTOP_FILE}" ]]; then
        ok ".desktop instalado"
    else
        warn ".desktop ausente"
    fi

    printf "\n"
    gnome-extensions info "${UUID}" 2>/dev/null ||
        warn "O shell ainda não conhece a extensão (logout/login pendente?)"

    printf "\n    edge-tiling nativo: %s\n" "$(gsettings get org.gnome.mutter edge-tiling)"
    if [[ -f "${SCHEMA_DIR}/gschemas.compiled" ]]; then
        printf "    sentinela did-disable-edge-tiling: %s\n" \
            "$(mwo_gsettings get "${MWO_SCHEMA}" did-disable-edge-tiling 2>/dev/null || echo '?')"
        printf "    monitor-grids: %s\n" \
            "$(mwo_gsettings get "${MWO_SCHEMA}" monitor-grids 2>/dev/null || echo '?')"
    fi
}

case "${1:-}" in
    install)   do_install ;;
    uninstall) do_uninstall ;;
    status)    do_status ;;
    *)
        echo "Uso: $0 {install|uninstall|status}"
        exit 1
        ;;
esac
