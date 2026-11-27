import { useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { ArrowRight, ArrowUp, Check, Download, X } from 'lucide-react';
import {
    evaluateWorkflow,
    readWorkflowContract,
    workflowGuardLabels,
    workflowMermaid,
    type WorkflowContract,
    type WorkflowDecision,
    type WorkflowRequest,
} from '../../lib/tools/workflow-tester';
import { useClientReady } from '../../lib/use-client-ready';
import './workflow-tester.css';

interface WorkflowCase {
    title: string;
    request: WorkflowRequest;
    expected: Pick<WorkflowDecision, 'allowed' | 'nextState' | 'auditEvent'>;
}

const sampleRequest: WorkflowRequest = {
    state: 'review',
    action: 'approve',
    role: 'reviewer',
    actor: 'maya',
    owner: 'amir',
    actorBranch: 'north',
    recordBranch: 'north',
    complete: true,
    returnReason: '',
    evidence: [],
};

const exampleCases: WorkflowCase[] = [
    {
        title: 'Reviewer approves',
        request: sampleRequest,
        expected: { allowed: true, nextState: 'approved', auditEvent: 'approved' },
    },
    {
        title: 'Self-approval is blocked',
        request: { ...sampleRequest, actor: 'amir' },
        expected: { allowed: false, nextState: 'review', auditEvent: null },
    },
    {
        title: 'Return without a reason is blocked',
        request: { ...sampleRequest, action: 'return' },
        expected: { allowed: false, nextState: 'review', auditEvent: null },
    },
];

function label(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');
}

function initialRequest(contract: WorkflowContract, sample: boolean): WorkflowRequest {
    if (sample) return sampleRequest;
    const transition = contract.transitions.find(({ from }) => from === contract.initial);
    return {
        ...sampleRequest,
        state: contract.initial,
        action: transition?.action ?? contract.transitions[0].action,
        role: transition?.roles[0] ?? contract.roles[0],
    };
}

function json(value: unknown) {
    return JSON.stringify(value, null, 2) + '\n';
}

function download(name: string, body: string, mime: string) {
    const href = URL.createObjectURL(new Blob([body], { type: mime + ';charset=utf-8' }));
    const link = document.createElement('a');
    link.download = name;
    link.href = href;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export default function WorkflowTester({ example }: { example: WorkflowContract }) {
    const ready = useClientReady();
    const [contract, setContract] = useState(example);
    const [source, setSource] = useState(() => json(example));
    const [request, setRequest] = useState(sampleRequest);
    const [decision, setDecision] = useState<WorkflowDecision | null>(null);
    const [cases, setCases] = useState<WorkflowCase[]>(exampleCases);
    const [errors, setErrors] = useState<string[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [contractNote, setContractNote] = useState('');
    const [testNote, setTestNote] = useState('');
    const [exportNote, setExportNote] = useState('');
    const importRevision = useRef(0);
    const actionSelect = useRef<HTMLSelectElement>(null);
    const isExample = json(contract) === json(example);
    const pendingChanges = source !== json(contract);
    const availableActions = [...new Set(contract.transitions.map(({ action }) => action))];
    const selectedTransition = contract.transitions.find(
        ({ from, action }) => from === request.state && action === request.action,
    );
    const additionalEvidence = (selectedTransition?.requires ?? []).filter(
        (guard) => !Object.hasOwn(workflowGuardLabels, guard),
    );

    function updateRequest(changes: Partial<WorkflowRequest>) {
        setRequest((current) => ({ ...current, ...changes }));
        setDecision(null);
        setTestNote('');
    }

    function applyContract(text: string) {
        const result = readWorkflowContract(text);
        if (result.errors) {
            setErrors(result.errors);
            setContractNote('The last validated contract remains active.');
            return;
        }
        const sample = json(result.contract) === json(example);
        setContract(result.contract);
        setSource(json(result.contract));
        setWarnings(result.warnings);
        setErrors([]);
        setContractNote(`Contract v${result.contract.version} is active.`);
        if (json(result.contract) !== json(contract)) {
            setRequest(initialRequest(result.contract, sample));
            setDecision(null);
            setCases(sample ? exampleCases : []);
            setTestNote('');
            setExportNote('');
        }
    }

    async function importContract(event: ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!file) return;

        const revision = ++importRevision.current;
        setContractNote(`Reading ${file.name}…`);
        try {
            const text = (await file.text()).replace(/^\uFEFF/u, '');
            if (importRevision.current !== revision) return;
            setSource(text);
            applyContract(text);
        } catch {
            if (importRevision.current !== revision) return;
            setErrors(['This file could not be read. Try importing it again or paste the JSON.']);
            setContractNote('The last validated contract remains active.');
        }
    }

    function runDecision(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setDecision(evaluateWorkflow(contract, request));
        setTestNote('');
    }

    function saveCase() {
        if (!decision) return;
        if (cases.some((item) => json(item.request) === json(request))) {
            setTestNote('This request already has an acceptance case.');
            return;
        }
        const { allowed, nextState, auditEvent } = decision;
        const title = `${label(request.action)} from ${label(request.state)} as ${label(request.role)}`;
        setCases([...cases, { title, request, expected: { allowed, nextState, auditEvent } }]);
        setTestNote('Acceptance case saved.');
    }

    return (
        <div className="workflow-tester" inert={!ready}>
            <div className="workflow-tester__desk">
                <section aria-labelledby="workflow-request">
                    <h2 id="workflow-request">Try a transition</h2>
                    {isExample && (
                        <div
                            className="workflow-tester__presets"
                            role="group"
                            aria-label="Example requests"
                        >
                            {exampleCases.map(({ title, request }) => (
                                <button
                                    type="button"
                                    key={title}
                                    onClick={() => updateRequest(request)}
                                >
                                    {title}
                                </button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={runDecision}>
                        <div className="workflow-tester__fields">
                            <label>
                                Current state
                                <select
                                    value={request.state}
                                    onChange={(event) =>
                                        updateRequest({ state: event.target.value })
                                    }
                                >
                                    {contract.states.map((state) => (
                                        <option key={state} value={state}>
                                            {label(state)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Action
                                <select
                                    ref={actionSelect}
                                    value={request.action}
                                    onChange={(event) =>
                                        updateRequest({ action: event.target.value })
                                    }
                                >
                                    {availableActions.map((action) => (
                                        <option key={action} value={action}>
                                            {label(action)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Actor role
                                <select
                                    value={request.role}
                                    onChange={(event) =>
                                        updateRequest({ role: event.target.value })
                                    }
                                >
                                    {contract.roles.map((role) => (
                                        <option key={role} value={role}>
                                            {label(role)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <fieldset>
                            <legend>Actor and record facts</legend>
                            <div className="workflow-tester__facts">
                                <label>
                                    Actor identifier
                                    <input
                                        value={request.actor}
                                        onChange={(event) =>
                                            updateRequest({ actor: event.target.value })
                                        }
                                    />
                                </label>
                                <label>
                                    Record owner identifier
                                    <input
                                        value={request.owner}
                                        onChange={(event) =>
                                            updateRequest({ owner: event.target.value })
                                        }
                                    />
                                </label>
                                <label>
                                    Actor branch
                                    <input
                                        value={request.actorBranch}
                                        onChange={(event) =>
                                            updateRequest({ actorBranch: event.target.value })
                                        }
                                    />
                                </label>
                                <label>
                                    Record branch
                                    <input
                                        value={request.recordBranch}
                                        onChange={(event) =>
                                            updateRequest({ recordBranch: event.target.value })
                                        }
                                    />
                                </label>
                                <label className="workflow-tester__full">
                                    Return reason
                                    <input
                                        value={request.returnReason}
                                        onChange={(event) =>
                                            updateRequest({ returnReason: event.target.value })
                                        }
                                    />
                                </label>
                                <label className="workflow-tester__check workflow-tester__full">
                                    <input
                                        type="checkbox"
                                        checked={request.complete}
                                        onChange={(event) =>
                                            updateRequest({ complete: event.target.checked })
                                        }
                                    />
                                    Required fields are complete
                                </label>
                                {additionalEvidence.map((guard) => (
                                    <label
                                        className="workflow-tester__check workflow-tester__full"
                                        key={guard}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={request.evidence.includes(guard)}
                                            onChange={(event) =>
                                                updateRequest({
                                                    evidence: event.target.checked
                                                        ? [...request.evidence, guard]
                                                        : request.evidence.filter(
                                                              (item) => item !== guard,
                                                          ),
                                                })
                                            }
                                        />
                                        Evidence provided for <code>{guard}</code>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <button className="workflow-tester__primary" type="submit">
                            Test transition
                        </button>
                    </form>
                </section>

                <section
                    aria-labelledby="workflow-result"
                    data-outcome={decision ? (decision.allowed ? 'allowed' : 'blocked') : undefined}
                >
                    <h2 id="workflow-result">Decision</h2>
                    <div role="status" aria-atomic="true" className="workflow-tester__decision">
                        {!decision ? (
                            <p>Run the test to see the next state and expected audit event.</p>
                        ) : (
                            <>
                                <h3>
                                    {decision.allowed ? (
                                        <Check aria-hidden="true" />
                                    ) : (
                                        <X aria-hidden="true" />
                                    )}
                                    {decision.allowed ? 'Allowed' : 'Blocked'}
                                </h3>
                                <p>{decision.reason}</p>
                                <dl>
                                    <div>
                                        <dt>Next state</dt>
                                        <dd>{label(decision.nextState)}</dd>
                                    </div>
                                    <div>
                                        <dt>Expected audit event</dt>
                                        <dd>
                                            {decision.auditEvent ? (
                                                <code>{decision.auditEvent}</code>
                                            ) : (
                                                'None'
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </>
                        )}
                    </div>
                    {Boolean(decision?.checks.length) && (
                        <ul className="workflow-tester__trace" aria-label="Guard results">
                            {decision?.checks.map(({ guard, passed, reason }) => (
                                <li key={guard}>
                                    <strong>{passed ? 'Pass' : 'Fail'}</strong> {reason}
                                </li>
                            ))}
                        </ul>
                    )}
                    {decision && (
                        <button type="button" onClick={saveCase}>
                            Save acceptance case
                        </button>
                    )}
                    <p className="workflow-tester__note" role="status">
                        {testNote}
                    </p>
                </section>
            </div>

            <section
                className="workflow-tester__map"
                aria-labelledby="workflow-map"
                aria-describedby="workflow-map-help"
            >
                <h2 id="workflow-map">Transition map</h2>
                <p id="workflow-map-help">
                    The workflow starts in <strong>{label(contract.initial)}</strong>. Select an
                    action to load it in the tester.
                </p>
                <ul>
                    {contract.transitions.map((transition) => (
                        <li key={transition.from + ':' + transition.action}>
                            <div className="workflow-tester__edge">
                                <span>{label(transition.from)}</span>
                                <ArrowRight aria-hidden="true" />
                                <button
                                    type="button"
                                    aria-label={`Try ${label(transition.action)} from ${label(transition.from)} to ${label(transition.to)}`}
                                    aria-pressed={selectedTransition === transition}
                                    onClick={() => {
                                        updateRequest({
                                            state: transition.from,
                                            action: transition.action,
                                        });
                                        actionSelect.current?.focus();
                                    }}
                                >
                                    {label(transition.action)}
                                </button>
                                <ArrowRight aria-hidden="true" />
                                <span>{label(transition.to)}</span>
                            </div>
                            <div className="workflow-tester__edge-facts">
                                <dl>
                                    <div>
                                        <dt>Roles</dt>
                                        <dd>{transition.roles.map(label).join(', ')}</dd>
                                    </div>
                                    <div>
                                        <dt>Guards</dt>
                                        <dd>
                                            {transition.requires
                                                .map((guard) =>
                                                    Object.hasOwn(workflowGuardLabels, guard)
                                                        ? workflowGuardLabels[guard]
                                                        : guard,
                                                )
                                                .join(', ') || 'None'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Event</dt>
                                        <dd>
                                            <code>{transition.auditEvent}</code>
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="workflow-tester__contract" aria-labelledby="workflow-contract">
                <h2 id="workflow-contract">Workflow contract</h2>
                <p>Paste a contract or open a JSON file. The file stays in this browser.</p>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        importRevision.current++;
                        applyContract(source);
                    }}
                >
                    <label className="workflow-tester__file">
                        Open a JSON contract
                        <input
                            type="file"
                            accept=".json,application/json"
                            onChange={importContract}
                        />
                    </label>
                    <label htmlFor="workflow-json">Contract JSON</label>
                    <textarea
                        id="workflow-json"
                        value={source}
                        rows={10}
                        spellCheck={false}
                        dir="ltr"
                        aria-invalid={errors.length ? true : undefined}
                        aria-describedby={errors.length ? 'workflow-contract-errors' : undefined}
                        onChange={(event) => {
                            importRevision.current++;
                            setSource(event.target.value);
                            setErrors([]);
                            setContractNote('');
                        }}
                    />
                    <div className="workflow-tester__actions">
                        <button className="workflow-tester__primary" type="submit">
                            Validate and use contract
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                importRevision.current++;
                                applyContract(json(example));
                            }}
                        >
                            Load approval example
                        </button>
                    </div>
                    <div role="status" aria-atomic="true">
                        {(pendingChanges || contractNote) && (
                            <p className="workflow-tester__note">
                                {contractNote ||
                                    'Validate the edited JSON to use it in the tester.'}
                            </p>
                        )}
                        {Boolean(errors.length) && (
                            <ul
                                id="workflow-contract-errors"
                                className="workflow-tester__messages"
                                data-severity="error"
                            >
                                {errors.map((error) => (
                                    <li key={error}>{error}</li>
                                ))}
                            </ul>
                        )}
                        {Boolean(warnings.length) && (
                            <ul className="workflow-tester__messages" data-severity="warning">
                                {warnings.map((warning) => (
                                    <li key={warning}>{warning}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </form>
            </section>

            <section className="workflow-tester__exports" aria-labelledby="workflow-exports">
                <h2 id="workflow-exports">Acceptance cases and exports</h2>
                <p>
                    Take the active contract, its diagram, or its acceptance cases into your design
                    review.
                </p>
                {cases.length ? (
                    <ul className="workflow-tester__cases">
                        {cases.map(({ title, request, expected }, index) => (
                            <li key={json(request)}>
                                <span>
                                    <strong>{title}</strong> ·{' '}
                                    {expected.allowed ? 'Allowed' : 'Blocked'} →{' '}
                                    {label(expected.nextState)}
                                </span>
                                <button
                                    type="button"
                                    aria-label={`Remove acceptance case ${index + 1}, ${title}`}
                                    onClick={() =>
                                        setCases(cases.filter((_, position) => index !== position))
                                    }
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Test a transition and save its decision to create an acceptance case.</p>
                )}
                <div className="workflow-tester__actions">
                    <button
                        type="button"
                        onClick={() => {
                            download('workflow-contract.json', json(contract), 'application/json');
                            setExportNote('Workflow contract downloaded.');
                        }}
                    >
                        <Download size={16} aria-hidden="true" /> Contract JSON
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            download(
                                'workflow-diagram.mmd',
                                workflowMermaid(contract),
                                'text/plain',
                            );
                            setExportNote('Mermaid diagram downloaded.');
                        }}
                    >
                        <Download size={16} aria-hidden="true" /> Mermaid diagram
                    </button>
                    <button
                        type="button"
                        disabled={!cases.length}
                        onClick={() => {
                            download(
                                'workflow-acceptance.json',
                                json({ contractVersion: contract.version, cases }),
                                'application/json',
                            );
                            setExportNote('Acceptance cases downloaded.');
                        }}
                    >
                        <Download size={16} aria-hidden="true" /> Acceptance cases
                    </button>
                </div>
                <p className="workflow-tester__note" role="status">
                    {exportNote}
                </p>
                <a href="#workflow-request">
                    <ArrowUp size={16} aria-hidden="true" /> Back to the tester
                </a>
            </section>
        </div>
    );
}
