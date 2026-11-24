export const gridColumns = 12;

export interface GridPanel {
    panel: string;
    cols: number;
    minCols?: number;
}

function span(value: number | undefined, fallback: number): number {
    if (value === undefined || !Number.isFinite(value)) return fallback;
    return Math.min(gridColumns, Math.max(1, Math.round(value)));
}

/** Pack in reading order. The last panel in each row absorbs any spare columns. */
export function flushRows<T extends GridPanel>(layout: readonly T[]): T[][] {
    const rows: T[][] = [];
    let row: T[] = [];
    let used = 0;
    function finishRow() {
        if (!row.length) return;
        row[row.length - 1].cols += gridColumns - used;
        rows.push(row);
        row = [];
        used = 0;
    }
    for (const panel of layout) {
        const min = span(panel.minCols, 1);
        const cols = Math.max(min, span(panel.cols, min));
        if (used + cols > gridColumns) finishRow();
        row.push({ ...panel, cols });
        used += cols;
    }
    finishRow();
    return rows;
}

/** Accept only known panel IDs and widths. The current catalog owns all other fields. */
export function cleanLayout<T extends GridPanel>(stored: unknown, catalog: readonly T[]): T[] {
    const remaining = new Map(catalog.map((panel) => [panel.panel, panel]));
    const result: T[] = [];
    if (Array.isArray(stored)) {
        for (const entry of stored) {
            if (!entry || typeof entry.panel !== 'string') continue;
            const recipe = remaining.get(entry.panel);
            if (!recipe) continue;
            const min = span(recipe.minCols, 1);
            const width = typeof entry.cols === 'number' ? entry.cols : undefined;
            result.push({ ...recipe, cols: Math.max(min, span(width, span(recipe.cols, min))) });
            remaining.delete(entry.panel);
        }
    }
    return flushRows([...result, ...remaining.values()]).flat();
}

/** A positive delta grows the panel by borrowing from the neighbor at the chosen edge. */
export function resizePanel<T extends GridPanel>(
    layout: readonly T[],
    id: string,
    edge: 'start' | 'end',
    delta: number,
): T[] {
    const rows = flushRows(layout);
    if (!Number.isFinite(delta)) return rows.flat();
    for (const row of rows) {
        const index = row.findIndex((panel) => panel.panel === id);
        if (index < 0) continue;
        const neighbor = row[index + (edge === 'start' ? -1 : 1)];
        if (!neighbor) break;
        const panel = row[index];
        const applied = Math.max(
            span(panel.minCols, 1) - panel.cols,
            Math.min(neighbor.cols - span(neighbor.minCols, 1), Math.round(delta)),
        );
        panel.cols += applied;
        neighbor.cols -= applied;
        break;
    }
    return rows.flat();
}
