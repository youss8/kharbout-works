import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Play, RotateCcw } from 'lucide-react';
import type { ApprovalScenario } from '../../lib/approval-trace';
import { useClientReady } from '../../lib/use-client-ready';
import './request-debugger.css';

const actions = {
    'concurrent-approval': 'Approve at the same time',
    'lost-response-retry': 'Retry after a timeout',
};

function statusText(status: number) {
    if (status === 200) return '200 OK';
    if (status === 409) return '409 Conflict';
    return String(status);
}

export default function RequestDebugger({
    scenarios,
    compact = false,
}: {
    scenarios: ApprovalScenario[];
    compact?: boolean;
}) {
    const ready = useClientReady();
    const [selected, setSelected] = useState<ApprovalScenario['id']>('concurrent-approval');
    const [current, setCurrent] = useState<number | null>(null);
    const scenario = scenarios.find((item) => item.id === selected) ?? scenarios[0];
    const step = current === null ? undefined : scenario.steps[current];
    const finished = current === scenario.steps.length - 1;
    const code = step?.code;

    return (
        <div className={'request-debugger' + (compact ? ' request-debugger--compact' : '')}>
            <div className="request-debugger-head">
                <div>
                    {compact && <h2>Two reviewers. One approval.</h2>}
                    <p>
                        {compact
                            ? 'Both reviewers have the same version of the request.'
                            : scenario.description}
                    </p>
                </div>
                <div className="request-debugger-actions">
                    <button
                        type="button"
                        className="dev-button dev-button--primary"
                        disabled={!ready}
                        onClick={() => setCurrent(compact ? scenario.steps.length - 1 : 0)}
                    >
                        <Play size={17} aria-hidden="true" />
                        {actions[selected]}
                    </button>
                    {!compact && (
                        <button
                            type="button"
                            className="dev-button"
                            disabled={current === null}
                            onClick={() => setCurrent(null)}
                        >
                            <RotateCcw size={16} aria-hidden="true" /> Reset
                        </button>
                    )}
                </div>
            </div>

            {!compact && (
                <div className="request-scenarios" role="group" aria-label="Choose a recorded test">
                    {scenarios.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className="dev-button"
                            aria-pressed={selected === item.id}
                            disabled={!ready}
                            onClick={() => {
                                setSelected(item.id);
                                setCurrent(null);
                            }}
                        >
                            {item.title}
                        </button>
                    ))}
                </div>
            )}

            {compact ? (
                <>
                    <p className="request-home-readout" role="status">
                        {finished ? (
                            <>
                                {scenario.responses.map((response) => (
                                    <span key={response.label}>{statusText(response.status)}</span>
                                ))}
                                <strong>{scenario.result.auditEventCount} audit entry</strong>
                            </>
                        ) : (
                            <>Two requests start with the same record version.</>
                        )}
                    </p>
                    <a href="/developer/request-trace/" className="request-open">
                        Inspect the request trace <ArrowUpRight size={17} aria-hidden="true" />
                    </a>
                </>
            ) : (
                <>
                    {current !== null && (
                        <div className="request-responses" aria-label="Recorded HTTP responses">
                            {scenario.responses.map(({ label, status, replayed }) => (
                                <div key={label} data-conflict={status === 409 || undefined}>
                                    <p>{label}</p>
                                    <b>{statusText(status)}</b>
                                    {replayed && <span>Stored response replayed</span>}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="request-debugger-body">
                        <ol className="request-timeline" aria-label="Recorded steps">
                            {scenario.steps.map((item, index) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        disabled={!ready}
                                        aria-current={current === index ? 'step' : undefined}
                                        onClick={() => setCurrent(index)}
                                    >
                                        <span aria-hidden="true">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        {item.title}
                                    </button>
                                </li>
                            ))}
                        </ol>

                        <section className="request-observation" aria-label="Selected trace step">
                            <div className="request-step-heading" role="status">
                                {step ? (
                                    <>
                                        <h2>{step.title}</h2>
                                        <p>{step.detail}</p>
                                    </>
                                ) : (
                                    <>
                                        <h2>Ready to replay</h2>
                                        <p>
                                            Start the replay or choose a step to inspect its
                                            recorded data.
                                        </p>
                                    </>
                                )}
                            </div>
                            {step && (
                                <>
                                    <pre
                                        className="dev-code request-data"
                                        tabIndex={0}
                                        aria-label="Observed request or database data"
                                    >
                                        <code>{JSON.stringify(step.data, null, 2)}</code>
                                    </pre>
                                    {code && (
                                        <details className="request-code" key={step.id}>
                                            <summary>
                                                <ArrowDown size={16} aria-hidden="true" /> Inspect
                                                source
                                            </summary>
                                            <p>
                                                <code>
                                                    {step.source.path}:{step.source.line}
                                                </code>
                                            </p>
                                            <pre
                                                className="dev-code"
                                                tabIndex={0}
                                                aria-label="Relevant PHP source"
                                            >
                                                <code>{code}</code>
                                            </pre>
                                        </details>
                                    )}
                                    {!finished && (
                                        <button
                                            className="dev-button"
                                            type="button"
                                            onClick={() => setCurrent((current ?? -1) + 1)}
                                        >
                                            Next step <ArrowRight size={16} aria-hidden="true" />
                                        </button>
                                    )}
                                </>
                            )}
                            {finished && (
                                <p className="request-result">
                                    <Check size={19} aria-hidden="true" />
                                    {scenario.result.approvalCount} approval ·{' '}
                                    {scenario.result.auditEventCount} audit event
                                </p>
                            )}
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}
