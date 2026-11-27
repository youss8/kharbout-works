import { useState, useSyncExternalStore } from 'react';
import {
    lateReturn,
    lateSite,
    replayTimesheet,
    reportCutoff,
    scenarioVersion,
    sponsorChoice,
    sponsorResult,
    sponsorScenario,
    sponsorSites,
    timesheetActions,
    timesheetScenario,
    timesheetStep,
} from '../../lib/operations-scenarios';
import type { Cutoff, Method } from '../../lib/operations-scenarios';

type Evidence = { href: string; label: string };

const scenarioChange = 'operations-scenario-change';
const siteList = new Intl.ListFormat('en');
const methods: { value: Method; name: string; description: string }[] = [
    {
        value: 'pooled',
        name: 'Pool the participants',
        description: 'Give each participant equal weight.',
    },
    {
        value: 'average',
        name: 'Average the site rates',
        description: 'Give each reporting site equal weight.',
    },
];

function subscribe(callback: () => void) {
    window.addEventListener('popstate', callback);
    window.addEventListener(scenarioChange, callback);
    return () => {
        window.removeEventListener('popstate', callback);
        window.removeEventListener(scenarioChange, callback);
    };
}

function getSearch() {
    return window.location.search;
}

function updateChoices(values: Record<string, string> = {}) {
    const url = new URL(window.location.href);
    url.search = Object.keys(values).length
        ? new URLSearchParams({ v: scenarioVersion, ...values }).toString()
        : '';
    window.history.replaceState(window.history.state, '', url);
    window.dispatchEvent(new Event(scenarioChange));
}

const percent = (value: number | null) => (value === null ? 'Unavailable' : `${value.toFixed(1)}%`);

function DecisionRecord({
    summary,
    evidence,
    children,
}: {
    summary: string;
    evidence: Evidence[];
    children?: React.ReactNode;
}) {
    const [message, setMessage] = useState('');

    async function copy(value: string, label: string) {
        try {
            await navigator.clipboard.writeText(value);
            setMessage(`${label} copied.`);
        } catch {
            setMessage(
                'Copy was unavailable. Select the text in the decision record or copy the page address.',
            );
        }
    }

    return (
        <section className="scenario-record" aria-labelledby="decision-title">
            <h2 id="decision-title">Decision record</h2>
            <p>{summary}</p>
            <div className="scenario-actions">
                <button
                    type="button"
                    onClick={() => copy(summary + '\n' + window.location.href, 'Decision record')}
                >
                    Copy decision
                </button>
                <button type="button" onClick={() => copy(window.location.href, 'Replay link')}>
                    Copy replay link
                </button>
                {children}
            </div>
            <p className="scenario-feedback" role="status">
                {message}
            </p>
            <details>
                <summary>Inspect the rule</summary>
                <ul>
                    {evidence.map(({ href, label }) => (
                        <li key={href}>
                            <a href={href}>{label}</a>
                        </li>
                    ))}
                </ul>
            </details>
        </section>
    );
}

function SponsorReport({ search, evidence }: { search: string | null; evidence: Evidence[] }) {
    const { method, cutoff } = sponsorChoice(search ?? '');
    const original = sponsorResult('original');
    const revised = sponsorResult('revised');
    const renderSites = cutoff === 'revised';

    function chooseMethod(value: Method) {
        updateChoices(cutoff ? { method: value, cutoff } : { method: value });
    }

    function chooseCutoff(value: Cutoff) {
        if (method) updateChoices({ method, cutoff: value });
    }

    const result = renderSites ? revised : original;
    const methodName =
        method === 'average' ? 'Equal-weight site average' : 'Pooled participant rate';
    const selection = method === 'average' ? result.average : result.pooled;
    const count = `${result.included} of ${sponsorSites.length} sites reporting`;
    const displayedSites = sponsorSites.map((site) => ({
        ...site,
        reading: renderSites && site.id === lateSite?.id ? lateReturn : site.reading,
    }));
    const included = displayedSites.flatMap(({ reading, name }) =>
        reading ? [{ ...reading, name }] : [],
    );
    const calculation =
        method === 'average'
            ? `Average of the site rates (${included.map(({ numerator, denominator }) => `${numerator}/${denominator}`).join(', ')})`
            : `${result.numerator} retained out of ${result.denominator} participants`;
    const includedNames = siteList.format(included.map(({ name }) => name));
    const decision = `${methodName} · ${percent(selection)}. ${calculation}. ${count}. Includes ${includedNames}. ${
        renderSites
            ? `${lateSite?.name}'s late return is included in the revision to the ${reportCutoff} cutoff report.`
            : `${lateSite?.name} is excluded from the ${reportCutoff} cutoff report.`
    }`;

    return (
        <>
            <div className="scenario-board">
                <section aria-labelledby="site-returns">
                    <h2 id="site-returns" tabIndex={-1}>
                        Site returns
                    </h2>
                    <dl className="scenario-rows">
                        {displayedSites.map(({ id, name, reading }) => (
                            <div key={id}>
                                <dt>{name}</dt>
                                <dd>
                                    {reading
                                        ? `${reading.numerator} of ${reading.denominator} retained`
                                        : 'Missing at cutoff'}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
                <section aria-labelledby="sign-off-title">
                    <h2 id="sign-off-title">Choose a calculation</h2>
                    <div className="scenario-choices" role="group" aria-label="Calculation">
                        {methods.map(({ value, name, description }) => (
                            <button
                                type="button"
                                key={value}
                                disabled={search === null}
                                aria-pressed={method === value}
                                onClick={() => chooseMethod(value)}
                            >
                                <strong>{name}</strong>
                                <span>{description}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
            <div className="scenario-comparison" role="status">
                {method && (
                    <>
                        <div>
                            <span>Pooled participants</span>
                            <strong key={result.pooled}>{percent(result.pooled)}</strong>
                            <progress aria-hidden="true" value={result.pooled ?? 0} max={100} />
                            <small>
                                {result.numerator} of {result.denominator} people
                            </small>
                        </div>
                        <div>
                            <span>Equal-weight site average</span>
                            <strong key={result.average}>{percent(result.average)}</strong>
                            <progress aria-hidden="true" value={result.average ?? 0} max={100} />
                            <small>{count}</small>
                        </div>
                        {renderSites && (
                            <p>
                                The pooled rate was {percent(original.pooled)} with two sites.
                                Including the late return adds 30 participants, 12 of whom were
                                retained.
                            </p>
                        )}
                        {cutoff === 'original' && (
                            <p>The published result stays at the original cutoff with two sites.</p>
                        )}
                    </>
                )}
            </div>
            {method && (
                <section className="scenario-next" aria-labelledby="late-update">
                    <h2 id="late-update">A return arrives after the cutoff</h2>
                    <p>
                        {lateSite?.name} reports {lateReturn.numerator} of {lateReturn.denominator}{' '}
                        participants retained. What would you do with the report?
                    </p>
                    <div className="scenario-actions" role="group" aria-label="Reporting cutoff">
                        <button
                            type="button"
                            aria-pressed={cutoff === 'original'}
                            onClick={() => chooseCutoff('original')}
                        >
                            Keep the original cutoff
                        </button>
                        <button
                            type="button"
                            aria-pressed={cutoff === 'revised'}
                            onClick={() => chooseCutoff('revised')}
                        >
                            Revise with the late return
                        </button>
                    </div>
                </section>
            )}
            {method && cutoff && (
                <DecisionRecord key={decision} summary={decision} evidence={evidence}>
                    <a href="/templates/kpi-report-check/">
                        Check my own report <span aria-hidden="true">↗</span>
                    </a>
                </DecisionRecord>
            )}
        </>
    );
}

function CloseTimesheet({ search, evidence }: { search: string | null; evidence: Evidence[] }) {
    const step = timesheetStep(search ?? '');
    const { state, unresolved, credit, events } = replayTimesheet(step);
    const next = timesheetActions[step];

    return (
        <>
            <div className="scenario-board">
                <section aria-labelledby="month-state">
                    <h2 id="month-state" tabIndex={-1}>
                        November attendance
                    </h2>
                    <dl className="scenario-rows">
                        <div>
                            <dt>Month status</dt>
                            <dd className="scenario-state">{state}</dd>
                        </div>
                        <div>
                            <dt>Unresolved days</dt>
                            <dd>{unresolved}</dd>
                        </div>
                        <div>
                            <dt>Overtime credited to leave</dt>
                            <dd>{credit}h</dd>
                        </div>
                    </dl>
                </section>
                <section aria-labelledby="attendance-action">
                    <h2 id="attendance-action" tabIndex={-1}>
                        {next ? 'Next action' : 'Month closed'}
                    </h2>
                    <p role="status">
                        {events.at(-1) ?? 'Two missing punch records block employee confirmation.'}
                    </p>
                    {next && (
                        <div className="scenario-actions">
                            <button
                                type="button"
                                disabled={search === null}
                                onClick={(event) => {
                                    if (step === timesheetActions.length - 1) {
                                        event.currentTarget
                                            .closest('section')
                                            ?.querySelector('h2')
                                            ?.focus();
                                    }
                                    updateChoices({ step: String(step + 1) });
                                }}
                            >
                                {next.label}
                            </button>
                        </div>
                    )}
                </section>
            </div>
            {events.length > 0 && (
                <section className="scenario-next" aria-labelledby="attendance-log">
                    <h2 id="attendance-log">Activity log</h2>
                    <ol>
                        {events.map((event) => (
                            <li key={event}>{event}</li>
                        ))}
                    </ol>
                </section>
            )}
            {!next && (
                <DecisionRecord
                    summary={`November timesheet locked. ${unresolved} unresolved days. Self-approval was denied; a different manager approved the month. HR credited ${credit} overtime hours to annual leave.`}
                    evidence={evidence}
                >
                    <a href="/templates/workflow-tester/">
                        Test a workflow of my own <span aria-hidden="true">↗</span>
                    </a>
                </DecisionRecord>
            )}
        </>
    );
}

export default function OperationsScenario({
    kind,
    evidence,
}: {
    kind: 'sponsor-report' | 'close-timesheet';
    evidence: Evidence[];
}) {
    const search = useSyncExternalStore<string | null>(subscribe, getSearch, () => null);
    const sponsor = kind === 'sponsor-report';
    const started =
        search !== null &&
        (sponsor ? Boolean(sponsorChoice(search).method) : timesheetStep(search) > 0);

    return (
        <div className="scenario-run">
            {sponsor ? (
                <SponsorReport search={search} evidence={evidence} />
            ) : (
                <CloseTimesheet search={search} evidence={evidence} />
            )}
            <div className="scenario-footer">
                <button
                    type="button"
                    disabled={!started}
                    onClick={(event) => {
                        const title = event.currentTarget
                            .closest('.scenario-run')
                            ?.querySelector('h2');
                        title?.focus();
                        updateChoices();
                    }}
                >
                    Restart scenario
                </button>
                <a href={sponsor ? timesheetScenario : sponsorScenario}>
                    {sponsor ? 'Try the timesheet scenario' : 'Try the sponsor report scenario'}{' '}
                    <span aria-hidden="true">↗</span>
                </a>
            </div>
        </div>
    );
}
