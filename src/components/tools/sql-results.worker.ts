import initSqlJs, { type Database, type SqlValue, type Statement } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import fixture from '../../data/sql-lab/fixture.sql?raw';
import joinedRows from '../../data/sql-lab/joined-rows.sql?raw';
import type {
    QueryOutcome,
    QueryResult,
    SqlCell,
    SqlComparison,
    SqlQueries,
} from '../../lib/tools/sql-results';

const rowLimit = 200;
const maxColumns = 30;
const maxQuerySize = 10_000;

type ExactStatement = Statement & {
    get(parameters: undefined, config: { useBigInt: true }): (SqlValue | bigint)[];
};

function display(value: SqlValue | bigint): { cell: SqlCell; truncated: boolean } {
    if (value instanceof Uint8Array)
        return { cell: '[binary: ' + value.byteLength + ' bytes]', truncated: true };
    if (typeof value === 'string' && value.length > 400)
        return { cell: value.slice(0, 400) + '…', truncated: true };
    return { cell: value, truncated: false };
}

function query(db: Database, sql: string): QueryResult {
    if (
        sql.length > maxQuerySize ||
        !/^\s*(?:--[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*(select|with)\b/i.test(sql)
    ) {
        throw new Error('Enter one SELECT or WITH query, up to 10,000 characters.');
    }
    const statements = db.iterateStatements(sql)[Symbol.iterator]();
    const first = statements.next();
    if (first.done) throw new Error('Enter a query.');
    try {
        // The package's declarations omit the runtime's second argument.
        const statement = first.value as ExactStatement;
        const columns = statement.getColumnNames();
        if (columns.length === 0 || columns.length > maxColumns)
            throw new Error('Return between 1 and 30 columns.');
        const rows: SqlCell[][] = [];
        let truncated = false;
        while (statement.step()) {
            if (rows.length === rowLimit) {
                truncated = true;
                break;
            }
            rows.push(
                statement.get(undefined, { useBigInt: true }).map((value) => {
                    const shown = display(value);
                    truncated ||= shown.truncated;
                    return shown.cell;
                }),
            );
        }
        if (!statements.next().done) throw new Error('Run one query per editor.');
        return { columns, rows, truncated };
    } finally {
        statements.return?.();
    }
}

function outcome(db: Database, sql: string): QueryOutcome {
    try {
        return { result: query(db, sql) };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'The query failed.' };
    }
}

const worker = self as unknown as {
    onmessage: ((event: MessageEvent<SqlQueries>) => void) | null;
    postMessage: (answer: SqlComparison | { error: string }) => void;
};

worker.onmessage = async ({ data }) => {
    try {
        const sql = await initSqlJs({ locateFile: () => wasmUrl });
        const db = new sql.Database();
        try {
            db.run(fixture);
            db.run('PRAGMA query_only = ON');
            worker.postMessage({
                original: outcome(db, data.original),
                corrected: outcome(db, data.corrected),
                joinedRows: query(db, joinedRows),
            });
        } finally {
            db.close();
        }
    } catch {
        worker.postMessage({ error: 'SQLite could not start. Reload the page and try again.' });
    }
};
