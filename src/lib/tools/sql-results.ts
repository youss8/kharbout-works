export type SqlCell = string | number | bigint | null;
export interface QueryResult {
    columns: string[];
    rows: SqlCell[][];
    truncated: boolean;
}
export type QueryOutcome =
    { result: QueryResult; error?: never } | { error: string; result?: never };
export interface SqlComparison {
    original: QueryOutcome;
    corrected: QueryOutcome;
    joinedRows: QueryResult;
}
export interface SqlQueries {
    original: string;
    corrected: string;
}

function rowKey(row: SqlCell[]) {
    return JSON.stringify(row, (_key, value: unknown) => {
        if (typeof value === 'bigint') return { integer: value.toString() };
        if (typeof value === 'number' && !Number.isFinite(value)) return { real: String(value) };
        return value;
    });
}

export function compareRows(left: QueryResult, right: QueryResult) {
    if (
        left.truncated ||
        right.truncated ||
        left.columns.length !== right.columns.length ||
        left.columns.some((column, index) => column !== right.columns[index])
    ) {
        return null;
    }

    let exact = true;
    const remaining = new Map<string, number>();
    for (const row of right.rows) {
        const key = rowKey(row);
        remaining.set(key, (remaining.get(key) ?? 0) + 1);
    }
    const original = left.rows.map((row) => {
        const key = rowKey(row);
        const count = remaining.get(key) ?? 0;
        if (count === 0) {
            exact = false;
            return true;
        }
        remaining.set(key, count - 1);
        return false;
    });
    const corrected = right.rows.map((row) => {
        const key = rowKey(row);
        const count = remaining.get(key) ?? 0;
        if (count === 0) return false;
        exact = false;
        remaining.set(key, count - 1);
        return true;
    });
    return { original, corrected, exact };
}
