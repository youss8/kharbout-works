import { useState } from 'react';
import { Check, Play, X } from 'lucide-react';
import fixture from '../../data/stack-parity.json';
import recorded from '../../data/stack-parity-livewire.json';
import {
    runReactStackParity,
    sameCheckpoint,
    type StackParityCheckpoint,
    type StackParityTrace,
} from '../../lib/tools/stack-parity';
import { useClientReady } from '../../lib/use-client-ready';
import './stack-parity.css';

const checkpoints = [
    { id: 'initial', label: 'Open the record' },
    { id: 'stale', label: 'Submit after another edit' },
    { id: 'fresh', label: 'Reload and approve' },
] as const;

function TraceState({ title, state }: { title: string; state?: StackParityCheckpoint }) {
    return (
        <div className="parity-state">
            <h3>{title}</h3>
            {state ? (
                <>
                    <p className="parity-reading">
                        <bdi>{state.stage}</bdi> <span>v{state.version}</span>
                    </p>
                    {state.message && <p>{state.message}</p>}
                    <dl className="parity-event">
                        <dt>Transition event</dt>
                        <dd>
                            {state.event ? (
                                <>
                                    <code dir="ltr">{state.event.type}</code>
                                    <p>
                                        <bdi>
                                            {state.event.from} → {state.event.to} · v
                                            {state.event.version}
                                        </bdi>
                                    </p>
                                    <p>{state.event.reason}</p>
                                </>
                            ) : (
                                'None'
                            )}
                        </dd>
                    </dl>
                </>
            ) : (
                <p>Pending run</p>
            )}
        </div>
    );
}

export default function StackParity() {
    const ready = useClientReady();
    const [trace, setTrace] = useState<StackParityTrace | null>(null);
    const results = checkpoints.map(({ id, label }) => {
        const react = trace?.[id];
        const livewire = recorded.trace[id];
        const expected = fixture.expected[id];
        return {
            id,
            label,
            react,
            livewire,
            match: react && sameCheckpoint(react, expected) && sameCheckpoint(livewire, expected),
        };
    });
    const matching = results.filter((result) => result.match).length;

    return (
        <section className="stack-parity" aria-label="Lifecycle comparison">
            <div className="parity-toolbar">
                <div>
                    <h2>Stale approval</h2>
                    <p>
                        A reviewer opens a proposal at version 1. Another edit takes it to version 2
                        before the reviewer submits. Try the same sequence in the React model and
                        compare the state and in-memory transition event with the recorded Livewire
                        run.
                    </p>
                    <p className="parity-runtime">
                        Livewire {recorded.livewireVersion.replace(/^v/u, '')} · Laravel{' '}
                        {recorded.laravelVersion.replace(/^v/u, '')} · PHP {recorded.phpVersion} ·{' '}
                        <time dateTime={recorded.recordedOn}>{recorded.recordedOn}</time>
                    </p>
                </div>
                <button
                    className="dev-button dev-button--primary"
                    type="button"
                    disabled={!ready}
                    onClick={() => setTrace(runReactStackParity(fixture))}
                >
                    <Play size={16} aria-hidden="true" /> Run React comparison
                </button>
                <p className="parity-feedback" role="status">
                    {trace
                        ? `${matching}/${results.length} checkpoints match the fixture.`
                        : 'The React model is ready to run.'}
                </p>
            </div>

            <ol className="parity-checkpoints">
                {results.map(({ id, label, react, livewire, match }) => {
                    const Icon = match ? Check : X;
                    return (
                        <li className="parity-checkpoint" key={id}>
                            <div className="parity-checkpoint__title">
                                <h2>{label}</h2>
                                {trace && (
                                    <span className="parity-badge" data-match={match}>
                                        <Icon size={14} aria-hidden="true" />{' '}
                                        {match ? 'Match' : 'Differs from fixture'}
                                    </span>
                                )}
                            </div>
                            <div className="parity-checkpoint__columns">
                                <TraceState title="React · current run" state={react} />
                                <TraceState title="Livewire · recorded" state={livewire} />
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
