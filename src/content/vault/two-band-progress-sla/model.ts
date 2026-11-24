import { slaElapsedPercent, slaState, durationParts } from '../../../lib/kernels/sla';
export function delivery(value: number | null, pending: number, max: number = 100) {
    const percent = max > 0 && value !== null ? Math.max(0, (value / max) * 100) : 0;
    const width = Math.min(100, percent);
    const pendingWidth = max > 0 && value !== null ? Math.max(0, (pending / max) * 100) : 0;
    const over = percent > 100;
    return {
        width,
        pending: Math.min(100 - width, pendingWidth),
        label:
            value === null
                ? '—'
                : over
                  ? 'Over by ' + Number((percent - 100).toFixed(2)) + '%'
                  : Number(percent.toFixed(2)) + '% approved',
        tone: over ? 'warn' : 'neutral',
    };
}
export function fundingCapacity(received: number, committed: number, currency: string) {
    if (!['USD', 'EUR'].includes(currency))
        throw new RangeError('Choose a funding currency to show capacity.');
    const percent = committed > 0 ? (received / committed) * 100 : 0;
    const format = new Intl.NumberFormat('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return {
        received: format.format(received) + ' ' + currency,
        committed: format.format(committed) + ' ' + currency,
        width: Math.min(100, Math.max(0, percent)),
        over: percent > 100,
        label:
            percent > 100
                ? 'Over by ' + Number((percent - 100).toFixed(2)) + '%'
                : Number(percent.toFixed(2)) + '% received',
    };
}
export function fundingView(received: number, committed: number, currency: string) {
    try {
        return { value: fundingCapacity(received, committed, currency), error: '' };
    } catch (error) {
        return { value: null, error: (error as Error).message };
    }
}
export function drain(elapsed: number, mode: string, locale: string) {
    const end = 48 * 60;
    const ticket = {
        created_at: 0,
        sla_due_at: mode === 'Missing SLA' ? null : end * 60000,
        status: mode,
        resolved_at: mode === 'Closed' ? elapsed * 60000 : null,
    };
    const state = slaState(ticket, elapsed * 60000);
    const parts = durationParts((end - elapsed) * 60000);
    const amount = new Intl.NumberFormat(locale).format(parts.hours || parts.minutes);
    const ar = locale === 'ar';
    const unit = ar ? (parts.hours ? 'ساعة' : 'دقيقة') : parts.hours ? 'h' : 'm';
    const text = ar
        ? state === 'breached'
            ? 'متأخر بمقدار {amount} ' + unit
            : 'متبقي {amount} ' + unit
        : '{amount}' + unit + (state === 'breached' ? ' overdue' : ' left');
    const label =
        state === 'closed'
            ? 'Closed'
            : state === 'unknown'
              ? '—'
              : text.replace('{amount}', amount);
    return { label, state, width: slaElapsedPercent(ticket, elapsed * 60000) };
}
export function startSlaClock(advance: (minutes: number) => void) {
    let observed = performance.now();
    const id = window.setInterval(() => {
        const now = performance.now();
        advance((now - observed) / 60_000);
        observed = now;
    }, 30_000);
    return () => window.clearInterval(id);
}

export default function progress() {
    let stop: (() => void) | undefined;
    return {
        received: 40000,
        committed: 60000,
        currency: 'USD',
        get funding() {
            return fundingView(this.received, this.committed, this.currency);
        },
        approved: 75,
        pending: 12,
        missing: false,
        elapsed: 0,
        mode: 'Open',
        locale: 'en',
        init() {
            this.restartClock();
        },
        restartClock() {
            stop?.();
            if (this.mode === 'Open')
                stop = startSlaClock((minutes) => {
                    this.elapsed += minutes;
                });
        },
        destroy() {
            stop?.();
        },
        get kpi() {
            return delivery(this.missing ? null : this.approved, this.pending);
        },
        get sla() {
            return drain(this.elapsed, this.mode, this.locale);
        },
    };
}
