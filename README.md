# Multiple Windows Organization (Organização de Janelas)

Extensão do GNOME Shell + app de configuração para dividir **cada monitor em
uma grade de linhas × colunas** — em vez do snap nativo de só duas metades
(esquerda/direita). Feita para GNOME 50 em Wayland (Manjaro).

```
   DP-1 · ultrawide (1×3)             DP-2 (2×2)          HDMI-1 (2×2)
 ┌───────┬───────┬───────┐         ┌─────┬─────┐        ┌─────┬─────┐
 │       │       │       │         │     │     │        │     │     │
 │       │       │       │         ├─────┼─────┤        ├─────┼─────┤
 │       │       │       │         │     │     │        │     │     │
 └───────┴───────┴───────┘         └─────┴─────┘        └─────┴─────┘
        cada monitor com a SUA grade, configurada pelo app
```

## Sistemas suportados

Suporte oficial: **Linux + GNOME Shell 50 + Wayland**.

O projeto é desenvolvido e testado no Manjaro GNOME. Outras distribuições Linux
podem funcionar se usarem GNOME Shell 50 em sessão Wayland. Windows, macOS, X11
e outros ambientes gráficos não são suportados.

## Por que uma extensão do Shell?

No GNOME em Wayland, nenhum processo externo pode mover/redimensionar janelas
de outros apps — só código rodando dentro do compositor (Mutter). Por isso o
projeto é uma extensão; o "aplicativo" é a janela de preferências dela,
disponível no menu como **Organização de Janelas**.

## Instalação

```bash
./setup.sh install     # compila o schema, symlinka a extensão, instala o .desktop
./setup.sh status      # confere o estado
./setup.sh uninstall   # remove tudo e restaura o edge-tiling nativo
```

> **Primeira instalação:** o GNOME Shell (Wayland) só escaneia extensões novas
> no login. Faça **logout/login** e rode
> `gnome-extensions enable multiple-windows-organization@lcf2212dev`
> (ou habilite pelo app Extensões). Depois disso, enable/disable valem na hora.

## Como usar

### Teclado

| Atalho | Ação |
|---|---|
| `Super` + `←` / `→` | Move a janela uma célula; na borda do monitor, pula para o monitor vizinho |
| `Super` + `↑` | Sobe uma linha; na linha de cima (ou grade de 1 linha), **maximiza** |
| `Super` + `↓` | Desce uma linha; se maximizada, **restaura** para a célula anterior |
| `Super` + `Ctrl` + setas | **Expande** a janela uma célula na direção; na borda, encolhe pelo lado oposto ("empurra") |
| `Super` + `G` | Abre o **popup de grade** |

Os atalhos nativos `Super+←/→/↓` são assumidos pela grade enquanto a extensão
está ativa e devolvidos ao Mutter no momento em que ela é desativada (nada é
gravado em configurações — crash não deixa rastro).

Uma janela "solta" (fora da grade) primeiro **encaixa** na célula mais próxima;
os apertos seguintes movem de célula em célula.

### Redimensionar com o mouse

Quando duas janelas já estão encaixadas e compartilham uma borda, redimensionar
uma delas **empurra ou puxa** a vizinha para manter o mosaico sem sobreposição.
Ex.: numa grade `1 coluna × 2 linhas`, aumentar a janela de cima para baixo
reduz e desloca a janela de baixo; aumentar a janela de baixo para cima faz o
inverso.

### Arrastar (zonas)

Arrastando uma janela, as bordas da tela viram zonas de encaixe:

```
 ┌──────────────── maximizar ────────────────┐
 │▓▓                                        ▓▓│
 │▓▓  coluna 0        (livre)      coluna N ▓▓│
 │▓▓  linha do Y                            ▓▓│
 │▓▓                                        ▓▓│
 └──── linha de baixo, coluna conforme o X ───┘
```

- **Topo** = maximizar (o gesto nativo continua valendo)
- **Esquerda/direita** = primeira/última coluna, na linha correspondente à altura do cursor
- **Fundo** = última linha, na coluna correspondente ao X — com grade de 1 linha, é o jeito de alcançar as colunas do meio sem teclado
- **Segure `Ctrl` durante o arrasto** = a grade completa aparece como zonas; solte sobre qualquer célula

Soltar fora de qualquer zona = arrasto livre normal. O half-tiling nativo
(`org.gnome.mutter edge-tiling`) é desligado enquanto a extensão está ativa e
restaurado ao desativar/desinstalar (com sentinela à prova de crash).

### Popup de grade (`Super+G`)

```
        ┌───────────────────────────────┐
        │  Grade 3×2 — setas movem,     │
        │  Shift expande, Enter aplica  │
        │  ┌─────┐┌─────┐┌─────┐        │
        │  │ ▓▓▓ ││     ││     │        │
        │  └─────┘└─────┘└─────┘        │
        │  ┌─────┐┌─────┐┌─────┐        │
        │  │     ││     ││     │        │
        │  └─────┘└─────┘└─────┘        │
        └───────────────────────────────┘
```

Setas movem a seleção, `Shift+setas` expandem o span, `Enter`/clique aplicam,
`Esc` cancela.

## Configuração — o app

Abra **Organização de Janelas** no menu de apps (ou
`gnome-extensions prefs multiple-windows-organization@lcf2212dev`):

- **Monitores** — linhas × colunas de cada tela conectada, identificada pelo
  **conector** (`DP-1`, `HDMI-1`, ...). Importante aqui: dois monitores do
  mesmo modelo são distinguidos pela porta — se um monitor trocar de porta,
  configure de novo (a entrada antiga aparece como "órfã", com botão de
  remover).
- **Geral** — grade padrão para monitores sem configuração, espaço entre
  janelas (gap) e liga/desliga do encaixe ao arrastar.
- **Atalhos** — referência dos atalhos ativos (edição pelo `dconf-editor` em
  `/org/gnome/shell/extensions/multiple-windows-organization/`).
- **Idiomas** — seletor em **Geral → Interface → Idioma**, com modo
  automático (idioma do GNOME/sistema) ou escolha manual entre inglês,
  português, espanhol, francês, alemão e mandarim (`zh_CN`).

Mudanças valem **na hora** (live-reload), sem recarregar a extensão.

## Scripting via D-Bus

A extensão expõe uma interface para automação:

```bash
DEST=(--session --dest org.gnome.Shell
      --object-path /br/dev/lcf2212/MultipleWindowsOrganization)
M=br.dev.lcf2212.MultipleWindowsOrganization

gdbus call "${DEST[@]}" --method $M.MoveFocused right
gdbus call "${DEST[@]}" --method $M.SpanFocused down
gdbus call "${DEST[@]}" --method $M.MoveFocusedToCell 0 2 0 1 2   # monitor, col, linha, spans
gdbus call "${DEST[@]}" --method $M.GetState | sed "s/^('//;s/',)$//" | jq .
```

## Desenvolvimento e testes

```bash
gjs -m extension/tests/test-grid.js      # unit da geometria (sem compositor)
./extension/tests/headless-e2e.sh        # E2E: gnome-shell --headless isolado,
                                         # 2 monitores virtuais, janela real,
                                         # movimentos via D-Bus
```

O E2E roda num D-Bus e dconf **isolados** — não toca na sessão real. Para
testar visualmente sem relogar (zonas de arrasto, popup), há o devkit do
Mutter 18: `sudo pacman -S mutter-devkit` e

```bash
dbus-run-session -- gnome-shell --wayland --devkit \
  --virtual-monitor 3440x1440 --virtual-monitor 1920x1080
```

(atalhos de teclado não chegam à sessão aninhada — teclado se testa na sessão
real; iterar código exige relançar o devkit, pois re-enable não recarrega ESM).

## Solução de problemas

- **Extensão não aparece após instalar** — logout/login pendente (primeira vez).
- **Snap nativo de metades sumiu depois de remover na mão** — restaure com
  `gsettings set org.gnome.mutter edge-tiling true` (o `setup.sh uninstall`
  faz isso sozinho).
- **Erros da extensão** — `journalctl /usr/bin/gnome-shell -f` com o prefixo
  `[MWO]` ou `JS ERROR`.
- **Monitor trocou de porta e "perdeu" a grade** — reconfigure no app; remova a
  entrada órfã antiga.

## Licença

[MIT](LICENSE) — Leandro Faria, 2026.
