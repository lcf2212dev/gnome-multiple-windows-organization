// Testes unitários da geometria da grade.
// Rodar com:  gjs -m extension/tests/test-grid.js
import System from 'system';
import * as Grid from '../lib/grid.js';

let failures = 0;
let total = 0;

function check(label, actual, expected) {
    total++;
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        failures++;
        print(`✗ ${label}\n    esperado: ${e}\n    obtido:   ${a}`);
    }
}

function checkTrue(label, condition) {
    total++;
    if (!condition) {
        failures++;
        print(`✗ ${label}`);
    }
}

const cell = (col, row, colSpan = 1, rowSpan = 1) => ({col, row, colSpan, rowSpan});

// ---- cellRect: contiguidade sem gap (largura não divisível) ----
{
    const wa = {x: 0, y: 0, width: 3440, height: 1400};
    const grid = {rows: 1, cols: 3};
    const rects = [0, 1, 2].map(c => Grid.cellRect(wa, grid, cell(c, 0)));
    checkTrue('sem gap: células contíguas (0→1)', rects[0].x + rects[0].width === rects[1].x);
    checkTrue('sem gap: células contíguas (1→2)', rects[1].x + rects[1].width === rects[2].x);
    checkTrue('sem gap: primeira começa no workArea', rects[0].x === wa.x);
    checkTrue('sem gap: última termina no workArea', rects[2].x + rects[2].width === wa.x + wa.width);
    checkTrue('sem gap: altura total', rects[0].y === 0 && rects[0].height === 1400);
    const span = Grid.cellRect(wa, grid, cell(0, 0, 3, 1));
    check('span total == workArea', span, {x: 0, y: 0, width: 3440, height: 1400});
}

// ---- cellRect: com gap e workArea deslocado (monitor secundário + painel) ----
{
    const wa = {x: 3440, y: 32, width: 1920, height: 1048};
    const grid = {rows: 2, cols: 2};
    const gap = 8;
    const r00 = Grid.cellRect(wa, grid, cell(0, 0), gap);
    const r10 = Grid.cellRect(wa, grid, cell(1, 0), gap);
    const r01 = Grid.cellRect(wa, grid, cell(0, 1), gap);
    checkTrue('gap: margem esquerda', r00.x === wa.x + gap);
    checkTrue('gap: margem superior', r00.y === wa.y + gap);
    checkTrue('gap: gutter horizontal exato', r10.x - (r00.x + r00.width) === gap);
    checkTrue('gap: gutter vertical exato', r01.y - (r00.y + r00.height) === gap);
    checkTrue('gap: margem direita', r10.x + r10.width === wa.x + wa.width - gap);
    checkTrue('gap: margem inferior', r01.y + r01.height === wa.y + wa.height - gap);
    const span = Grid.cellRect(wa, grid, cell(0, 0, 2, 1), gap);
    checkTrue('gap: span2 = c0 + gap + c1', span.width === r00.width + gap + r10.width);
}

// ---- cellAtPoint ----
{
    const wa = {x: 100, y: 50, width: 900, height: 600};
    const grid = {rows: 2, cols: 3};
    check('ponto no canto sup. esquerdo', Grid.cellAtPoint(wa, grid, 100, 50), cell(0, 0));
    check('ponto no canto inf. direito', Grid.cellAtPoint(wa, grid, 999, 649), cell(2, 1));
    check('ponto no centro', Grid.cellAtPoint(wa, grid, 550, 350), cell(1, 1));
    check('ponto fora (clampado)', Grid.cellAtPoint(wa, grid, 5000, -20), cell(2, 0));
}

// ---- edgeCellAtPoint ----
{
    const wa = {x: 0, y: 0, width: 1920, height: 1080};
    const grid = {rows: 2, cols: 3};
    const t = 48;
    check('topo centro → maximizar', Grid.edgeCellAtPoint(wa, grid, 960, 10, t), {maximize: true});
    check('canto sup. esquerdo', Grid.edgeCellAtPoint(wa, grid, 10, 10, t), cell(0, 0));
    check('canto inf. direito', Grid.edgeCellAtPoint(wa, grid, 1915, 1075, t), cell(2, 1));
    check('esquerda, metade de baixo', Grid.edgeCellAtPoint(wa, grid, 10, 800, t), cell(0, 1));
    check('direita, metade de cima', Grid.edgeCellAtPoint(wa, grid, 1915, 300, t), cell(2, 0));
    check('fundo, coluna do meio', Grid.edgeCellAtPoint(wa, grid, 960, 1075, t), cell(1, 1));
    check('centro → null', Grid.edgeCellAtPoint(wa, grid, 960, 540, t), null);
}

// ---- inferCell: roundtrip cellRect → inferCell ----
{
    const wa = {x: 3440, y: 32, width: 1920, height: 1048};
    const grid = {rows: 2, cols: 3};
    const gap = 8;
    for (const c of [cell(0, 0), cell(2, 1), cell(1, 0, 2, 1), cell(0, 0, 1, 2), cell(0, 0, 3, 2)]) {
        const rect = Grid.cellRect(wa, grid, c, gap);
        check(`roundtrip ${JSON.stringify(c)}`, Grid.inferCell(wa, grid, rect, gap), c);
    }
    // rect "quase" na célula (janela com min-size um pouco maior)
    const rect = Grid.cellRect(wa, grid, cell(1, 1), gap);
    const off = {x: rect.x - 15, y: rect.y + 10, width: rect.width + 30, height: rect.height - 5};
    check('infer tolera desvio', Grid.inferCell(wa, grid, off, gap), cell(1, 1));
}

// ---- moveWithinGrid ----
{
    const grid = {rows: 2, cols: 3};
    check('move right no meio', Grid.moveWithinGrid(grid, cell(0, 0), 'right'),
        {cell: cell(1, 0), atEdge: false});
    check('move right na borda', Grid.moveWithinGrid(grid, cell(2, 0), 'right'),
        {cell: cell(2, 0), atEdge: true});
    check('move right com span na borda', Grid.moveWithinGrid(grid, cell(1, 0, 2, 1), 'right'),
        {cell: cell(1, 0, 2, 1), atEdge: true});
    check('move down', Grid.moveWithinGrid(grid, cell(1, 0), 'down'),
        {cell: cell(1, 1), atEdge: false});
    check('move up na borda', Grid.moveWithinGrid(grid, cell(1, 0), 'up'),
        {cell: cell(1, 0), atEdge: true});
}

// ---- pressSpan: crescer e "empurrar" ----
{
    const grid = {rows: 1, cols: 3};
    let c = cell(0, 0);
    c = Grid.pressSpan(grid, c, 'right');
    check('press right: cresce p/ span2', c, cell(0, 0, 2, 1));
    c = Grid.pressSpan(grid, c, 'right');
    check('press right: cresce p/ span3', c, cell(0, 0, 3, 1));
    c = Grid.pressSpan(grid, c, 'right');
    check('press right na borda: encolhe pela esquerda', c, cell(1, 0, 2, 1));
    c = Grid.pressSpan(grid, c, 'right');
    check('press right de novo: encolhe mais', c, cell(2, 0, 1, 1));
    check('press right no fim: null', Grid.pressSpan(grid, c, 'right'), null);
    check('press left volta a crescer', Grid.pressSpan(grid, c, 'left'), cell(1, 0, 2, 1));
}

// ---- pressSpan vertical ----
{
    const grid = {rows: 3, cols: 1};
    check('press down cresce', Grid.pressSpan(grid, cell(0, 0), 'down'), cell(0, 0, 1, 2));
    check('press up na borda encolhe por baixo', Grid.pressSpan(grid, cell(0, 0, 1, 2), 'up'),
        cell(0, 0, 1, 1));
    check('press up sem espaço: null', Grid.pressSpan(grid, cell(0, 0), 'up'), null);
}

// ---- resizePushPlan: redimensionar uma janela empurra/puxa vizinhas adjacentes ----
{
    const topBefore = {x: 0, y: 0, width: 500, height: 300};
    const topAfter = {x: 0, y: 0, width: 500, height: 360};
    const bottom = {id: 'bottom', rect: {x: 0, y: 300, width: 500, height: 300}};
    check('resize bottom-edge: top maior empurra janela de baixo',
        Grid.resizePushPlan(topBefore, topAfter, [bottom]),
        [{id: 'bottom', rect: {x: 0, y: 360, width: 500, height: 240}}]);

    const bottomBefore = {x: 0, y: 300, width: 500, height: 300};
    const bottomAfter = {x: 0, y: 240, width: 500, height: 360};
    const top = {id: 'top', rect: {x: 0, y: 0, width: 500, height: 300}};
    check('resize top-edge: janela de baixo maior empurra janela de cima',
        Grid.resizePushPlan(bottomBefore, bottomAfter, [top]),
        [{id: 'top', rect: {x: 0, y: 0, width: 500, height: 240}}]);

    const leftBefore = {x: 0, y: 0, width: 400, height: 500};
    const leftAfter = {x: 0, y: 0, width: 450, height: 500};
    const right = {id: 'right', rect: {x: 412, y: 0, width: 400, height: 500}};
    check('resize right-edge com gap: esquerda maior empurra janela da direita',
        Grid.resizePushPlan(leftBefore, leftAfter, [right], 12),
        [{id: 'right', rect: {x: 462, y: 0, width: 350, height: 500}}]);

    const driftedBefore = {x: 0, y: 0, width: 500, height: 360};
    const driftedAfter = {x: 0, y: 0, width: 500, height: 320};
    const driftedBottom = {id: 'bottom', side: 'bottom', rect: {x: 0, y: 420, width: 500, height: 180}};
    check('resize bottom-edge: vizinha lógica continua puxando mesmo se deixou de encostar em pixels',
        Grid.resizePushPlan(driftedBefore, driftedAfter, [driftedBottom]),
        [{id: 'bottom', side: 'bottom', rect: {x: 0, y: 320, width: 500, height: 280}}]);
}

// ---- autoLayoutCells: distribuição automática de janelas ----
{
    check('auto layout vazio', Grid.autoLayoutCells({rows: 1, cols: 3}, 0),
        {grid: {rows: 1, cols: 3}, cells: []});
    check('auto layout usa a grade configurada quando cabe', Grid.autoLayoutCells({rows: 1, cols: 3}, 3),
        {grid: {rows: 1, cols: 3}, cells: [cell(0, 0), cell(1, 0), cell(2, 0)]});
    check('auto layout expande colunas em monitor horizontal', Grid.autoLayoutCells({rows: 1, cols: 3}, 4),
        {grid: {rows: 1, cols: 4}, cells: [cell(0, 0), cell(1, 0), cell(2, 0), cell(3, 0)]});
    check('auto layout expande linhas em monitor vertical', Grid.autoLayoutCells({rows: 3, cols: 1}, 4),
        {grid: {rows: 4, cols: 1}, cells: [cell(0, 0), cell(0, 1), cell(0, 2), cell(0, 3)]});
    check('auto layout preenche em ordem linha-coluna', Grid.autoLayoutCells({rows: 2, cols: 2}, 5),
        {grid: {rows: 2, cols: 3}, cells: [cell(0, 0), cell(1, 0), cell(2, 0), cell(0, 1), cell(1, 1)]});
}

// ---- clampCell ----
{
    const grid = {rows: 2, cols: 3};
    check('clamp col negativa', Grid.clampCell(grid, cell(-2, 0)), cell(0, 0));
    check('clamp span excedente vira grade cheia', Grid.clampCell(grid, cell(2, 1, 5, 5)), cell(0, 0, 3, 2));
    check('clamp col além', Grid.clampCell(grid, cell(9, 9)), cell(2, 1));
}

if (failures > 0) {
    print(`\n${failures}/${total} testes FALHARAM`);
    System.exit(1);
} else {
    print(`✓ ${total} testes de grid.js passaram`);
}
