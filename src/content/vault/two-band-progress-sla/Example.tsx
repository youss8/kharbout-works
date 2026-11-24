import { useEffect, useState } from 'react';
import { delivery, drain, fundingView, startSlaClock } from './model';
export default function Progress() {
    const [approved, setApproved] = useState(75),
        [pending, setPending] = useState(12),
        [missing, setMissing] = useState(false);
    const [elapsed, setElapsed] = useState(0),
        [mode, setMode] = useState('Open'),
        [locale, setLocale] = useState('en');
    const [received, setReceived] = useState(40000);
    const [committed, setCommitted] = useState(60000);
    const [currency, setCurrency] = useState('USD');
    const { value: funding, error } = fundingView(received, committed, currency);
    useEffect(() => {
        if (mode === 'Open') return startSlaClock((minutes) => setElapsed((old) => old + minutes));
    }, [mode, elapsed]);
    const kpi = delivery(missing ? null : approved, pending),
        sla = drain(elapsed, mode, locale);
    return (
        <section className="kit-panel delivery-preview">
            <div className="kit-grid">
                <label>
                    Approved (%)
                    <input
                        type="range"
                        min="0"
                        max="140"
                        value={approved}
                        onChange={(e) => setApproved(e.target.valueAsNumber)}
                    />
                </label>
                <label>
                    Pending (%)
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={pending}
                        onChange={(e) => setPending(e.target.valueAsNumber)}
                    />
                </label>
            </div>
            <label>
                <input
                    type="checkbox"
                    checked={missing}
                    onChange={(e) => setMissing(e.target.checked)}
                />{' '}
                No approved reading
            </label>
            <div className="kit-row">
                <span className="status-badge outline" data-tone={kpi.tone}>
                    {kpi.tone === 'warn' ? '◐' : '○'}{' '}
                    <bdi aria-label={missing ? 'not set' : undefined}>{kpi.label}</bdi>
                </span>
                <span>{pending}% pending</span>
            </div>
            <div
                className="kit-track"
                role="progressbar"
                data-tone={kpi.tone}
                aria-label="Approved delivery"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={missing ? undefined : kpi.width}
                aria-valuetext={kpi.label}
            >
                <i style={{ width: kpi.width + '%' }} />
                <i className="pending" style={{ width: kpi.pending + '%' }} />
            </div>
            <label>
                SLA elapsed minutes
                <input
                    type="range"
                    min="0"
                    max="2910"
                    value={elapsed}
                    onChange={(e) => setElapsed(e.target.valueAsNumber)}
                />
            </label>
            <div className="kit-grid">
                <label>
                    Ticket state
                    <select value={mode} onChange={(e) => setMode(e.target.value)}>
                        {['Open', 'Closed', 'Missing SLA'].map((v) => (
                            <option key={v}>{v}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Time language
                    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                    </select>
                </label>
            </div>
            <output>
                <bdi lang={locale} aria-label={sla.state === 'unknown' ? 'not set' : undefined}>
                    {sla.label}
                </bdi>
            </output>
            <div
                className="kit-track"
                role="progressbar"
                aria-label="Elapsed SLA"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={sla.width ?? undefined}
                aria-valuetext={sla.label}
            >
                <i style={{ width: (sla.width ?? 0) + '%' }} />
            </div>
            <fieldset className="kit-panel">
                <legend>Funding capacity</legend>
                <div className="kit-grid">
                    <label>
                        Received amount
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={received}
                            onChange={(e) => setReceived(Math.max(0, Number(e.target.value)))}
                        />
                    </label>
                    <label>
                        Committed amount
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={committed}
                            onChange={(e) => setCommitted(Math.max(0, Number(e.target.value)))}
                        />
                    </label>
                    <label>
                        Funding currency
                        <select
                            aria-label="Funding currency"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            <option value="">Not set</option>
                            <option>USD</option>
                            <option>EUR</option>
                        </select>
                    </label>
                </div>
                {funding ? (
                    <>
                        <dl className="kit-row items-baseline tabular-nums">
                            <div>
                                <dt>Received</dt>
                                <dd>{funding.received}</dd>
                            </div>
                            <div>
                                <dt>Committed</dt>
                                <dd>{funding.committed}</dd>
                            </div>
                        </dl>
                        <div
                            role="progressbar"
                            className="kit-track"
                            aria-label="Funding received"
                            aria-valuemin={0}
                            aria-valuemax={committed}
                            aria-valuenow={Math.min(committed, received)}
                            aria-valuetext={
                                funding.received +
                                ' of ' +
                                funding.committed +
                                ' · ' +
                                funding.label
                            }
                        >
                            <i
                                style={{
                                    width: funding.width + '%',
                                    background: funding.over
                                        ? 'var(--status-warn)'
                                        : 'var(--accent-primary)',
                                }}
                            />
                        </div>
                        <p aria-live="polite" data-tone={funding.over ? 'warn' : 'neutral'}>
                            {funding.over ? '◐ ' : ''}
                            {funding.label}
                        </p>
                    </>
                ) : (
                    <p role="alert">
                        {error}{' '}
                        <button type="button" onClick={() => setCurrency('USD')}>
                            Retry with USD
                        </button>
                    </p>
                )}
            </fieldset>
        </section>
    );
}
