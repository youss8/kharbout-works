import { useEffect, useRef, useState } from 'react';
import { Download, Play } from 'lucide-react';
import fixture from '../../data/sql-lab/fixture.sql?raw';
import original from '../../data/sql-lab/original.sql?raw';
import corrected from '../../data/sql-lab/corrected.sql?raw';
import joinedRows from '../../data/sql-lab/joined-rows.sql?raw';
import expected from '../../data/sql-lab/expected.json?raw';
import worksheetTest from '../../data/sql-lab/worksheet.test.mjs?raw';
import license from '../../../LICENSE?raw';
import {
    compareRows,
    type QueryResult,
    type SqlComparison,
    type SqlQueries,
} from '../../lib/tools/sql-results';
import { useClientReady } from '../../lib/use-client-ready';
import './sql-result-lab.css';

const examples: SqlQueries = { original, corrected };
const timeLimit = 6_000;

function ResultTable({
    name,
    result,
    different,
    repeats = false,
}: {
    name: string;
    result: QueryResult;
    different?: boolean[];
    repeats?: boolean;
}) {
    return (
        <>
            {result.rows.length === 0 ? (
                <p>No rows matched.</p>
            ) : (
                <div className="dev-scroll sql-table" tabIndex={0} role="region" aria-label={name}>
                    <table>
                        <thead>
                            <tr>
                                {result.columns.map((column, index) => (
                                    <th key={index} scope="col">
                                        {column}
                                    </th>
                                ))}
                                {different && (
                                    <th scope="col">{repeats ? 'Award count' : 'Comparison'}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((row, index) => (
                                <tr key={index} data-different={different?.[index] || undefined}>
                                    {row.map((cell, column) => (
                                        <td key={column}>
                                            {cell === null ? (
                                                <i>NULL</i>
                                            ) : (
                                                <bdi>{String(cell)}</bdi>
                                            )}
                                        </td>
                                    ))}
                                    {different && (
                                        <td>
                                            {repeats
                                                ? different[index]
                                                    ? 'Repeated award'
                                                    : 'One copy'
                                                : different[index]
                                                  ? 'Different'
                                                  : 'Match'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {result.truncated && (
                <p className="sql-note">
                    The display is limited to 200 rows and 400 characters per cell.
                </p>
            )}
        </>
    );
}

export default function SqlResultLab() {
    const ready = useClientReady();
    const active = useRef<(() => void) | null>(null);
    const [queries, setQueries] = useState(examples);
    const [run, setRun] = useState<{ input: SqlQueries; output: SqlComparison } | null>(null);
    const [running, setRunning] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [exportError, setExportError] = useState('');

    useEffect(() => () => active.current?.(), []);

    const output = run?.output;
    const differences =
        output?.original.result && output.corrected.result
            ? compareRows(output.original.result, output.corrected.result)
            : null;
    const edited =
        run &&
        (run.input.original !== queries.original || run.input.corrected !== queries.corrected);
    let status = '';
    if (running) status = 'Running both queries.';
    else if (!error && edited) status = 'Queries edited. Compare again to refresh the results.';
    else if (!error && differences)
        status = differences.exact
            ? 'The result rows match, including duplicates.'
            : 'Result rows differ. The differing rows are marked in each table.';
    else if (!error && output?.original.result && output.corrected.result)
        status = 'Row comparison needs matching column names and complete results.';

    function compare() {
        if (active.current) return;
        setError('');
        setRun(null);
        setRunning(true);
        const input = { ...queries };
        let worker: Worker;
        try {
            worker = new Worker(new URL('./sql-results.worker.ts', import.meta.url), {
                type: 'module',
            });
        } catch {
            setError('Your browser could not open the SQLite worker.');
            setRunning(false);
            return;
        }
        const timer = window.setTimeout(() => {
            cleanup();
            setRunning(false);
            setError(
                'The comparison reached the six-second limit. Simplify the query and run it again.',
            );
        }, timeLimit);
        function cleanup() {
            window.clearTimeout(timer);
            worker.terminate();
            active.current = null;
        }
        active.current = cleanup;
        worker.onmessage = ({ data }: MessageEvent<SqlComparison | { error: string }>) => {
            cleanup();
            setRunning(false);
            if ('error' in data) setError(data.error);
            else setRun({ input, output: data });
        };
        worker.onerror = () => {
            cleanup();
            setRunning(false);
            setError('SQLite could not start. Reload the page and try again.');
        };
        worker.postMessage(input);
    }

    async function download() {
        setExportError('');
        setExporting(true);
        try {
            const { default: JSZip } = await import('jszip');
            const archive = new JSZip();
            archive.file('fixture.sql', fixture);
            archive.file('original.sql', original);
            archive.file('corrected.sql', corrected);
            archive.file('joined-rows.sql', joinedRows);
            archive.file('expected.json', expected);
            archive.file('worksheet.test.mjs', worksheetTest);
            archive.file('my-original.sql', queries.original);
            archive.file('my-corrected.sql', queries.corrected);
            archive.file('LICENSE', license);
            archive.file(
                'README.md',
                '# SQL Result Lab\n\nWith Node.js 24, run `node --test worksheet.test.mjs`. The test uses the built-in SQLite module and checks the reference queries against expected.json.\n\nThe two my-*.sql files hold your current editor text. Open fixture.sql in SQLite to try them. joined-rows.sql shows the repeated award IDs in the reference query.\n',
            );
            const url = URL.createObjectURL(await archive.generateAsync({ type: 'blob' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'sql-result-lab.zip';
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
        } catch {
            setExportError('The worksheet could not be downloaded. Try again.');
        } finally {
            setExporting(false);
        }
    }

    return (
        <section className="sql-lab" aria-label="SQLite worksheet">
            <p className="sql-note">
                Both editors run one read-only query against the same fictional SQLite database in
                your browser. Compare the results, then change either query.
            </p>
            <div className="dev-actions">
                <button
                    className="dev-button dev-button--primary"
                    type="button"
                    disabled={!ready || running}
                    onClick={compare}
                >
                    <Play size={17} aria-hidden="true" />
                    {running ? 'Running…' : 'Compare queries'}
                </button>
                <button
                    className="dev-button"
                    type="button"
                    disabled={!ready || running}
                    onClick={() => {
                        setQueries(examples);
                        setRun(null);
                        setError('');
                    }}
                >
                    Reset examples
                </button>
                <button
                    className="dev-button"
                    type="button"
                    disabled={!ready || exporting}
                    onClick={download}
                >
                    <Download size={17} aria-hidden="true" />
                    {exporting ? 'Preparing worksheet…' : 'Download worksheet and test'}
                </button>
            </div>
            {error && <p role="alert">{error}</p>}
            {exportError && <p role="alert">{exportError}</p>}
            <p className="sql-status" role="status">
                {status}
            </p>
            <div className="sql-columns">
                {(['original', 'corrected'] as const).map((key) => {
                    const title = key === 'original' ? 'Original query' : 'Corrected query';
                    const outcome = output?.[key];
                    return (
                        <section key={key} className="sql-panel" aria-labelledby={'sql-' + key}>
                            <h2 id={'sql-' + key}>{title}</h2>
                            <textarea
                                aria-labelledby={'sql-' + key}
                                dir="ltr"
                                disabled={!ready}
                                spellCheck={false}
                                autoCapitalize="off"
                                maxLength={10_000}
                                value={queries[key]}
                                onChange={(event) =>
                                    setQueries({ ...queries, [key]: event.target.value })
                                }
                            />
                            {outcome?.error && <p role="alert">Query error: {outcome.error}</p>}
                            {outcome?.result && (
                                <ResultTable
                                    name={title + ' results'}
                                    result={outcome.result}
                                    different={differences?.[key]}
                                />
                            )}
                        </section>
                    );
                })}
            </div>
            <details className="sql-detail">
                <summary>Inspect the example’s joined rows</summary>
                <p>
                    Field Training has two matching tags. The original join counts each of its
                    awards twice. The corrected query uses EXISTS to check the tags without
                    repeating award rows.
                </p>
                {output && (
                    <ResultTable
                        name="Joined rows for the example"
                        result={output.joinedRows}
                        different={output.joinedRows.rows.map((row) => Number(row[4]) > 1)}
                        repeats
                    />
                )}
                <pre className="dev-code">
                    <code>{joinedRows}</code>
                </pre>
            </details>
            <details className="sql-detail">
                <summary>Read the schema and fixture</summary>
                <pre className="dev-code">
                    <code>{fixture}</code>
                </pre>
            </details>
        </section>
    );
}
