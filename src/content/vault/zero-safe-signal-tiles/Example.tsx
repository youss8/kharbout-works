import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { countTo, requests, signals } from './model';
function Count({ value }: { value: number }) {
    const el = useRef<HTMLElement>(null);
    useEffect(() => {
        if (el.current) countTo(el.current, value);
    }, [value]);
    return (
        <bdi ref={el} aria-hidden="true">
            {value}
        </bdi>
    );
}
export default function Signals() {
    const [rows, setRows] = useState(requests),
        [slice, setSlice] = useState('');
    const tiles = signals(rows),
        visible = rows.filter((r) => !slice || r.state === slice);
    const toggle = (id: string) => setSlice(slice === id ? '' : id);
    return (
        <section className="kit-panel">
            <div className="kit-grid" role="group" aria-label="Status filters">
                {tiles.map((t) => (
                    <button
                        key={t.id}
                        aria-pressed={slice === t.id}
                        aria-label={t.label + ', ' + t.count}
                        onClick={() => toggle(t.id)}
                    >
                        <span
                            className={'status-badge ' + (t.count ? 'surface' : 'outline')}
                            data-tone={t.tone}
                        >
                            {t.glyph} {t.label}
                        </span>{' '}
                        <Count value={t.count} />
                        {slice === t.id && (
                            <span className="ms-auto" aria-hidden="true" title="Show everything">
                                ×
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div className="signal-strip" role="group" aria-label="Filter by segment">
                {!rows.length && <span>No records</span>}
                {tiles
                    .filter((t) => t.count)
                    .map((t) => (
                        <button
                            className="signal-segment"
                            key={t.id}
                            style={{ '--segment': t.width } as CSSProperties}
                            aria-label={'Filter ' + t.label}
                            aria-pressed={slice === t.id}
                            onClick={() => toggle(t.id)}
                        >
                            <span aria-hidden="true" data-tone={t.tone} />
                        </button>
                    ))}
            </div>
            <div className="kit-row">
                <button
                    onClick={() =>
                        setRows(
                            rows.map((r) => (r.state === 'breach' ? { ...r, state: 'ready' } : r)),
                        )
                    }
                >
                    Zero out breaches
                </button>
                <button className="underline" onClick={() => setSlice('')}>
                    Show all
                </button>
            </div>
            <output aria-live="polite">
                Showing {visible.length} of {rows.length}
            </output>
            <ul className="kit-list">
                {visible.map((r) => (
                    <li key={r.id}>
                        <bdi>{r.id}</bdi> · {tiles.find((t) => t.id === r.state)?.label}
                    </li>
                ))}
            </ul>
        </section>
    );
}
