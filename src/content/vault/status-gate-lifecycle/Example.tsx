import { useEffect, useRef, useState } from 'react';
import createModel, { centerStep, type Stage } from './model';
export default function Example() {
    const [m] = useState(createModel),
        [, set] = useState(0);
    const update = (fn: () => void) => {
        fn();
        set((n) => n + 1);
    };
    const modal = useRef<HTMLDialogElement>(null),
        track = useRef<HTMLOListElement>(null);
    useEffect(() => {
        if (track.current) centerStep(track.current);
    }, [m.current]);
    return (
        <section className="kit-panel">
            <ol className="flex gap-2 overflow-x-auto" aria-label="Proposal lifecycle" ref={track}>
                {m.stepViews.map((step) => (
                    <li
                        key={step.label}
                        data-step-state={step.state}
                        aria-current={step.active ? 'step' : undefined}
                    >
                        <span>
                            {step.glyph} {step.label}
                        </span>
                        {step.active && m.held && (
                            <span className="status-badge dashed">◐ On hold</span>
                        )}
                        {step.date && (
                            <small>
                                <time dateTime={step.date}>
                                    <bdi>{step.date}</bdi>
                                </time>
                            </small>
                        )}
                    </li>
                ))}
            </ol>
            <div className="kit-row">
                <label>
                    <input
                        type="checkbox"
                        checked={m.held}
                        onChange={(e) =>
                            update(() => {
                                m.held = e.target.checked;
                            })
                        }
                    />{' '}
                    On hold
                </label>
                <button
                    disabled={!m.legal.length}
                    onClick={() => {
                        update(() => m.begin());
                        modal.current?.showModal();
                    }}
                >
                    Change status
                </button>
            </div>
            <p role="status">{m.notice}</p>
            <dialog ref={modal} className="kit-panel" aria-label="Transition requirements">
                <label>
                    Next status
                    <select
                        value={m.target}
                        onChange={(e) =>
                            update(() => {
                                m.target = e.target.value as Stage;
                            })
                        }
                    >
                        {m.legal.map((s) => (
                            <option key={s}>{s}</option>
                        ))}
                    </select>
                </label>
                {m.target === 'Approved' && (
                    <>
                        <label>
                            <input
                                type="checkbox"
                                checked={m.signed}
                                onChange={(e) =>
                                    update(() => {
                                        m.signed = e.target.checked;
                                    })
                                }
                            />{' '}
                            Signed funding agreement
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={m.budget}
                                onChange={(e) =>
                                    update(() => {
                                        m.budget = e.target.checked;
                                    })
                                }
                            />{' '}
                            Budget and dates confirmed
                        </label>
                    </>
                )}
                <label>
                    Reason
                    <textarea
                        value={m.reason}
                        onChange={(e) =>
                            update(() => {
                                m.reason = e.target.value;
                            })
                        }
                    />
                </label>
                <button
                    onClick={() =>
                        update(() => {
                            m.version++;
                        })
                    }
                >
                    Simulate concurrent edit
                </button>
                {m.version !== m.expected && (
                    <button
                        onClick={() =>
                            update(() => {
                                m.expected = m.version;
                            })
                        }
                    >
                        Reload latest version
                    </button>
                )}
                <ul role="status">
                    {m.errors.map((err) => (
                        <li key={err}>{err}</li>
                    ))}
                </ul>
                <div className="kit-row">
                    <button autoFocus onClick={() => modal.current?.close()}>
                        Cancel
                    </button>
                    <button
                        disabled={!!m.errors.length}
                        onClick={() =>
                            update(() => {
                                if (m.apply()) modal.current?.close();
                            })
                        }
                    >
                        Apply transition
                    </button>
                </div>
            </dialog>
        </section>
    );
}
