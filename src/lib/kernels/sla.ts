type Instant = string | number;
export interface SlaTicket {
    created_at: Instant | null;
    sla_due_at: Instant | null;
    resolved_at?: Instant | null;
    status?: string;
    priority?: string;
}

const hour = 3_600_000;
const priority = ['critical', 'high', 'medium', 'low'];
const stamp = (time: Instant | null | undefined) =>
    typeof time === 'number' ? time : time ? Date.parse(time) : NaN;
const closed = (ticket: SlaTicket) =>
    ['closed', 'resolved'].includes(ticket.status?.toLowerCase() ?? '');

export function slaState(ticket: SlaTicket, now: Instant) {
    if (closed(ticket)) return 'closed';
    const left = stamp(ticket.sla_due_at) - stamp(now);
    if (!Number.isFinite(left)) return 'unknown';
    if (left < 0) return 'breached';
    return left < 2 * hour ? 'closing' : 'ok';
}

export function slaElapsedPercent(ticket: SlaTicket, now: Instant): number | null {
    const start = stamp(ticket.created_at);
    const budget = stamp(ticket.sla_due_at) - start;
    const elapsed = stamp(closed(ticket) ? ticket.resolved_at : now) - start;
    if (!Number.isFinite(elapsed) || !Number.isFinite(budget) || budget <= 0) return null;
    return Math.min(100, Math.max(2, (elapsed * 100) / budget));
}

export function rankPriority(raw: string | undefined): number {
    const value = raw?.trim().toLowerCase();
    if (value === 'urgent') return 0;
    const index = priority.indexOf(value ?? '');
    return index < 0 ? priority.length : index;
}

export function compareUrgency(a: SlaTicket, b: SlaTicket, now: Instant): number {
    const rank = { breached: 0, closing: 1, ok: 2, unknown: 3, closed: 4 };
    return (
        rank[slaState(a, now)] - rank[slaState(b, now)] ||
        stamp(a.sla_due_at) - stamp(b.sla_due_at) ||
        rankPriority(a.priority) - rankPriority(b.priority) ||
        stamp(a.created_at) - stamp(b.created_at) ||
        0
    );
}

export function durationParts(milliseconds: number) {
    const minutes = Math.floor(Math.abs(milliseconds) / 60_000);
    return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}
