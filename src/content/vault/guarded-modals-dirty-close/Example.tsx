import { createPortal } from 'react-dom';
import { useKitModel } from '../../../components/vault/useKitModel';
import createGuards from './model';
export default function Example() {
    const m = useKitModel(createGuards);
    return (
        <section className="kit-panel">
            <div className="kit-row">
                <button onClick={() => m.open('edit')}>Edit schedule</button>
                <button onClick={() => m.open('reset')}>Reset credentials</button>
                <button data-note-trigger aria-controls="guard-note" onClick={() => m.open('note')}>
                    Record decision
                </button>
            </div>
            <p role="status">{m.message}</p>
            <details id="schedule-policy">
                <summary>Scheduling rules</summary>Daily hours must be between 0 and 24.
            </details>
            <dialog
                id="guard-modal"
                aria-labelledby="guard-title"
                className="kit-panel m-auto max-sm:mb-0 max-sm:w-full"
                onCancel={(e) => {
                    e.preventDefault();
                    m.cancel();
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget && m.mode !== 'edit') m.cancel();
                }}
            >
                <div>
                    <h3 id="guard-title">
                        {m.mode === 'edit'
                            ? 'Edit schedule'
                            : m.mode === 'reset'
                              ? 'Reset credentials'
                              : 'Decision note'}
                    </h3>
                    {m.mode === 'edit' && (
                        <>
                            <label>
                                Hours{' '}
                                <input
                                    data-hours
                                    disabled={m.pending}
                                    value={m.hours}
                                    onChange={(e) => (m.hours = e.target.value)}
                                />
                            </label>
                            <fieldset disabled={m.pending}>
                                <legend>Work days</legend>
                                {['1', '2', '3'].map((d) => (
                                    <label key={d}>
                                        <input
                                            type="checkbox"
                                            checked={m.days.includes(d)}
                                            onChange={() => m.toggle(d)}
                                        />
                                        Day {d}
                                    </label>
                                ))}
                            </fieldset>
                            <label>
                                Start time{' '}
                                <input
                                    value={m.startTime}
                                    disabled={m.pending}
                                    onChange={(e) => (m.startTime = e.target.value)}
                                />
                            </label>
                            <label>
                                Schedule attachment{' '}
                                <input
                                    type="file"
                                    disabled={m.pending}
                                    onChange={(e) => m.stage(e.target.files)}
                                />
                            </label>
                            <small>Attachments stay in this browser.</small>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={m.rejectNext}
                                    disabled={m.pending}
                                    onChange={(e) => (m.rejectNext = e.target.checked)}
                                />
                                Reject next save
                            </label>
                            <a href="#schedule-policy">Schedule policy</a>
                            {m.error && (
                                <div role="alert">
                                    {m.error}{' '}
                                    <button disabled={m.pending} onClick={() => m.save()}>
                                        Retry
                                    </button>
                                </div>
                            )}
                            <p>{m.dirty ? 'Unsaved changes' : 'No changes'}</p>
                        </>
                    )}
                    {m.mode === 'reset' && (
                        <div>
                            <p className="kit-cell">
                                Operator A · North Hub
                                <br />
                                Resetting replaces this account’s demo credentials.
                            </p>
                            <label>
                                Type RESET to confirm{' '}
                                <input
                                    autoComplete="off"
                                    value={m.word}
                                    onChange={(e) => (m.word = e.target.value)}
                                />
                            </label>
                        </div>
                    )}
                    {m.discard ? (
                        <div role="group" aria-label="Unsaved changes">
                            <p>Discard your schedule edits?</p>
                            <button onClick={() => m.keepEditing()}>Keep editing</button>
                            <button onClick={() => m.close(true)}>Discard changes</button>
                        </div>
                    ) : (
                        <div className="kit-row">
                            <button data-cancel disabled={m.pending} onClick={() => m.cancel()}>
                                Cancel
                            </button>
                            <button
                                disabled={
                                    m.mode === 'edit'
                                        ? m.pending || !m.hours.trim()
                                        : m.mode === 'reset'
                                          ? m.word !== 'RESET'
                                          : !m.note.trim()
                                }
                                data-loading={m.pending || undefined}
                                onClick={() => m.save()}
                            >
                                {m.mode === 'edit'
                                    ? 'Save schedule'
                                    : m.mode === 'reset'
                                      ? 'Confirm reset'
                                      : 'Save decision'}
                            </button>
                        </div>
                    )}
                </div>
            </dialog>
            {createPortal(
                <section
                    popover="auto"
                    id="guard-note"
                    role="dialog"
                    aria-label="Decision note"
                    className="kit-panel"
                >
                    <label>
                        Required note{' '}
                        <textarea
                            rows={3}
                            maxLength={240}
                            value={m.note}
                            onChange={(e) => (m.note = e.target.value)}
                        />
                    </label>
                    <bdi>{m.note.length}/240</bdi>
                    <div className="kit-row">
                        <button onClick={() => m.close()}>Cancel</button>
                        <button disabled={!m.note.trim()} onClick={() => m.save()}>
                            Save decision
                        </button>
                    </div>
                </section>,
                document.body,
            )}
        </section>
    );
}
