import { useEffect, useState } from 'react';
import createModel from './model';
export default function Example() {
    const [m] = useState(createModel),
        [, set] = useState(0);
    const refresh = () => set((n) => n + 1);
    const change = (fn: () => void) => {
        fn();
        refresh();
    };
    useEffect(() => {
        m.notify = refresh;
        return () => {
            m.notify = undefined;
            m.destroy();
        };
    }, [m]);
    return (
        <section
            className="kit-panel"
            onKeyDown={(e) => change(() => m.keyboard(e.nativeEvent, e.currentTarget))}
        >
            <h3>Needs action</h3>
            <label>
                <input
                    type="checkbox"
                    checked={m.fault}
                    onChange={(e) =>
                        change(() => {
                            void m.load(e.target.checked);
                        })
                    }
                />{' '}
                Fail licenses query
            </label>
            {m.failed > 0 && (
                <p role="alert">
                    {m.failed} source unavailable · digest incomplete.{' '}
                    <button
                        onClick={() =>
                            change(() => {
                                void m.load(false);
                            })
                        }
                    >
                        Retry
                    </button>
                </p>
            )}
            <ul className="kit-grid" data-loading={m.busy || undefined}>
                {m.digest.map((r) => (
                    <li key={r.key}>
                        <span className="status-badge surface" data-tone={r.tone}>
                            {r.glyph} {r.label}
                        </span>{' '}
                        <bdi className="kit-value">{r.count}</bdi>
                    </li>
                ))}
            </ul>
            <h3>Work inbox</h3>
            <small>J / K · move between items. E · approve. S · snooze.</small>
            <ul className="kit-list">
                {m.rows.map((r, i) => (
                    <li key={r.key}>
                        <button
                            data-inbox-row
                            aria-pressed={m.active === i}
                            onFocus={() => change(() => m.select(i))}
                            onClick={() => change(() => m.select(i))}
                        >
                            {r.subject}
                        </button>{' '}
                        {r.handled ?? 'Awaiting decision'} · v<bdi>{r.expected}</bdi>
                        <small>
                            Waiting <bdi>{r.waitingDays}</bdi> days{r.overlap && ' · ' + r.overlap}
                        </small>
                    </li>
                ))}
            </ul>
            <div className="kit-row">
                <button onClick={() => change(() => m.decide('Approve'))}>Approve</button>
                <button onClick={() => change(() => m.decide('Snooze'))}>Snooze</button>
                <button onClick={() => change(() => m.stale())}>Simulate stale version</button>
                <button onClick={() => change(() => m.reload())}>Reload item</button>
            </div>
            <p role="status">{m.outcome}</p>
            {m.undoItem && (
                <button onClick={() => change(() => m.undo())}>Undo decision (6 seconds)</button>
            )}
        </section>
    );
}
