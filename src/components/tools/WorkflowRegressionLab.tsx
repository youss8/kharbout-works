import { useMemo, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { Check, Download, X } from 'lucide-react';
import {
    compareWorkflowSources,
    editReviewerGuard,
    workflowInputLimit,
    type WorkflowRegressionReport,
    type WorkflowRegressionSource,
    type WorkflowRegressionSources,
} from '../../lib/tools/workflow-regression';
import { useClientReady } from '../../lib/use-client-ready';
import './workflow-regression.css';

const documentTitles = {
    baseline: 'Baseline policy',
    candidate: 'Candidate policy',
    suite: 'Acceptance suite',
} satisfies Record<WorkflowRegressionSource, string>;

const documents = Object.keys(documentTitles) as WorkflowRegressionSource[];
const emptyMessages = { baseline: '', candidate: '', suite: '' };
type Result = WorkflowRegressionReport['rows'][number];

function disposition(allowed: boolean) {
    return allowed ? 'Allowed' : 'Blocked';
}

function Decision({ title, outcome }: { title: string; outcome: Result['expected'] }) {
    return (
        <div>
            <h4>{title}</h4>
            <dl>
                <div>
                    <dt>Decision</dt>
                    <dd>{disposition(outcome.allowed)}</dd>
                </div>
                <div>
                    <dt>Next state</dt>
                    <dd>
                        <code dir="ltr">{outcome.nextState}</code>
                    </dd>
                </div>
                <div>
                    <dt>Audit event</dt>
                    <dd>
                        <code dir="ltr">{outcome.auditEvent ?? 'None'}</code>
                    </dd>
                </div>
            </dl>
        </div>
    );
}

function CaseResult({ row }: { row: Result }) {
    const outcomeChange =
        row.baseline.allowed !== row.candidate.allowed
            ? `${disposition(row.baseline.allowed)} → ${disposition(row.candidate.allowed)}`
            : row.outcomeChanged
              ? 'State or audit event changed'
              : 'Same outcome';
    const StatusIcon = row.candidatePassed ? Check : X;
    return (
        <li className="regression-case">
            <details open={!row.candidatePassed || undefined}>
                <summary>
                    <span className="regression-case__name">{row.title}</span>
                    <span className="regression-case__change">{outcomeChange}</span>
                    <span className="regression-case__status" data-passed={row.candidatePassed}>
                        <StatusIcon size={15} aria-hidden="true" />
                        {row.candidatePassed ? 'Pass' : 'Fail'}
                    </span>
                </summary>
                <div className="regression-case__body">
                    <div className="regression-case__outcomes">
                        <Decision title="Expected" outcome={row.expected} />
                        <Decision title="Baseline" outcome={row.baseline} />
                        <Decision title="Candidate" outcome={row.candidate} />
                    </div>
                    <div className="regression-case__trace">
                        <div>
                            <h4>Baseline evaluation</h4>
                            <p>{row.baseline.reason}</p>
                        </div>
                        <div>
                            <h4>Candidate evaluation</h4>
                            <p>{row.candidate.reason}</p>
                        </div>
                        {row.removedGuards.length > 0 && (
                            <div>
                                <h4>Removed guards</h4>
                                <p>
                                    <code dir="ltr">{row.removedGuards.join(', ')}</code>
                                </p>
                            </div>
                        )}
                        {row.addedGuards.length > 0 && (
                            <div>
                                <h4>Added guards</h4>
                                <p>
                                    <code dir="ltr">{row.addedGuards.join(', ')}</code>
                                </p>
                            </div>
                        )}
                        {row.candidate.checks.length > 0 && (
                            <ul aria-label="Candidate guard checks">
                                {row.candidate.checks.map(({ guard, passed, reason }) => (
                                    <li key={guard}>
                                        {passed ? 'Pass' : 'Fail'} · <code dir="ltr">{guard}</code>{' '}
                                        · {reason}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </details>
        </li>
    );
}

export default function WorkflowRegressionLab({ example }: { example: WorkflowRegressionSources }) {
    const ready = useClientReady();
    const [sources, setSources] = useState(example);
    const [submitted, setSubmitted] = useState(example);
    const [fileMessages, setFileMessages] = useState(emptyMessages);
    const [notice, setNotice] = useState('');
    const [exporting, setExporting] = useState(false);
    const fileRevisions = useRef({ baseline: 0, candidate: 0, suite: 0 });
    const comparison = useMemo(() => compareWorkflowSources(submitted), [submitted]);
    const report = comparison.report;
    const dirty = documents.some((name) => sources[name] !== submitted[name]);
    const caseCount = report?.rows.length ?? 0;

    function editSource(name: WorkflowRegressionSource, value: string) {
        fileRevisions.current[name] += 1;
        setSources((current) => ({ ...current, [name]: value }));
        setFileMessages((current) => ({ ...current, [name]: '' }));
        setNotice('');
    }

    async function importSource(
        name: WorkflowRegressionSource,
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!file) return;

        const revision = ++fileRevisions.current[name];
        const updateMessage = (message: string) =>
            setFileMessages((current) => ({ ...current, [name]: message }));
        if (file.size > workflowInputLimit) {
            updateMessage('This file exceeds the 256 KB limit.');
            return;
        }

        updateMessage('Reading the selected file…');
        try {
            const value = (await file.text()).replace(/^\uFEFF/u, '');
            if (revision !== fileRevisions.current[name]) return;
            editSource(name, value);
            updateMessage(`${file.name} is ready to compare.`);
        } catch {
            if (revision === fileRevisions.current[name])
                updateMessage('The file could not be read. Try pasting the JSON.');
        }
    }

    function runComparison(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitted(sources);
        setNotice('');
    }

    function changeReviewerGuard(required: boolean) {
        const candidate = editReviewerGuard(sources.candidate, required);
        if (!candidate) {
            setNotice('A valid review-to-approve transition is needed to edit this guard.');
            return;
        }
        const next = { ...sources, candidate };
        editSource('candidate', candidate);
        setSubmitted(next);
    }

    function resetExample() {
        for (const name of documents) fileRevisions.current[name] += 1;
        setSources(example);
        setSubmitted(example);
        setFileMessages(emptyMessages);
        setNotice('');
    }

    async function downloadSuite() {
        if (!report || dirty || exporting) return;
        setExporting(true);
        setNotice('Preparing the test suite…');
        try {
            const [response, { default: JSZip }] = await Promise.all([
                fetch('/developer/workflow-regression/runner.zip'),
                import('jszip'),
            ]);
            if (!response.ok) throw new Error('Workflow runtime unavailable');
            const archive = await JSZip.loadAsync(await response.arrayBuffer());
            archive.file('baseline.json', submitted.baseline);
            archive.file('candidate.json', submitted.candidate);
            archive.file('acceptance-suite.json', submitted.suite);
            const blob = await archive.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'workflow-regression.zip';
            document.body.append(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
            setNotice('Test suite downloaded. Run npm test in the extracted directory.');
        } catch {
            setNotice('The test suite could not be downloaded. Try again.');
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="workflow-regression" inert={!ready}>
            <section className="regression-summary" aria-labelledby="regression-result">
                <div>
                    <h2 id="regression-result">Comparison results</h2>
                    {report && (
                        <p>
                            Baseline v{report.baselineVersion} · Candidate v
                            {report.candidateVersion}
                        </p>
                    )}
                    <p className="regression-summary__result" role="status">
                        {report ? (
                            <>
                                <strong>
                                    {caseCount - report.candidateFailures}/{caseCount} passing
                                </strong>{' '}
                                · {report.regressions}{' '}
                                {report.regressions === 1 ? 'regression' : 'regressions'}
                                {dirty && ' · Run again to compare your edits.'}
                            </>
                        ) : (
                            'Check the errors in the JSON inputs and run the comparison again.'
                        )}
                    </p>
                    {report && report.baselineFailures > 0 && (
                        <p>
                            {report.baselineFailures}{' '}
                            {report.baselineFailures === 1 ? 'case also fails' : 'cases also fail'}{' '}
                            against the baseline.
                        </p>
                    )}
                </div>
                <div className="regression-actions">
                    <button
                        className="dev-button"
                        type="button"
                        onClick={() => changeReviewerGuard(true)}
                    >
                        Restore reviewer guard
                    </button>
                    <button
                        className="dev-button"
                        type="button"
                        onClick={() => changeReviewerGuard(false)}
                    >
                        Remove reviewer guard
                    </button>
                    <button
                        className="dev-button dev-button--primary"
                        type="button"
                        disabled={!report || dirty || exporting}
                        onClick={downloadSuite}
                    >
                        <Download size={16} aria-hidden="true" /> Download CI suite
                    </button>
                </div>
                <p className="regression-notice" role="status">
                    {notice}
                </p>
            </section>

            {report && (
                <section aria-label="Acceptance case results">
                    {(report.baselineWarnings.length > 0 ||
                        report.candidateWarnings.length > 0) && (
                        <ul className="regression-warnings" aria-label="Contract warnings">
                            {report.baselineWarnings.map((warning) => (
                                <li key={`baseline:${warning}`}>Baseline · {warning}</li>
                            ))}
                            {report.candidateWarnings.map((warning) => (
                                <li key={`candidate:${warning}`}>Candidate · {warning}</li>
                            ))}
                        </ul>
                    )}
                    <ul className="regression-cases">
                        {report.rows.map((row, index) => (
                            <CaseResult key={`${index}:${row.title}`} row={row} />
                        ))}
                    </ul>
                </section>
            )}

            <form
                className="regression-editors"
                onSubmit={runComparison}
                aria-labelledby="regression-inputs"
            >
                <h2 id="regression-inputs">Policies and acceptance cases</h2>
                <p>
                    Paste or import JSON. Set each expected decision in the suite separately from
                    the policies.
                </p>
                {documents.map((name) => {
                    const id = `regression-${name}`;
                    const errors = dirty ? [] : (comparison.errors?.[name] ?? []);
                    return (
                        <details
                            className="regression-editor"
                            key={name}
                            open={errors.length > 0 || undefined}
                        >
                            <summary>
                                {documentTitles[name]} JSON
                                {errors.length > 0 &&
                                    ` · ${errors.length} ${errors.length === 1 ? 'error' : 'errors'}`}
                            </summary>
                            <div className="regression-editor__body">
                                <label htmlFor={`${id}-import`}>
                                    Import {documentTitles[name].toLowerCase()} JSON
                                </label>
                                <input
                                    id={`${id}-import`}
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={(event) => importSource(name, event)}
                                />
                                <p role="status">{fileMessages[name]}</p>
                                <label htmlFor={id}>{documentTitles[name]} editor</label>
                                <textarea
                                    id={id}
                                    dir="ltr"
                                    spellCheck={false}
                                    rows={12}
                                    aria-invalid={errors.length > 0}
                                    aria-describedby={errors.length ? `${id}-errors` : undefined}
                                    value={sources[name]}
                                    onChange={(event) => editSource(name, event.target.value)}
                                />
                                {errors.length > 0 && (
                                    <ul
                                        id={`${id}-errors`}
                                        className="regression-errors"
                                        role="alert"
                                    >
                                        {errors.slice(0, 20).map((error, index) => (
                                            <li key={`${index}:${error}`}>{error}</li>
                                        ))}
                                        {errors.length > 20 && (
                                            <li>{errors.length - 20} more errors</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </details>
                    );
                })}
                <div className="regression-actions">
                    <button className="dev-button dev-button--primary" type="submit">
                        Compare policies
                    </button>
                    <button className="dev-button" type="button" onClick={resetExample}>
                        Reset example
                    </button>
                </div>
            </form>
        </div>
    );
}
