import { useState, useEffect, useRef } from 'react';
import createModel from './model';
export default function Example() {
    const [m] = useState(createModel),
        [, set] = useState(0),
        update = (fn: () => void) => {
            fn();
            set((n) => n + 1);
        };
    const chart = useRef<SVGSVGElement>(null);
    useEffect(() => {
        const svg = chart.current;
        if (!svg) return;
        const draw = () => m.draw(svg);
        draw();
        const obs = new MutationObserver(draw);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
        return () => obs.disconnect();
    }, [m, m.tab, m.compact, m.hide, m.selected]);
    return (
        <section className="kit-panel">
            <div className="kit-row" aria-label="Explorer view">
                {['Contract', 'Org chart'].map((tab) => (
                    <button
                        key={tab}
                        aria-pressed={tab === m.tab}
                        onClick={() =>
                            update(() => {
                                m.tab = tab;
                            })
                        }
                    >
                        {tab}
                    </button>
                ))}
            </div>
            {m.tab === 'Contract' ? (
                <>
                    <label>
                        Demo viewer
                        <select
                            value={m.viewer}
                            onChange={(e) => {
                                const pending = m.switchViewer(e.target.value);
                                set((n) => n + 1);
                                void pending.then(() => set((n) => n + 1));
                            }}
                        >
                            <option>Coordinator</option>
                            <option>HR manager</option>
                        </select>
                    </label>
                    <div className="kit-row">
                        {['Live terms', 'asSigned() original'].map((text, i) => (
                            <button
                                key={text}
                                aria-pressed={m.signed === !!i}
                                onClick={() =>
                                    update(() => {
                                        m.signed = !!i;
                                    })
                                }
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                    <dl className="kit-grid">
                        {Object.entries(m.terms).map(([k, v]) => (
                            <div key={k}>
                                <dt>{k}</dt>
                                <dd>
                                    <bdi>{v}</bdi>
                                </dd>
                            </div>
                        ))}
                    </dl>
                    {m.viewer === 'Coordinator' && <p>🔒 Pay is withheld for this viewer.</p>}
                    {m.payState === 'loading' && <p role="status">Loading pay terms…</p>}
                    {m.payState === 'error' && (
                        <p role="alert">
                            Pay terms could not load.{' '}
                            <button
                                onClick={() =>
                                    void m.switchViewer(m.viewer).then(() => set((n) => n + 1))
                                }
                            >
                                Retry
                            </button>
                        </p>
                    )}
                    {m.amendments.map((a) => (
                        <details key={a.id}>
                            <summary>
                                {a.id} · <bdi>{a.date}</bdi> · {a.reason}
                            </summary>
                            <dl>
                                {Object.entries(a.before).map(([k, v]) => (
                                    <div key={k}>
                                        <dt>{k}</dt>
                                        <dd>
                                            <del>{v}</del> →{' '}
                                            <ins>{a.after[k as keyof typeof a.after]}</ins>
                                        </dd>
                                    </div>
                                ))}
                                {m.pay && (
                                    <div>
                                        <dt>monthly pay</dt>
                                        <dd>
                                            <del>{m.pay.amendments[a.id].before}</del> →{' '}
                                            <ins>{m.pay.amendments[a.id].after}</ins>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </details>
                    ))}
                </>
            ) : (
                <>
                    <div className="kit-row">
                        <button
                            aria-pressed={m.compact}
                            onClick={() =>
                                update(() => {
                                    m.compact = !m.compact;
                                })
                            }
                        >
                            Compact spacing
                        </button>
                        <button
                            data-vacancies
                            aria-pressed={m.hide}
                            onClick={() =>
                                update(() => {
                                    m.hide = !m.hide;
                                    if (!m.position) m.selected = 'P1';
                                })
                            }
                        >
                            Hide vacancies
                        </button>
                        <button
                            onClick={() => {
                                if (chart.current) m.download(chart.current);
                            }}
                        >
                            Download SVG
                        </button>
                    </div>
                    <small>
                        Solid line · direct report. Dashed line · technical report. Dashed box ·
                        vacancy.
                    </small>
                    <svg
                        data-org-tree
                        role="group"
                        aria-label="Reporting lines"
                        className="w-full"
                        ref={chart}
                        onClick={(e) => update(() => m.select(e.nativeEvent))}
                        onKeyDown={(e) => {
                            if (['Enter', ' '].includes(e.key)) {
                                e.preventDefault();
                                update(() => m.select(e.nativeEvent));
                            }
                        }}
                    />
                    <p role="status">
                        {m.position?.title} · {m.position?.vacant ? 'Vacant' : m.position?.holder}
                    </p>
                </>
            )}
        </section>
    );
}
