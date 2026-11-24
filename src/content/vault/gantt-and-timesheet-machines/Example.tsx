import { useEffect, useReducer, useRef, useState } from 'react';
import schedule, { type Role, type Decision } from './model';
import './style.css';
export default function Example() {
    const [desk] = useState(schedule),
        [, refresh] = useReducer((n) => n + 1, 0);
    const act = (fn: () => void) => {
            fn();
            refresh();
        },
        cell = desk.zooms[desk.zoom];
    const plot = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (plot.current) desk.mountPlot(plot.current, refresh);
        return () => desk.unmountPlot();
    }, [desk, desk.tab, desk.zoom, desk.days]);
    return (
        <section className="kit-panel" onKeyDown={(e) => act(() => desk.shortcut(e.nativeEvent))}>
            <div className="kit-row">
                {['Gantt', 'Timesheet'].map((t) => (
                    <button
                        key={t}
                        aria-pressed={desk.tab === t}
                        onClick={() =>
                            act(() => {
                                desk.tab = t;
                                desk.notice = '';
                            })
                        }
                    >
                        {t}
                    </button>
                ))}
            </div>
            {desk.tab === 'Gantt' ? (
                <>
                    <div className="kit-row">
                        <label>
                            Zoom{' '}
                            <select
                                value={desk.zoom}
                                onChange={(e) =>
                                    act(() => {
                                        desk.zoom = Number(e.target.value);
                                    })
                                }
                            >
                                {desk.zooms.map((v, i) => (
                                    <option key={v} value={i}>
                                        {v} px/day
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={desk.showCritical}
                                onChange={(e) =>
                                    act(() => {
                                        desk.showCritical = e.target.checked;
                                    })
                                }
                            />{' '}
                            Critical path
                        </label>
                    </div>
                    <label>
                        Trace task{' '}
                        <select
                            value={desk.selected}
                            onChange={(e) => act(() => desk.select(e.target.value))}
                        >
                            <option value="phase">Delivery plan · parent</option>
                            {desk.rows.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Route emphasis
                        <select
                            value={desk.routeMode}
                            onChange={(e) =>
                                act(() => {
                                    desk.routeMode = e.target.value;
                                })
                            }
                        >
                            <option value="selected">Selected route</option>
                            <option value="all">All routes</option>
                            <option value="none">None</option>
                        </select>
                    </label>
                    <p>Delivery plan · {desk.trace.roles.phase}</p>
                    <div
                        className="horizon"
                        role="slider"
                        tabIndex={0}
                        aria-label="Schedule horizon"
                        aria-valuemin={0}
                        aria-valuemax={Math.ceil(desk.maxStart)}
                        aria-valuenow={Math.round(desk.windowStart)}
                        aria-valuetext={
                            'From ' + desk.timescale(Math.floor(desk.windowStart) + 1).label
                        }
                        onPointerDown={(e) => desk.beginPan(e.nativeEvent, e.currentTarget)}
                        onKeyDown={(e) => desk.horizonKey(e.nativeEvent)}
                    >
                        {desk.lanes.map((l) => (
                            <i
                                key={l.id}
                                className="horizon-bar"
                                data-traced={desk.isTraced(l.id)}
                                style={{
                                    insetInlineStart: ((l.start - 1) / desk.days) * 100 + '%',
                                    inlineSize: ((l.end - l.start + 1) / desk.days) * 100 + '%',
                                    insetBlockStart: 1 + l.lane * 0.3 + 'rem',
                                }}
                            />
                        ))}
                        {desk.horizonLabels.map((t) => (
                            <small
                                key={t.day}
                                style={{ insetInlineStart: ((t.day - 1) / desk.days) * 100 + '%' }}
                            >
                                {t.label}
                            </small>
                        ))}
                        <i
                            className="horizon-window"
                            style={{
                                insetInlineStart: (desk.windowStart / desk.days) * 100 + '%',
                                inlineSize: (desk.visibleDays / desk.days) * 100 + '%',
                            }}
                        />
                    </div>
                    <p className="schedule-key">
                        Drag a bar or move it one day. Dashed lines mark baselines. Solid tails show
                        delay. Shading marks Friday and Saturday.
                    </p>
                    <div
                        ref={plot}
                        onScroll={() => desk.syncWindow()}
                        className="schedule-plot"
                        role="region"
                        aria-label="Task schedule"
                        tabIndex={0}
                    >
                        {desk.rows.map((r) => (
                            <div
                                key={r.id}
                                className="schedule-track"
                                style={{
                                    inlineSize: desk.days * cell,
                                    gridTemplateColumns: 'repeat(' + desk.days + ',' + cell + 'px)',
                                }}
                            >
                                {Array.from({ length: desk.days }, (_, i) => i + 1)
                                    .filter((d) => desk.timescale(d).weekend)
                                    .map((d) => (
                                        <i
                                            key={d}
                                            className="weekend"
                                            style={{
                                                insetInlineStart: (d - 1) * cell,
                                                inlineSize: cell,
                                            }}
                                        />
                                    ))}
                                <i
                                    className="baseline"
                                    style={{
                                        insetInlineStart:
                                            (Math.max(1, r.baselineEnd - (r.endDay - r.startDay)) -
                                                1) *
                                            cell,
                                        inlineSize: (r.endDay - r.startDay + 1) * cell,
                                    }}
                                />
                                {r.endDay > r.baselineEnd && (
                                    <i
                                        className="slip"
                                        style={{
                                            insetInlineStart: r.baselineEnd * cell,
                                            inlineSize: (r.endDay - r.baselineEnd) * cell,
                                        }}
                                    />
                                )}
                                <button
                                    className="task"
                                    data-critical={desk.showCritical && desk.critical.has(r.id)}
                                    data-traced={desk.isTraced(r.id)}
                                    aria-pressed={desk.selected === r.id}
                                    aria-label={
                                        r.name +
                                        ' · ' +
                                        desk.timescale(r.startDay).label +
                                        ' to ' +
                                        desk.timescale(r.endDay).label
                                    }
                                    style={{ gridColumn: r.startDay + ' / ' + (r.endDay + 1) }}
                                    onClick={() => act(() => desk.select(r.id))}
                                    onPointerDown={(e) =>
                                        desk.dragStart(
                                            e.nativeEvent,
                                            r.id,
                                            e.currentTarget,
                                            refresh,
                                        )
                                    }
                                >
                                    {r.name}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="kit-row">
                        <button
                            disabled={desk.selected === 'phase'}
                            onClick={() => act(() => desk.shift(desk.selected, -1))}
                        >
                            Move −1 day
                        </button>
                        <button
                            disabled={desk.selected === 'phase'}
                            onClick={() => act(() => desk.shift(desk.selected, 1))}
                        >
                            Move +1 day
                        </button>
                        <button
                            disabled={!desk.history.length}
                            onClick={() => act(() => desk.undo())}
                        >
                            Undo
                        </button>
                        <button
                            disabled={!desk.future.length}
                            onClick={() => act(() => desk.redo())}
                        >
                            Redo
                        </button>
                    </div>
                    <ul>
                        {desk.rows
                            .filter((r) => desk.routeMode === 'all' || desk.trace.nodes.has(r.id))
                            .map((r) => (
                                <li key={r.id}>
                                    {desk.trace.roles[r.id] ?? 'Off route'} · {r.wbs} · {r.name} ·{' '}
                                    {r.progress}% complete ·{' '}
                                    <bdi>
                                        {desk.timescale(r.startDay).label} –{' '}
                                        {desk.timescale(r.endDay).label}
                                    </bdi>
                                    {desk.showCritical && desk.critical.has(r.id)
                                        ? ' · Critical'
                                        : ''}
                                </li>
                            ))}
                    </ul>
                    <ol className="funding-routes" aria-label="Task funding routes">
                        {desk.fundingRoutes.map((route) => (
                            <li key={route.task} data-traced={route.traced}>
                                <bdi>{route.wbs}</bdi>
                                <span aria-hidden="true"> → </span>
                                <bdi>{route.proposal}</bdi>
                                <span aria-hidden="true"> → </span>
                                <bdi>{route.agreement}</bdi>
                                <span> · {route.traced ? 'On route' : 'Off route'}</span>
                            </li>
                        ))}
                    </ol>
                </>
            ) : (
                <>
                    <p>Open → Confirmed → Approved → Locked</p>
                    <div className="kit-row">
                        <strong>{desk.month.status}</strong>
                        <label>
                            Acting role{' '}
                            <select
                                value={desk.role}
                                onChange={(e) =>
                                    act(() => {
                                        desk.role = e.target.value as Role;
                                    })
                                }
                            >
                                {desk.roles.map((role) => (
                                    <option key={role}>{role}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="month-resolve">
                        {['March 3 · one punch', 'March 9 · zero punches'].map((day, i) => (
                            <label key={day}>
                                {day}
                                <select
                                    value={desk.month.answers[i]}
                                    disabled={
                                        desk.role !== 'Employee' || desk.month.status !== 'Open'
                                    }
                                    onChange={(e) =>
                                        act(() => desk.answer(i, e.target.value as Decision))
                                    }
                                >
                                    <option value="" disabled>
                                        Resolve day
                                    </option>
                                    {desk.decisions.map((d) => (
                                        <option key={d}>{d}</option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>
                    {desk.role === 'Manager' && (
                        <label>
                            <input
                                type="checkbox"
                                checked={desk.self}
                                onChange={(e) =>
                                    act(() => {
                                        desk.self = e.target.checked;
                                    })
                                }
                            />{' '}
                            Approving my own month
                        </label>
                    )}
                    {desk.month.status === 'Locked' && desk.role === 'HR' && (
                        <label>
                            <input
                                type="checkbox"
                                checked={desk.month.consumed}
                                onChange={(e) => act(() => desk.consumption(e.target.checked))}
                            />{' '}
                            Credit consumed
                        </label>
                    )}
                    <div className="kit-row">
                        {desk.actions.map((a) => (
                            <button
                                key={a}
                                disabled={desk.role !== desk.responsible}
                                onClick={() => act(() => desk.advance(a))}
                            >
                                {a}
                            </button>
                        ))}
                        <button disabled={!desk.printable} onClick={() => desk.download()}>
                            Export timesheet
                        </button>
                        <button disabled={!desk.printable} onClick={() => desk.printMonth()}>
                            Print timesheet
                        </button>
                    </div>
                    <p>Next decision · {desk.responsible}</p>
                    <p>
                        {desk.printable
                            ? 'Punches resolved'
                            : 'DRAFT · Resolve both days before export'}{' '}
                        · Overtime <bdi>{desk.month.overtime}h</bdi> · Leave credit{' '}
                        <bdi>{desk.month.credit}h</bdi>
                    </p>
                </>
            )}
            <p role="status">{desk.notice}</p>
        </section>
    );
}
