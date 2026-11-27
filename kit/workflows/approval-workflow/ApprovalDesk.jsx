import React, { useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import {
    actors,
    availableActions,
    canRead,
    display,
    matrix,
    needsAttention,
    requests,
    transition,
} from './workflow.mjs';

const initial = { records: requests, result: '', committed: false };
const subscribeToReadiness = () => () => undefined;
const clientReady = () => true;
const serverReady = () => false;

function approvalReducer(state, event) {
    if (event.type === 'reset') return initial;
    if (event.type === 'clear-result') return { ...state, result: '', committed: false };

    const current = state.records.find((record) => record.id === event.id);
    const result = transition(current, event.actor, event.action, event.version, event.note);
    return {
        records: result.updated
            ? state.records.map((record) => (record.id === event.id ? result.updated : record))
            : state.records,
        result: result.message,
        committed: Boolean(result.updated),
    };
}

function PermissionMatrix() {
    return (
        <details className="approval-matrix">
            <summary>Permission matrix</summary>
            <div
                className="approval-table"
                role="region"
                aria-label="Permission matrix columns"
                tabIndex={0}
            >
                <table>
                    <thead>
                        <tr>
                            <th scope="col">From → To</th>
                            <th scope="col">Action</th>
                            <th scope="col">Role</th>
                            <th scope="col">Requirements</th>
                            <th scope="col">Audit event</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.transitions.map((edge) => (
                            <tr key={`${edge.from}-${edge.action}`}>
                                <td>
                                    {display(edge.from)} → {display(edge.to)}
                                </td>
                                <th scope="row">{display(edge.action)}</th>
                                <td>{edge.roles.map(display).join(', ')}</td>
                                <td>{edge.requires.map(display).join(', ')}</td>
                                <td>{display(edge.auditEvent)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </details>
    );
}

export default function ApprovalDesk() {
    const ready = useSyncExternalStore(subscribeToReadiness, clientReady, serverReady);
    const [state, dispatch] = useReducer(approvalReducer, initial);
    const [actorId, setActorId] = useState('samira');
    const [recordId, setRecordId] = useState('REQ-1042');
    const [reason, setReason] = useState('');
    const heading = useRef(null);
    const actor = actors.find((item) => item.id === actorId) ?? actors[0];
    const visible = state.records.filter((record) => canRead(record, actor));
    const inbox = visible.filter((record) => needsAttention(record, actor));
    const selected = visible.find((record) => record.id === recordId) ?? inbox[0] ?? visible[0];
    const actions = availableActions(selected, actor);
    const canReturn = actions.some(({ action }) => action === 'return');

    useEffect(() => {
        if (state.committed) heading.current?.focus();
    }, [state.committed]);

    function chooseRecord(id) {
        setRecordId(id);
        setReason('');
        dispatch({ type: 'clear-result' });
    }

    function act(action) {
        if (!selected) return;
        dispatch({
            type: 'transition',
            id: selected.id,
            version: selected.version,
            actor,
            action,
            note: reason,
        });
    }

    function reset() {
        setActorId('samira');
        setRecordId('REQ-1042');
        setReason('');
        dispatch({ type: 'reset' });
    }

    return (
        <section className="approval-recipe" aria-label="Approval workflow demo" inert={!ready}>
            <div className="approval-toolbar">
                <label>
                    Active actor
                    <select
                        value={actorId}
                        onChange={(event) => {
                            setActorId(event.target.value);
                            chooseRecord('');
                        }}
                    >
                        {actors.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name} · {display(item.role)} · {item.branch}
                            </option>
                        ))}
                    </select>
                </label>
                <button className="approval-secondary" type="button" onClick={reset}>
                    Reset demo
                </button>
            </div>
            <details className="approval-scope">
                <summary>
                    Role scope · {display(actor.role)} · {actor.branch}
                </summary>
                <p>
                    {actor.role === 'author'
                        ? 'Authors see their own requests in their branch and can submit a complete draft.'
                        : 'Reviewers see requests in their branch. They can return a request with a reason and approve requests they did not write.'}
                </p>
            </details>
            <div className="approval-workspace">
                <aside className="approval-inbox" aria-labelledby="approval-inbox-heading">
                    <h2 id="approval-inbox-heading">
                        Needs action <span>{inbox.length}</span>
                    </h2>
                    {inbox.length > 0 ? (
                        <ul>
                            {inbox.map((record) => (
                                <li key={record.id}>
                                    <button
                                        type="button"
                                        aria-current={
                                            selected?.id === record.id ? 'true' : undefined
                                        }
                                        onClick={() => chooseRecord(record.id)}
                                    >
                                        <small>{record.id}</small>
                                        <span>{record.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Nothing needs action.</p>
                    )}
                </aside>
                <div className="approval-inspector">
                    {selected ? (
                        <>
                            <label>
                                In-scope request
                                <select
                                    value={selected.id}
                                    onChange={(event) => chooseRecord(event.target.value)}
                                >
                                    {visible.map((record) => (
                                        <option key={record.id} value={record.id}>
                                            {record.id} · {record.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <header>
                                <p>
                                    {selected.id} · {selected.branch} branch · Version{' '}
                                    {selected.version}
                                </p>
                                <h2 ref={heading} tabIndex={-1}>
                                    {selected.title}
                                </h2>
                            </header>
                            <ol className="approval-steps" aria-label="Request lifecycle">
                                {matrix.states.map((step) => (
                                    <li
                                        key={step}
                                        aria-current={selected.state === step ? 'step' : undefined}
                                    >
                                        {display(step)}
                                    </li>
                                ))}
                            </ol>
                            {actions.length ? (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        act('return');
                                    }}
                                >
                                    {canReturn && (
                                        <label>
                                            Return reason
                                            <input
                                                value={reason}
                                                maxLength={240}
                                                onChange={(event) => setReason(event.target.value)}
                                            />
                                        </label>
                                    )}
                                    <div className="approval-buttons">
                                        {actions.map(({ action }) =>
                                            action === 'return' ? (
                                                <button
                                                    className="approval-secondary"
                                                    key={action}
                                                    type="submit"
                                                >
                                                    Return request
                                                </button>
                                            ) : (
                                                <button
                                                    className="approval-primary"
                                                    key={action}
                                                    type="button"
                                                    onClick={() => act(action)}
                                                >
                                                    {display(action)} request
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <p>No actions are available for this actor and state.</p>
                            )}
                            <p className="approval-result" role="status">
                                {state.result}
                            </p>
                            <h3>Audit history</h3>
                            {selected.history.length > 0 ? (
                                <ol className="approval-history">
                                    {selected.history.map((event) => (
                                        <li key={event.version}>
                                            {display(event.type)} by {event.actor} · Version{' '}
                                            {event.version}
                                            {event.reason && ` · ${event.reason}`}
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p>No transitions recorded in this session.</p>
                            )}
                        </>
                    ) : (
                        <p>No requests are visible for this actor.</p>
                    )}
                </div>
            </div>
            <PermissionMatrix />
        </section>
    );
}
