import leaveFixture from '../../data/demos/hr-leave-desk.json';
import attendanceFixture from '../../data/demos/hr-attendance.json';

const dayMs = 24 * 60 * 60 * 1000;
const weekday = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' });
const today = '2026-11-23';

function overlaps(a, b) {
    return a.from <= b.to && a.to >= b.from;
}

function quote(form, site, holidays) {
    const start = Date.parse(form.from + 'T00:00:00Z');
    const end = Date.parse(form.to + 'T00:00:00Z');
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
        return { days: [], hours: null, error: 'Choose a valid date range.' };
    }
    if (end - start > 365 * dayMs) {
        return { days: [], hours: null, error: 'Quote one year at a time.' };
    }
    const days = [];
    let hours = 0;
    for (let at = start; at <= end; at += dayMs) {
        const date = new Date(at);
        const iso = date.toISOString().slice(0, 10);
        const holiday = holidays.find(({ date }) => date === iso);
        const weekend = site.weekend.includes(weekday.format(date));
        const billed =
            holiday || weekend ? 0 : site.dailyHours / (form.partOfDay === 'full' ? 1 : 2);
        days.push({
            date: iso,
            label: holiday ? 'Holiday excluded' : weekend ? 'Weekend excluded' : 'Working',
            hours: billed,
            holiday: holiday?.name,
        });
        hours += billed;
    }
    return { days, hours, error: hours > 0 ? '' : 'No chargeable working days in this range.' };
}

function remaining(balance) {
    return (
        balance.deservedHours +
        balance.overtimeCreditHours -
        balance.usedHours -
        balance.pendingHours
    );
}

function initialLeave() {
    const { balances, requests } = structuredClone(leaveFixture);
    // The opening annual snapshot reports 16 pending hours. Its still-open signed quote reserves 24.
    // Reconcile the ledger on load, then transfer the exact frozen request amount at each decision.
    for (const balance of balances) {
        const reserved = requests
            .filter(
                (r) =>
                    r.employeeId === leaveFixture.employee.id &&
                    r.type === balance.type &&
                    r.status === 'pending',
            )
            .reduce((total, r) => total + r.hours, 0);
        balance.pendingHours = Math.max(balance.pendingHours, reserved);
    }
    return {
        balances,
        requests,
        role: 'Employee',
        selected: 'LR-311',
        note: '',
        notice: '',
        history: false,
        form: {
            type: 'annual',
            from: '2026-12-23',
            to: '2026-12-26',
            partOfDay: 'full',
            standIn: '',
        },
    };
}

export function leaveDesk() {
    return {
        ...initialLeave(),
        site: leaveFixture.site,
        employee: leaveFixture.employee,
        team: leaveFixture.team,
        holidays: leaveFixture.holidays,
        today,
        remaining,
        get priced() {
            return quote(this.form, this.site, this.holidays);
        },
        get problem() {
            if (this.priced.error) return this.priced.error;
            const balance = this.balances.find((b) => b.type === this.form.type);
            if (!balance || this.priced.hours > remaining(balance))
                return 'The quote exceeds the available balance.';
            if (this.employee.onProbation && this.form.type === 'annual')
                return 'HR must confirm the probation allowance before this request can be reserved.';
            const duplicate = this.requests.some(
                (r) =>
                    r.employeeId === this.employee.id &&
                    r.status !== 'rejected' &&
                    overlaps(r, this.form) &&
                    (r.partOfDay === 'full' ||
                        this.form.partOfDay === 'full' ||
                        r.partOfDay === this.form.partOfDay) &&
                    this.priced.days.some((d) => d.hours && r.from <= d.date && r.to >= d.date),
            );
            return duplicate ? 'An existing request covers a working period in this range.' : '';
        },
        get request() {
            return this.requests.find((r) => r.id === this.selected);
        },
        get inbox() {
            return this.requests.filter((r) => {
                if (this.role === 'Employee') return r.employeeId === this.employee.id;
                if (this.history) return true;
                return this.role === 'Direct Manager'
                    ? r.status === 'pending'
                    : r.status === 'accepted' && !r.hrReview;
            });
        },
        get summary() {
            const open = this.requests.filter(
                (r) => r.status === 'pending' || (r.status === 'accepted' && !r.hrReview),
            );
            const absent = new Set(
                this.requests
                    .filter((r) => r.status === 'accepted' && r.from <= today && r.to >= today)
                    .map((r) => r.employeeId),
            );
            for (const m of this.team)
                if (m.leave?.status === 'accepted' && m.leave.from <= today && m.leave.to >= today)
                    absent.add(m.id);
            return [
                ['Pending decisions', open.length],
                [
                    'Late >3 days',
                    open.filter(
                        (r) =>
                            Date.parse(today + 'T12:00:00Z') -
                                Date.parse(r.timeline.at(-1).at.replace(/Z?$/, 'Z')) >
                            3 * dayMs,
                    ).length,
                ],
                ['Out today', absent.size],
                ['Next holiday', this.holidays.find((h) => h.date >= today)?.date ?? 'None'],
            ];
        },
        overlapsWith(range) {
            return range
                ? this.team
                      .filter(
                          (m) =>
                              m.id !== range.employeeId &&
                              m.leave?.status === 'accepted' &&
                              overlaps(m.leave, range),
                      )
                      .map((m) => m.name)
                : [];
        },
        pickRole(role) {
            this.role = role;
            this.history = false;
            this.note = '';
            this.notice = '';
            this.selected = this.inbox[0]?.id ?? '';
        },
        select(id) {
            this.selected = id;
            this.note = '';
        },
        toggleHistory() {
            this.history = !this.history;
            if (!this.inbox.some((r) => r.id === this.selected))
                this.select(this.inbox[0]?.id ?? '');
        },
        event(event, actor, note = '') {
            const count = this.requests.reduce((total, r) => total + r.timeline.length, 0);
            return {
                event,
                actor,
                note,
                at: new Date(Date.parse(today + 'T12:00:00Z') + count * 60000)
                    .toISOString()
                    .slice(0, 16),
            };
        },
        submit() {
            if (this.role !== 'Employee' || this.problem) return;
            const balance = this.balances.find((b) => b.type === this.form.type);
            const id = 'LR-' + (Math.max(...this.requests.map((r) => Number(r.id.slice(3)))) + 1);
            const hours = this.priced.hours;
            balance.pendingHours += hours;
            this.requests.unshift({
                ...this.form,
                id,
                hours,
                employeeId: this.employee.id,
                status: 'pending',
                managerDecision: null,
                hrReview: null,
                timeline: [this.event('submitted', this.employee.name)],
            });
            this.select(id);
            this.notice = `${id} submitted. ${hours} hours reserved.`;
        },
        decide(action) {
            const request = this.request;
            if (!request || request.employeeId !== this.employee.id) return;
            const balance = this.balances.find((b) => b.type === request.type);
            const note = this.note.trim();
            const manager = this.role === 'Direct Manager' && request.status === 'pending';
            const hr =
                this.role === 'Regional HR' && request.status === 'accepted' && !request.hrReview;
            if (!balance || (!manager && !hr)) return;
            if ((action === 'reject' || action === 'send-back') && !note) {
                this.notice = 'Enter a decision note first.';
                return;
            }
            let event;
            if (manager && (action === 'approve' || action === 'reject')) {
                if (balance.pendingHours < request.hours) return;
                balance.pendingHours -= request.hours;
                if (action === 'approve') balance.usedHours += request.hours;
                request.status = action === 'approve' ? 'accepted' : 'rejected';
                request.managerDecision = action === 'approve' ? 'approved' : 'rejected';
                request.hrReview = null;
                event =
                    action === 'approve'
                        ? 'Manager approved · HR review requested'
                        : 'Manager rejected';
            } else if (hr && action === 'send-back') {
                if (balance.usedHours < request.hours) return;
                balance.usedHours -= request.hours;
                balance.pendingHours += request.hours;
                request.status = 'pending';
                request.managerDecision = null;
                request.hrReview = null;
                event = 'HR sent back · reservation restored';
            } else if (hr && action === 'review') {
                request.hrReview = 'seen';
                event = 'HR review completed';
            } else return;
            request.timeline.push(this.event(event, this.role, note));
            this.note = '';
            this.notice = request.id + ' · ' + event + '.';
        },
        reset() {
            Object.assign(this, initialLeave());
            this.notice = 'Leave demo reset.';
        },
    };
}

const resolutions = [
    { label: 'Worked Full (8h)', hours: 8, status: 'worked' },
    { label: 'Half Day (4h)', hours: 4, status: 'worked' },
    { label: 'Unpaid Absence', hours: 0, status: 'absence' },
    { label: 'Approved Leave', hours: 8, status: 'leave' },
];

function contractFor(viewer) {
    const contract = structuredClone(attendanceFixture.contract);
    if (viewer === 'Platform Admin') {
        delete contract.live.payTierEncrypted;
        for (const amendment of contract.amendments) delete amendment.payTierEncrypted;
    }
    return contract;
}

function initialAttendance() {
    return {
        month: structuredClone(attendanceFixture.month),
        tab: 'Attendance month',
        viewer: 'HR Manager',
        contract: contractFor('HR Manager'),
        decisionDate: '',
        selfApproval: false,
        notice: '',
    };
}

export function attendanceDesk() {
    return {
        ...initialAttendance(),
        employee: attendanceFixture.employee,
        resolutions,
        switchViewer(viewer) {
            this.contract = contractFor(viewer);
            this.viewer = viewer;
        },
        get unresolved() {
            return this.month.days.filter((d) => d.status === 'unresolved').length;
        },
        get overtime() {
            return this.month.days.reduce((sum, d) => sum + d.overtime, 0);
        },
        get decisionDay() {
            return this.month.days.find((d) => d.date === this.decisionDate);
        },
        get original() {
            return this.contract.amendments[0].before;
        },
        decide(option) {
            const day = this.decisionDay;
            if (!day || day.status !== 'unresolved' || this.month.state !== 'draft') return;
            day.resolution = option.label;
            day.hours = option.hours;
            day.status = option.status;
            this.notice = day.date + ' · ' + option.label + '.';
            this.decisionDate = '';
        },
        transition(action) {
            const month = this.month;
            if (action === 'confirm' && month.state === 'draft' && !this.unresolved) {
                month.state = 'confirmed';
                this.notice = 'Employee confirmed the timesheet.';
            } else if (action === 'approve' && month.state === 'confirmed') {
                if (this.selfApproval) {
                    this.notice =
                        'Self-approval blocked. A different manager must approve this month.';
                    return;
                }
                month.state = 'approved';
                this.notice = 'Manager approved the timesheet.';
            } else if (action === 'lock' && month.state === 'approved') {
                month.state = 'locked';
                month.overtimeCreditGrantedHours = this.overtime;
                this.notice = `HR locked the month. ${this.overtime} overtime hours credited to annual leave.`;
            } else if (action === 'reopen' && month.state === 'locked') {
                if (month.overtimeCreditConsumed) {
                    this.notice =
                        'Reopen blocked. The annual leave credit has already been consumed.';
                    return;
                }
                month.state = 'draft';
                month.overtimeCreditGrantedHours = 0;
                this.selfApproval = false;
                this.notice =
                    'Month reopened. Approval withdrawn and unused overtime credit revoked.';
            }
        },
        reset() {
            Object.assign(this, initialAttendance());
            this.notice = 'Attendance demo reset.';
        },
    };
}

export default function registerHr(Alpine) {
    Alpine.data('leaveDesk', leaveDesk);
    Alpine.data('attendanceDesk', attendanceDesk);
}
