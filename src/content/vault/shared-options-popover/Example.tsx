import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useKitModel } from '../../../components/vault/useKitModel';
import createAssignees from './model';
export default function Example() {
    const m = useKitModel(createAssignees);
    useEffect(() => {
        if (m.active < 0) return;
        const close = (e: KeyboardEvent) => {
            if (e.key === 'Escape') m.close();
        };
        const outside = (e: PointerEvent) => {
            if (
                e.target instanceof Element &&
                !e.target.closest('[data-directory],[id^="assign-"]')
            )
                m.close();
        };
        document.addEventListener('keydown', close);
        document.addEventListener('pointerdown', outside);
        return () => {
            document.removeEventListener('keydown', close);
            document.removeEventListener('pointerdown', outside);
        };
    }, [m, m.active]);
    return (
        <section className="kit-panel">
            <p role="status">
                Rendered option buttons: <bdi>{m.count}</bdi> of 2,400 possible row options ·
                Directory: 200
            </p>
            <ol className="kit-list">
                {m.tasks.map((task, i) => (
                    <li className="kit-row" key={task}>
                        <strong>{task}</strong>
                        <span>{m.names(i)}</span>
                        <button
                            id={'assign-' + i}
                            aria-expanded={m.active === i}
                            onClick={(e) => m.open(i, e.currentTarget)}
                        >
                            Assign
                        </button>
                    </li>
                ))}
            </ol>
            {m.active >= 0 &&
                createPortal(
                    <div
                        role="dialog"
                        aria-label="Assign people"
                        data-directory
                        className="kit-panel fixed z-20 overflow-auto bg-surface border border-strong p-3"
                        style={{
                            insetInlineStart: m.inlineStart,
                            insetBlockStart: m.top,
                            width: 'min(320px,calc(100% - 16px))',
                            maxHeight: 'min(340px,calc(100dvh - 16px))',
                        }}
                    >
                        <div className="kit-row">
                            <label>
                                Find an officer{' '}
                                <input
                                    type="search"
                                    data-directory-search
                                    value={m.query}
                                    onChange={(e) => (m.query = e.target.value)}
                                />
                            </label>
                            <button onClick={() => m.close()}>Close</button>
                        </div>
                        {m.error && (
                            <p role="alert">
                                {m.error}{' '}
                                <button type="button" onClick={() => m.fetchDirectory()}>
                                    Retry directory
                                </button>
                            </p>
                        )}
                        {m.loading && <p aria-live="polite">Loading staff directory…</p>}
                        <div
                            className="kit-list"
                            aria-busy={m.loading}
                            data-loading={m.loading || undefined}
                        >
                            {m.options.map((p) => (
                                <button
                                    key={p.id}
                                    data-assignee-option
                                    aria-pressed={(m.assigned[m.active] ?? []).includes(p.id)}
                                    onClick={() => m.toggle(p.id)}
                                >
                                    {(m.assigned[m.active] ?? []).includes(p.id) ? '✓ ' : '○ '}
                                    {p.name}
                                </button>
                            ))}
                        </div>
                        {!m.loading && !m.error && !m.options.length && (
                            <p>No matching officers.</p>
                        )}
                    </div>,
                    document.body,
                )}
        </section>
    );
}
