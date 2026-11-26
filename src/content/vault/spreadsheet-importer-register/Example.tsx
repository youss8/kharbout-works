import { useState } from 'react';
import createModel from './model';
export default function Example() {
    const [m] = useState(createModel),
        [, set] = useState(0),
        update = (fn: () => void) => {
            fn();
            set((n) => n + 1);
        };
    return (
        <section className="kit-panel">
            <label>
                CSV to import
                <textarea
                    rows={5}
                    value={m.csv}
                    onChange={(e) =>
                        update(() => {
                            m.csv = e.target.value;
                            m.preview = [];
                        })
                    }
                />
            </label>
            <div className="kit-row">
                <button onClick={() => update(() => m.parse())}>Parse CSV</button>
                <button onClick={() => update(() => m.loadSample())}>Load sample</button>
            </div>
            {m.error && (
                <p role="alert">
                    {m.error} <button onClick={() => update(() => m.parse())}>Retry</button>
                </p>
            )}
            {!!m.warnings.length && (
                <ul aria-label="Import warnings">
                    {m.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                    ))}
                </ul>
            )}
            {!!m.preview.length && (
                <>
                    <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(m.preview.slice(0, 50), null, 2)}
                    </pre>
                    <p>{m.preview.length} parsed · first 50 shown</p>
                    <button onClick={() => update(() => m.loadRows())}>
                        Load rows into register
                    </button>
                </>
            )}
            <label>
                Search register
                <input
                    type="search"
                    value={m.search}
                    onChange={(e) =>
                        update(() => {
                            m.search = e.target.value;
                        })
                    }
                />
            </label>
            <table className="w-full table-fixed break-words text-start">
                <caption>Backup schedule · 5 January 2026, 12:00 UTC</caption>
                <thead>
                    <tr>
                        {m.columns.map((f) => (
                            <th scope="col" key={f.key}>
                                {f.label}
                            </th>
                        ))}
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {m.visible.slice(0, 100).map((r) => (
                        <tr key={r.id} data-row-tone={m.rowTone(r).tone}>
                            {m.columns.map((f) => (
                                <td key={f.key}>
                                    <bdi aria-label={r[f.key] == null ? 'not set' : undefined}>
                                        {String(r[f.key] ?? '—')}
                                    </bdi>
                                    {f.key === 'name' && (
                                        <small
                                            className="status-badge surface"
                                            data-tone={m.rowTone(r).tone}
                                        >
                                            {m.rowTone(r).label}
                                        </small>
                                    )}
                                </td>
                            ))}
                            <td>
                                <button onClick={() => update(() => m.edit(r))}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <small>{m.visible.length} matches · up to 100 shown</small>
            <button onClick={() => m.exportCsv()}>Export filtered CSV</button>
            {m.editing > 0 && (
                <form
                    className="kit-panel"
                    onSubmit={(e) => {
                        e.preventDefault();
                        update(() => m.save());
                    }}
                >
                    <label>
                        <input
                            type="checkbox"
                            checked={m.includeDetail}
                            onChange={(e) =>
                                update(() => {
                                    m.includeDetail = e.target.checked;
                                })
                            }
                        />{' '}
                        Edit internal notes
                    </label>
                    {m.editable.map((f) => (
                        <label key={f.key}>
                            {f.label}
                            {f.type === 'textarea' ? (
                                <textarea
                                    value={m.form[f.key]}
                                    onChange={(e) =>
                                        update(() => {
                                            m.form[f.key] = e.target.value;
                                        })
                                    }
                                />
                            ) : (
                                <input
                                    type={f.type ?? 'text'}
                                    min={f.min}
                                    step={f.type === 'number' ? 'any' : undefined}
                                    required={f.required}
                                    value={m.form[f.key]}
                                    onChange={(e) =>
                                        update(() => {
                                            m.form[f.key] = e.target.value;
                                        })
                                    }
                                />
                            )}
                        </label>
                    ))}
                    <div className="kit-row">
                        <button>Save partial update</button>
                        <button
                            type="button"
                            onClick={() =>
                                update(() => {
                                    m.editing = 0;
                                })
                            }
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
            {m.payload && (
                <>
                    <h4>Write payload</h4>
                    <pre className="whitespace-pre-wrap">{m.payload}</pre>
                    <h4>Field diff [spec]</h4>
                    <pre className="whitespace-pre-wrap">{m.diff}</pre>
                </>
            )}
            <p role="status">{m.notice}</p>
        </section>
    );
}
