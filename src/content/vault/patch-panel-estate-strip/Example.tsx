import { useEffect, useMemo, useReducer, useState } from 'react';
import panel, { branches, grouped } from './model';
import './style.css';
export default function Example() {
    const [desk] = useState(panel),
        [, refresh] = useReducer((n) => n + 1, 0);
    function act(fn: () => void) {
        fn();
        refresh();
    }
    useEffect(() => {
        desk.init(refresh);
        const close = () => act(() => desk.close());
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            desk.destroy();
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [desk]);
    const p = desk.detail;
    const groups = useMemo(() => grouped(desk.ports, desk.at), [desk.ports, desk.at]);
    return (
        <section
            className="kit-panel"
            onKeyDown={(e) => {
                if (e.key === 'Escape') act(() => desk.close());
            }}
        >
            <div className="kit-row">
                <label>
                    Branch{' '}
                    <select
                        value={desk.branch}
                        onChange={(e) =>
                            act(() => {
                                desk.branch = e.target.value;
                            })
                        }
                    >
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </label>
                <button onClick={() => act(() => desk.outage())}>Simulate branch outage</button>
                <button onClick={() => act(() => desk.checkIn())}>Simulate agent check-in</button>
            </div>
            <p>● Online · ◐ Stale · ○ Never seen</p>
            <p>
                Last refresh <time data-poll-clock>{desk.refreshed}</time> · 15-second interval
            </p>
            {groups.map((g) => (
                <section key={g.id}>
                    <h3>
                        {g.name} ·{' '}
                        <bdi>
                            {g.online}/{g.endpoints.length}
                        </bdi>{' '}
                        online
                    </h3>
                    <div className="estate-ports">
                        {g.endpoints.map((e) => (
                            <button
                                key={e.id}
                                data-state={desk.state(e)}
                                aria-label={e.name + ' · ' + desk.stateLabels[desk.state(e)]}
                                aria-describedby={p?.id === e.id ? 'telemetry' : undefined}
                                onFocus={(ev) => act(() => desk.inspect(e.id, ev.currentTarget))}
                                onPointerEnter={(ev) =>
                                    act(() => desk.inspect(e.id, ev.currentTarget))
                                }
                                onClick={(ev) => act(() => desk.inspect(e.id, ev.currentTarget))}
                                onBlur={() => act(() => desk.close())}
                                onPointerLeave={() => act(() => desk.close())}
                            >
                                {desk.stateLabels[desk.state(e)][0]}
                                <small>{e.name.split('-').at(-1)}</small>
                            </button>
                        ))}
                    </div>
                </section>
            ))}
            {p && (
                <aside role="tooltip" id="telemetry" className="estate-tip" style={desk.position}>
                    <strong>
                        {p.name} · {desk.stateLabels[desk.state(p)]}
                    </strong>
                    <p>
                        Last check-in <bdi>{p.last_seen?.slice(11, 16) ?? 'Never'}</bdi>
                    </p>
                    <dl>
                        {desk.metrics.map((key) => (
                            <div key={key} style={{ display: 'contents' }}>
                                <dt>{key.toUpperCase()}</dt>
                                <dd>
                                    {p.last_seen === null ? (
                                        <span aria-label="not set">—</span>
                                    ) : (
                                        <>
                                            <meter
                                                aria-label={key}
                                                min={0}
                                                max={100}
                                                value={p[key]}
                                            />
                                            <bdi>{p[key]}%</bdi>
                                        </>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </aside>
            )}
            <p role="status">{desk.message}</p>
        </section>
    );
}
