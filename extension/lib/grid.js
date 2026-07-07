// Geometria pura da grade — sem nenhum import gi://, para poder rodar em
// `gjs -m tests/test-grid.js` fora do compositor.
//
// Tipos (objetos simples):
//   rect: {x, y, width, height}          (pixels lógicos, coordenadas globais)
//   grid: {rows, cols}
//   cell: {col, row, colSpan, rowSpan}

export function clampCell(grid, cell) {
    const cols = Math.max(1, grid.cols | 0);
    const rows = Math.max(1, grid.rows | 0);
    let colSpan = Math.min(Math.max(1, cell.colSpan | 0), cols);
    let rowSpan = Math.min(Math.max(1, cell.rowSpan | 0), rows);
    let col = Math.min(Math.max(0, cell.col | 0), cols - colSpan);
    let row = Math.min(Math.max(0, cell.row | 0), rows - rowSpan);
    return {col, row, colSpan, rowSpan};
}

// Borda esquerda (float) da coluna i, com margens externas e gutters = gap.
function _colEdge(workArea, grid, gap, i) {
    const pitch = (workArea.width - gap * (grid.cols + 1)) / grid.cols;
    return workArea.x + gap + i * (pitch + gap);
}

function _rowEdge(workArea, grid, gap, i) {
    const pitch = (workArea.height - gap * (grid.rows + 1)) / grid.rows;
    return workArea.y + gap + i * (pitch + gap);
}

// Rect da célula/span. Arredonda as BORDAS (não as larguras) para que células
// vizinhas nunca se sobreponham nem deixem frestas: com gap inteiro,
// round(edge - gap) === round(edge) - gap.
export function cellRect(workArea, grid, cell, gap = 0) {
    const c = clampCell(grid, cell);
    const x = Math.round(_colEdge(workArea, grid, gap, c.col));
    const right = Math.round(_colEdge(workArea, grid, gap, c.col + c.colSpan)) - gap;
    const y = Math.round(_rowEdge(workArea, grid, gap, c.row));
    const bottom = Math.round(_rowEdge(workArea, grid, gap, c.row + c.rowSpan)) - gap;
    return {x, y, width: right - x, height: bottom - y};
}

function _clampIndex(value, count) {
    return Math.min(Math.max(0, value), count - 1);
}

// Hit-test proporcional (ignora gaps de propósito: ponteiro num gap cai na
// célula mais próxima).
export function colAtX(workArea, grid, x) {
    return _clampIndex(Math.floor((x - workArea.x) * grid.cols / workArea.width), grid.cols);
}

export function rowAtY(workArea, grid, y) {
    return _clampIndex(Math.floor((y - workArea.y) * grid.rows / workArea.height), grid.rows);
}

export function cellAtPoint(workArea, grid, x, y) {
    return {col: colAtX(workArea, grid, x), row: rowAtY(workArea, grid, y), colSpan: 1, rowSpan: 1};
}

// Zonas de borda durante o arrasto:
//   topo (sem canto)  → {maximize: true}   — preserva o gesto nativo
//   esquerda/direita  → coluna 0/última, linha conforme o Y
//   fundo             → última linha, coluna conforme o X
//   cantos            → célula do canto
//   fora das zonas    → null
export function edgeCellAtPoint(workArea, grid, x, y, threshold) {
    const nearLeft = x <= workArea.x + threshold;
    const nearRight = x >= workArea.x + workArea.width - threshold;
    const nearTop = y <= workArea.y + threshold;
    const nearBottom = y >= workArea.y + workArea.height - threshold;

    const cell = (col, row) => ({col, row, colSpan: 1, rowSpan: 1});

    if (nearLeft && nearTop)
        return cell(0, 0);
    if (nearRight && nearTop)
        return cell(grid.cols - 1, 0);
    if (nearLeft && nearBottom)
        return cell(0, grid.rows - 1);
    if (nearRight && nearBottom)
        return cell(grid.cols - 1, grid.rows - 1);
    if (nearTop)
        return {maximize: true};
    if (nearLeft)
        return cell(0, rowAtY(workArea, grid, y));
    if (nearRight)
        return cell(grid.cols - 1, rowAtY(workArea, grid, y));
    if (nearBottom)
        return cell(colAtX(workArea, grid, x), grid.rows - 1);
    return null;
}

function _nearestIndex(count, targetValue, edgeOf) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < count; i++) {
        const d = Math.abs(edgeOf(i) - targetValue);
        if (d < bestDist) {
            bestDist = d;
            best = i;
        }
    }
    return best;
}

// Célula/span que melhor descreve um frame rect arbitrário (janela que foi
// movida/redimensionada por fora da extensão).
export function inferCell(workArea, grid, frameRect, gap = 0) {
    const col = _nearestIndex(grid.cols, frameRect.x,
        i => _colEdge(workArea, grid, gap, i));
    const row = _nearestIndex(grid.rows, frameRect.y,
        i => _rowEdge(workArea, grid, gap, i));

    const right = frameRect.x + frameRect.width;
    const bottom = frameRect.y + frameRect.height;
    let colSpan = 1;
    let bestDist = Infinity;
    for (let e = col; e < grid.cols; e++) {
        const d = Math.abs((_colEdge(workArea, grid, gap, e + 1) - gap) - right);
        if (d < bestDist) {
            bestDist = d;
            colSpan = e - col + 1;
        }
    }
    let rowSpan = 1;
    bestDist = Infinity;
    for (let e = row; e < grid.rows; e++) {
        const d = Math.abs((_rowEdge(workArea, grid, gap, e + 1) - gap) - bottom);
        if (d < bestDist) {
            bestDist = d;
            rowSpan = e - row + 1;
        }
    }
    return clampCell(grid, {col, row, colSpan, rowSpan});
}

// Move 1 célula na direção, preservando o span. atEdge=true quando a grade
// acabou naquela direção (caller decide: monitor vizinho, maximizar, no-op).
export function moveWithinGrid(grid, cell, dir) {
    const c = clampCell(grid, cell);
    switch (dir) {
    case 'left':
        if (c.col > 0)
            return {cell: {...c, col: c.col - 1}, atEdge: false};
        break;
    case 'right':
        if (c.col + c.colSpan < grid.cols)
            return {cell: {...c, col: c.col + 1}, atEdge: false};
        break;
    case 'up':
        if (c.row > 0)
            return {cell: {...c, row: c.row - 1}, atEdge: false};
        break;
    case 'down':
        if (c.row + c.rowSpan < grid.rows)
            return {cell: {...c, row: c.row + 1}, atEdge: false};
        break;
    }
    return {cell: c, atEdge: true};
}

// "Empurra" a janela na direção: cresce 1 célula; se já está na borda,
// encolhe 1 célula pelo lado oposto. null = nada a fazer.
export function pressSpan(grid, cell, dir) {
    const c = clampCell(grid, cell);
    switch (dir) {
    case 'left':
        if (c.col > 0)
            return {...c, col: c.col - 1, colSpan: c.colSpan + 1};
        if (c.colSpan > 1)
            return {...c, colSpan: c.colSpan - 1};
        return null;
    case 'right':
        if (c.col + c.colSpan < grid.cols)
            return {...c, colSpan: c.colSpan + 1};
        if (c.colSpan > 1)
            return {...c, col: c.col + 1, colSpan: c.colSpan - 1};
        return null;
    case 'up':
        if (c.row > 0)
            return {...c, row: c.row - 1, rowSpan: c.rowSpan + 1};
        if (c.rowSpan > 1)
            return {...c, rowSpan: c.rowSpan - 1};
        return null;
    case 'down':
        if (c.row + c.rowSpan < grid.rows)
            return {...c, rowSpan: c.rowSpan + 1};
        if (c.rowSpan > 1)
            return {...c, row: c.row + 1, rowSpan: c.rowSpan - 1};
        return null;
    }
    return null;
}

export function resizePushPlan(activeBefore, activeAfter, neighbors, gap = 0, tolerance = 2) {
    const beforeLeft = activeBefore.x;
    const beforeRight = activeBefore.x + activeBefore.width;
    const beforeTop = activeBefore.y;
    const beforeBottom = activeBefore.y + activeBefore.height;
    const afterLeft = activeAfter.x;
    const afterRight = activeAfter.x + activeAfter.width;
    const afterTop = activeAfter.y;
    const afterBottom = activeAfter.y + activeAfter.height;
    const changedLeft = Math.abs(afterLeft - beforeLeft) > tolerance;
    const changedRight = Math.abs(afterRight - beforeRight) > tolerance;
    const changedTop = Math.abs(afterTop - beforeTop) > tolerance;
    const changedBottom = Math.abs(afterBottom - beforeBottom) > tolerance;
    const plan = [];

    for (const neighbor of neighbors) {
        const original = neighbor.rect;
        const rect = {...original};
        const right = original.x + original.width;
        const bottom = original.y + original.height;
        let changed = false;

        if (changedBottom && (neighbor.side === 'bottom' ||
            (_almost(original.y, beforeBottom + gap, tolerance) &&
            _rangesOverlap(beforeLeft, beforeRight, original.x, right, tolerance)))) {
            const y = Math.min(Math.round(afterBottom + gap), bottom - 1);
            rect.y = y;
            rect.height = bottom - y;
            changed = true;
        }

        if (changedTop && (neighbor.side === 'top' ||
            (_almost(bottom, beforeTop - gap, tolerance) &&
            _rangesOverlap(beforeLeft, beforeRight, original.x, right, tolerance)))) {
            const newBottom = Math.max(Math.round(afterTop - gap), original.y + 1);
            rect.height = newBottom - original.y;
            changed = true;
        }

        if (changedRight && (neighbor.side === 'right' ||
            (_almost(original.x, beforeRight + gap, tolerance) &&
            _rangesOverlap(beforeTop, beforeBottom, original.y, bottom, tolerance)))) {
            const x = Math.min(Math.round(afterRight + gap), right - 1);
            rect.x = x;
            rect.width = right - x;
            changed = true;
        }

        if (changedLeft && (neighbor.side === 'left' ||
            (_almost(right, beforeLeft - gap, tolerance) &&
            _rangesOverlap(beforeTop, beforeBottom, original.y, bottom, tolerance)))) {
            const newRight = Math.max(Math.round(afterLeft - gap), original.x + 1);
            rect.width = newRight - original.x;
            changed = true;
        }

        if (changed)
            plan.push({...neighbor, rect});
    }

    return plan;
}

function _almost(a, b, tolerance = 2) {
    return Math.abs(a - b) <= tolerance;
}

function _rangesOverlap(aStart, aEnd, bStart, bEnd, tolerance = 0) {
    return Math.min(aEnd, bEnd) - Math.max(aStart, bStart) > tolerance;
}

export function cellsEqual(a, b) {
    return a.col === b.col && a.row === b.row &&
        a.colSpan === b.colSpan && a.rowSpan === b.rowSpan;
}

export function rectsAlmostEqual(a, b, tolerance = 2) {
    return Math.abs(a.x - b.x) <= tolerance &&
        Math.abs(a.y - b.y) <= tolerance &&
        Math.abs(a.width - b.width) <= tolerance &&
        Math.abs(a.height - b.height) <= tolerance;
}
