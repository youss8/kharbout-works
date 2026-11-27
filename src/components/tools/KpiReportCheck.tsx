import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
    createKpiReport,
    exportKpiReport,
    formatKpiPercent,
    kpiCsvMaxBytes,
    kpiFields,
    readKpiCsv,
    validateKpiMapping,
} from '../../lib/tools/kpi-report';
import type { KpiDataset, KpiMapping, KpiReport } from '../../lib/tools/kpi-report';
import { useClientReady } from '../../lib/use-client-ready';
import './kpi-report-check.css';

const pageSize = 25;
const numberFormatter = new Intl.NumberFormat('en');

function downloadReport(report: KpiReport) {
    const url = URL.createObjectURL(
        new Blob([exportKpiReport(report)], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kpi-validation-report.csv';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function ReportResults({ report }: { report: KpiReport }) {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [onlyIssues, setOnlyIssues] = useState(false);
    const [page, setPage] = useState(0);
    const period = report.periods.find(({ key }) => key === selectedPeriod) ?? report.periods[0];
    const visibleRows = report.rows.filter(
        (row) =>
            (!period || !row.periodKey || row.periodKey === period.key) &&
            (!onlyIssues || row.status !== 'Included'),
    );
    const first = page * pageSize;
    const pageRows = visibleRows.slice(first, first + pageSize);
    const last = first + pageRows.length;
    const comparable = period?.precise && period.included > 0;
    const rateNote =
        !period?.precise && period
            ? 'The totals exceed the supported whole-number range. Split this period into smaller reports.'
            : 'The selected period has no valid counts to compare.';

    return (
        <div className="kpi-check-results">
            <header className="kpi-check-toolbar">
                <h3>Rates</h3>
                {period && (
                    <div className="kpi-check-period">
                        <label htmlFor="kpi-check-period">Reporting period</label>
                        <select
                            id="kpi-check-period"
                            value={period.key}
                            onChange={(event) => {
                                setSelectedPeriod(event.target.value);
                                setPage(0);
                            }}
                        >
                            {report.periods.map(({ key, label }) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </header>
            <dl className="kpi-check-metrics" aria-label="Rate comparison" aria-live="polite">
                <div>
                    <dt>Pooled rate</dt>
                    <dd>{formatKpiPercent(comparable ? period.pooled : null)}</dd>
                    <dd>
                        {comparable
                            ? `${numberFormatter.format(period.numerator)} of ${numberFormatter.format(period.denominator)} across sites`
                            : 'Total numerator ÷ total denominator'}
                    </dd>
                </div>
                <div>
                    <dt>Site average</dt>
                    <dd>{formatKpiPercent(comparable ? period.average : null)}</dd>
                    <dd>Each included site has equal weight</dd>
                </div>
            </dl>
            <p className="kpi-check-note">
                {period
                    ? `${numberFormatter.format(period.included)} included · ${numberFormatter.format(period.excluded)} excluded`
                    : 'No reporting period found.'}
                {report.unassigned > 0 &&
                    ` · ${numberFormatter.format(report.unassigned)} without a period`}
                {!comparable && (
                    <>
                        <br />
                        {rateNote}
                    </>
                )}
            </p>
            <div className="kpi-check-toolbar kpi-check-record-header">
                <h3 id="kpi-check-record-title">Record review</h3>
                <label className="kpi-check-filter">
                    <input
                        type="checkbox"
                        checked={onlyIssues}
                        onChange={(event) => {
                            setOnlyIssues(event.target.checked);
                            setPage(0);
                        }}
                    />
                    Show excluded records only
                </label>
            </div>
            {pageRows.length > 0 ? (
                <div
                    className="kpi-check-table"
                    role="region"
                    aria-labelledby="kpi-check-record-title"
                    tabIndex={0}
                >
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">CSV record</th>
                                <th scope="col">Site</th>
                                <th scope="col">Result</th>
                                <th scope="col">Period</th>
                                <th scope="col">Numerator</th>
                                <th scope="col">Denominator</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.map((row) => (
                                <tr key={row.number}>
                                    <th scope="row">{row.number}</th>
                                    <td>
                                        <bdi>{row.site || '—'}</bdi>
                                    </td>
                                    <td>
                                        <strong data-status={row.status}>{row.status}</strong>
                                        {row.reason && <span>{row.reason}</span>}
                                    </td>
                                    <td>
                                        <bdi>{row.period || '—'}</bdi>
                                    </td>
                                    <td>
                                        <bdi>{row.numerator || '—'}</bdi>
                                    </td>
                                    <td>
                                        <bdi>{row.denominator || '—'}</bdi>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="kpi-check-note">No excluded records in this view.</p>
            )}
            {visibleRows.length > pageSize && (
                <nav aria-label="Record pages" className="kpi-check-pages">
                    <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
                        Previous
                    </button>
                    <p role="status">
                        {first + 1}–{last} of {numberFormatter.format(visibleRows.length)}
                    </p>
                    <button
                        type="button"
                        disabled={last >= visibleRows.length}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </button>
                </nav>
            )}
            <footer className="kpi-check-toolbar kpi-check-export">
                <p className="kpi-check-note">The download includes every period and record.</p>
                <button type="button" onClick={() => downloadReport(report)}>
                    Download validation CSV
                </button>
            </footer>
        </div>
    );
}

export default function KpiReportCheck({ sample }: { sample: string }) {
    const ready = useClientReady();
    const [draft, setDraft] = useState(sample);
    const [dataset, setDataset] = useState<KpiDataset | null>(() => readKpiCsv(sample));
    const [mapping, setMapping] = useState<KpiMapping | null>(() => dataset?.mapping ?? null);
    const [source, setSource] = useState('September retention sample');
    const [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const readVersion = useRef(0);
    const mappingError = dataset && mapping ? validateKpiMapping(dataset, mapping) : null;
    const report = useMemo(
        () => (dataset && mapping && !mappingError ? createKpiReport(dataset, mapping) : null),
        [dataset, mapping, mappingError],
    );

    function load(text: string, sourceName: string) {
        readVersion.current++;
        setDraft(text);
        setRevision((current) => current + 1);
        try {
            const next = readKpiCsv(text);
            setDataset(next);
            setMapping(next.mapping);
            setSource(sourceName);
            setError('');
        } catch (reason) {
            setDataset(null);
            setMapping(null);
            setSource('');
            setError(
                reason instanceof Error ? reason.message : 'Check the CSV file and try again.',
            );
        }
    }

    async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!file) return;
        const version = ++readVersion.current;
        setDataset(null);
        setMapping(null);
        setError('');
        if (file.size > kpiCsvMaxBytes) {
            setSource('');
            setError('Choose a CSV under 2 MiB or split it into smaller reports.');
            return;
        }
        setSource('Reading CSV…');
        try {
            const text = await file.text();
            if (readVersion.current === version) load(text, file.name);
        } catch {
            if (readVersion.current !== version) return;
            setError('The file could not be read. Choose it again or paste the CSV.');
            setSource('');
        }
    }

    return (
        <div className="kpi-check" inert={!ready}>
            <section className="kpi-check-panel" aria-labelledby="kpi-check-source-title">
                <header className="kpi-check-panel-title">
                    <h2 id="kpi-check-source-title">Source CSV</h2>
                </header>
                <div className="kpi-check-input">
                    <p className="kpi-check-note" id="kpi-check-file-help">
                        Use a UTF-8 CSV with a header and one record per site and period. The limit
                        is 2 MiB and 10,000 records.
                    </p>
                    <label htmlFor="kpi-check-file">Choose a CSV file</label>
                    <input
                        id="kpi-check-file"
                        type="file"
                        accept=".csv,text/csv"
                        aria-describedby="kpi-check-file-help"
                        onChange={(event) => {
                            void chooseFile(event);
                        }}
                    />
                    <label htmlFor="kpi-check-paste">Or paste CSV</label>
                    <textarea
                        id="kpi-check-paste"
                        spellCheck={false}
                        value={draft}
                        rows={6}
                        dir="auto"
                        onChange={(event) => {
                            readVersion.current++;
                            setDraft(event.target.value);
                            setSource('');
                            setError('');
                            setDataset(null);
                            setMapping(null);
                        }}
                    />
                    <div className="kpi-check-actions">
                        <button
                            type="button"
                            className="kpi-check-primary"
                            onClick={() => load(draft, 'Pasted CSV')}
                        >
                            Read pasted CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => load(sample, 'September retention sample')}
                        >
                            Load sample
                        </button>
                    </div>
                    <p className="kpi-check-note kpi-check-source-status" role="status">
                        {source && <bdi>{source}</bdi>}
                        {dataset && ` · ${numberFormatter.format(dataset.records.length)} records`}
                    </p>
                    {error && (
                        <p role="alert" className="kpi-check-alert">
                            {error}
                        </p>
                    )}
                </div>
                {dataset && mapping && (
                    <fieldset className="kpi-check-mapping">
                        <legend>Map columns</legend>
                        <div>
                            {kpiFields.map(({ key, label }) => (
                                <div key={key}>
                                    <label htmlFor={`kpi-check-column-${key}`}>{label}</label>
                                    <select
                                        id={`kpi-check-column-${key}`}
                                        aria-describedby={
                                            mappingError ? 'kpi-check-mapping-error' : undefined
                                        }
                                        value={mapping[key]}
                                        onChange={(event) => {
                                            setMapping({
                                                ...mapping,
                                                [key]: Number(event.target.value),
                                            });
                                            setRevision((current) => current + 1);
                                        }}
                                    >
                                        <option value={-1}>Choose a column</option>
                                        {dataset.headers.map((column, index) => (
                                            <option key={index} value={index}>
                                                {column || 'Unnamed'} · column {index + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        {mappingError && (
                            <p
                                id="kpi-check-mapping-error"
                                role="status"
                                className="kpi-check-alert"
                            >
                                {mappingError}
                            </p>
                        )}
                    </fieldset>
                )}
                {report && (
                    <a className="kpi-check-jump" href="#kpi-check-report-title">
                        Jump to results ↓
                    </a>
                )}
            </section>
            <section className="kpi-check-panel" aria-labelledby="kpi-check-report-title">
                <header className="kpi-check-panel-title">
                    <h2 id="kpi-check-report-title" tabIndex={-1}>
                        Validation report
                    </h2>
                </header>
                {report ? (
                    <ReportResults key={revision} report={report} />
                ) : (
                    <p className="kpi-check-empty">
                        {dataset
                            ? 'Map the four fields to calculate the rates.'
                            : 'Read a CSV or load the sample to calculate the rates.'}
                    </p>
                )}
            </section>
        </div>
    );
}
