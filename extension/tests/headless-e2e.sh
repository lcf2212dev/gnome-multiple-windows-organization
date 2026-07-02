#!/usr/bin/env bash
# E2E autônomo: sobe um gnome-shell --headless ISOLADO (dbus e dconf próprios,
# sem tocar na sessão real) com 2 monitores virtuais, habilita a extensão,
# abre uma janela de teste e exercita a grade via D-Bus.
# Uso: extension/tests/headless-e2e.sh
set -euo pipefail

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_DIR="${TESTS_DIR}/../schemas"
UUID="multiple-windows-organization@lcf2212dev"

if [[ -z "${MWO_E2E_INNER:-}" ]]; then
    WORK="$(mktemp -d "${TMPDIR:-/tmp}/mwo-e2e.XXXXXX")"
    export MWO_E2E_INNER=1
    export MWO_E2E_WORK="${WORK}"
    export XDG_CONFIG_HOME="${WORK}/config"   # dconf isolado
    mkdir -p "${XDG_CONFIG_HOME}"
    echo "workdir: ${WORK}"
    exec dbus-run-session -- "${BASH_SOURCE[0]}"
fi

WORK="${MWO_E2E_WORK}"
LOG="${WORK}/shell.log"

gsettings set org.gnome.shell enabled-extensions "['${UUID}']"
gsettings set org.gnome.shell welcome-dialog-last-shown-version '"999.0"' 2>/dev/null || true

gnome-shell --headless --virtual-monitor 1920x1080 --virtual-monitor 1280x1024 \
    >"${LOG}" 2>&1 &
SHELL_PID=$!
WIN_PID=""
cleanup() {
    [[ -n "${WIN_PID}" ]] && kill "${WIN_PID}" 2>/dev/null || true
    kill "${SHELL_PID}" 2>/dev/null || true
}
trap cleanup EXIT

if ! gdbus wait --session --timeout 40 org.gnome.Shell; then
    echo "FALHA: gnome-shell não subiu. Fim do log:"
    tail -30 "${LOG}"
    exit 1
fi

state=""
for _ in $(seq 1 30); do
    state="$(gnome-extensions info "${UUID}" 2>/dev/null | grep -E 'State:' | awk '{print $2}')" || true
    [[ "${state}" == "ACTIVE" ]] && break
    sleep 0.5
done
echo "estado da extensão: ${state:-desconhecido}"
if [[ "${state}" != "ACTIVE" ]]; then
    echo "FALHA: extensão não ficou ACTIVE. Trechos relevantes do log:"
    grep -iE 'mwo|multiple-windows|JS ERROR' "${LOG}" | tail -40 || tail -40 "${LOG}"
    exit 1
fi

# socket wayland criado pelo headless (NUNCA usar o wayland-0 da sessão real)
WL="$(grep -oE "Using Wayland display name '[^']+'" "${LOG}" | grep -oE 'wayland-[0-9]+' | head -1 || true)"
if [[ -z "${WL}" ]]; then
    WL="$(ls -t "${XDG_RUNTIME_DIR}" 2>/dev/null | grep -E '^wayland-[1-9][0-9]*$' | head -1 || true)"
fi
if [[ -z "${WL}" ]]; then
    echo "FALHA: socket wayland do headless não encontrado"
    exit 1
fi
echo "wayland display: ${WL}"

# GTK_A11Y=none: o bus isolado não tem AT-SPI e o registro do app falharia
GDK_BACKEND=wayland WAYLAND_DISPLAY="${WL}" GTK_A11Y=none GSK_RENDERER=cairo \
    gjs -m "${TESTS_DIR}/test-window.js" >"${WORK}/window.log" 2>&1 &
WIN_PID=$!

RESULT=0
gjs -m "${TESTS_DIR}/e2e-checks.js" "${SCHEMA_DIR}" || RESULT=$?

echo
echo "-- ciclo disable → enable --"
gnome-extensions disable "${UUID}"
sleep 1
mid="$(gnome-extensions info "${UUID}" | grep -E 'State:' | awk '{print $2}')"
gnome-extensions enable "${UUID}"
sleep 1
end="$(gnome-extensions info "${UUID}" | grep -E 'State:' | awk '{print $2}')"
echo "após disable: ${mid} · após enable: ${end}"
if [[ "${mid}" != "INACTIVE" || "${end}" != "ACTIVE" ]]; then
    echo "FALHA no ciclo disable/enable"
    RESULT=1
fi

echo
echo "-- erros JS no log do shell (se houver) --"
if grep -E 'JS ERROR' "${LOG}" | head -20; then
    RESULT=1
fi

if [[ "${RESULT}" -eq 0 ]]; then
    echo "E2E OK"
else
    echo "E2E FALHOU (código ${RESULT}) — log completo em ${LOG}"
fi
exit "${RESULT}"
