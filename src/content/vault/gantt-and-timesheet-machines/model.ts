export interface Task {
    id: string;
    name: string;
    wbs: string;
    progress: number;
    startDay: number;
    endDay: number;
    baselineEnd: number;
    critical: boolean;
}
export interface Dependency {
    from: string;
    to: string;
    type?: 'FS';
    lag: number;
}
export const tasks: Task[] = [
    {
        id: 'r1',
        wbs: '1.1',
        progress: 80,
        name: 'Schema and invariants',
        startDay: 1,
        endDay: 8,
        baselineEnd: 7,
        critical: true,
    },
    {
        id: 'r2',
        wbs: '1.2',
        progress: 30,
        name: 'Live sandboxes',
        startDay: 9,
        endDay: 16,
        baselineEnd: 15,
        critical: true,
    },
    {
        id: 'r3',
        wbs: '1.3',
        progress: 15,
        name: 'Accessibility review',
        startDay: 10,
        endDay: 12,
        baselineEnd: 12,
        critical: false,
    },
    {
        id: 'r4',
        wbs: '1.4',
        progress: 0,
        name: 'Release review',
        startDay: 17,
        endDay: 20,
        baselineEnd: 20,
        critical: true,
    },
];
export const links: Dependency[] = [
    { from: 'r1', to: 'r2', type: 'FS', lag: 0 },
    { from: 'r1', to: 'r3', type: 'FS', lag: 1 },
    { from: 'r2', to: 'r4', type: 'FS', lag: 0 },
    { from: 'r3', to: 'r4', type: 'FS', lag: 0 },
];
const grants: Record<string, string> = { r1: 'P-014', r2: 'P-014', r3: 'P-009', r4: 'P-009' };
const sponsors: Record<string, string> = { 'P-014': 'FA-01', 'P-009': 'FA-03' };
const dayMs = 86400000,
    epoch = Date.UTC(2026, 2, 1);
export function timescale(day: number) {
    const date = new Date(epoch + (day - 1) * dayMs);
    return { label: date.toISOString().slice(0, 10), weekend: [5, 6].includes(date.getUTCDay()) };
}
export function packLanes(rows: Task[]) {
    const ends: number[] = [];
    return rows
        .slice()
        .sort((a, b) => a.startDay - b.startDay || a.wbs.localeCompare(b.wbs))
        .map((row) => {
            let lane = ends.findIndex((end) => end < row.startDay);
            if (lane < 0) lane = Math.min(ends.length, 5);
            ends[lane] = Math.max(ends[lane] ?? 0, row.endDay);
            return { id: row.id, start: row.startDay, end: row.endDay, lane };
        });
}
function indexRoutes(edges: Dependency[]) {
    const incoming = new Map<string, string[]>(),
        outgoing = new Map<string, string[]>();
    for (const { from, to } of edges) {
        if (!outgoing.has(from)) outgoing.set(from, []);
        outgoing.get(from)!.push(to);
        if (!incoming.has(to)) incoming.set(to, []);
        incoming.get(to)!.push(from);
    }
    return { outgoing, incoming };
}
const routes = indexRoutes(links);
export function traceRoute(id: string, edges: Dependency[] = links) {
    const graph = edges === links ? routes : indexRoutes(edges);
    const nodes = new Set<string>(id === 'phase' ? tasks.map((r) => r.id) : [id]);
    const roles: Record<string, string> = { phase: id === 'phase' ? 'Selected' : 'Context' };
    for (const node of nodes) roles[node] = node === id ? 'Selected' : 'Contained';
    for (const reverse of [false, true]) {
        const queue = [id],
            seen = new Set(queue);
        for (let n = 0; n < queue.length; n++)
            for (const to of (reverse ? graph.incoming : graph.outgoing).get(queue[n]) ?? []) {
                if (seen.has(to)) continue;
                seen.add(to);
                nodes.add(to);
                roles[to] = reverse ? 'Driver' : 'Dependent';
                queue.push(to);
            }
    }
    const funding = [
        ...new Set([...nodes].flatMap((n) => (grants[n] ? [grants[n], sponsors[grants[n]]] : []))),
    ];
    return { nodes, funding, roles };
}
export function criticalPath(rows: Task[], edges: Dependency[] = links) {
    const finish = Math.max(...rows.map((row) => row.endDay)),
        byId = new Map(rows.map((row) => [row.id, row]));
    const queue = rows.filter((row) => row.endDay === finish),
        critical = new Set(queue.map((row) => row.id));
    for (let i = 0; i < queue.length; i++) {
        const task = queue[i];
        for (const edge of edges.filter((e) => e.to === task.id)) {
            const parent = byId.get(edge.from);
            if (
                parent &&
                parent.endDay + 1 + edge.lag === task.startDay &&
                !critical.has(parent.id)
            ) {
                critical.add(parent.id);
                queue.push(parent);
            }
        }
    }
    return critical;
}
// Process in dependency order so a diamond receives its final predecessor constraint only once.
export function applyRippleEdit(
    rows: Task[],
    id: string,
    delta: number,
    edges: Dependency[] = links,
): Task[] {
    if (!rows.some((r) => r.id === id) || !Number.isInteger(delta)) return rows;
    const next = rows.map((r) => ({ ...r })),
        byId = new Map(next.map((r) => [r.id, r]));
    const live = edges.filter((e) => byId.has(e.from) && byId.has(e.to));
    const done = new Set<string>(),
        touched = new Set<string>([id]);
    while (done.size < next.length) {
        let advanced = false;
        for (const row of next) {
            if (done.has(row.id)) continue;
            const parents = live.filter((e) => e.to === row.id);
            if (!parents.every((e) => done.has(e.from))) continue;
            if (row.id === id || parents.some((e) => touched.has(e.from))) {
                const earliest = Math.max(
                    1,
                    ...parents.map((e) => byId.get(e.from)!.endDay + 1 + e.lag),
                );
                const start = Math.max(earliest, row.startDay + (row.id === id ? delta : 0));
                const shift = start - row.startDay;
                if (shift) {
                    row.startDay = start;
                    row.endDay += shift;
                    touched.add(row.id);
                }
            }
            done.add(row.id);
            advanced = true;
        }
        if (!advanced) throw new Error('Schedule contains a dependency cycle.');
    }
    return next;
}
type Dates = Pick<Task, 'startDay' | 'endDay'>;
export type TaskChange = { id: string; before: Dates; after: Dates };
export interface ScheduleReceipt {
    ok: boolean;
    payload: { task: string; relations: { from: string; to: string }[] };
    changes: TaskChange[];
}

export function editReceipt(rows: Task[], id: string, delta: number): ScheduleReceipt {
    const next = applyRippleEdit(rows, id, delta);
    const changes = next.flatMap((r, i) =>
        r.startDay === rows[i].startDay
            ? []
            : [
                  {
                      id: r.id,
                      before: { startDay: rows[i].startDay, endDay: rows[i].endDay },
                      after: { startDay: r.startDay, endDay: r.endDay },
                  },
              ],
    );
    const relations = Object.entries({ ...grants, ...sponsors }).map(([from, to]) => ({
        from,
        to,
    }));
    return { ok: changes.length > 0, payload: { task: id, relations }, changes };
}

export function replayReceipt(rows: Task[], receipt: ScheduleReceipt, reverse = false): Task[] {
    const changes = new Map(receipt.changes.map((change) => [change.id, change]));
    const expected = reverse ? 'after' : 'before',
        target = reverse ? 'before' : 'after';
    for (const change of changes.values()) {
        const row = rows.find((r) => r.id === change.id);
        if (
            !row ||
            row.startDay !== change[expected].startDay ||
            row.endDay !== change[expected].endDay
        )
            throw new Error('Schedule changed since this edit.');
    }
    return rows.map((row) =>
        changes.has(row.id) ? { ...row, ...changes.get(row.id)![target] } : row,
    );
}
export type MonthStatus = 'Open' | 'Confirmed' | 'Approved' | 'Locked';
export type Role = 'Employee' | 'Manager' | 'HR';
export type Decision = '' | 'Worked' | 'Absent' | 'Leave';
export interface Month {
    status: MonthStatus;
    answers: Decision[];
    credit: number;
    overtime: number;
    consumed: boolean;
}
export function initialMonth(): Month {
    return { status: 'Open', answers: ['', ''], credit: 0, overtime: 4, consumed: false };
}
export function reduceMonth(
    month: Month,
    action: string,
    role: Role,
    self: boolean,
): { month: Month; message: string } {
    const fail = (message: string) => ({ month, message });
    if (action === 'Confirm' && month.status === 'Open' && role === 'Employee') {
        if (month.answers.some((a) => !a)) return fail('Resolve each unanswered punch first.');
        return {
            month: { ...month, status: 'Confirmed' },
            message: 'Employee confirmed the month.',
        };
    }
    if (action === 'Approve' && month.status === 'Confirmed' && role === 'Manager') {
        if (self) return fail('Self-approval is blocked. Choose a different manager.');
        return { month: { ...month, status: 'Approved' }, message: 'Manager approved the month.' };
    }
    if (action === 'Lock' && month.status === 'Approved' && role === 'HR')
        return {
            month: { ...month, status: 'Locked', credit: month.overtime },
            message: 'Overtime posted to leave credit.',
        };
    if (action === 'Reopen' && month.status === 'Locked' && role === 'HR') {
        if (month.consumed) return fail('Reopen blocked. The posted credit has been consumed.');
        return {
            month: { ...month, status: 'Open', credit: 0 },
            message: 'Month reopened and unused credit reversed.',
        };
    }
    return fail('This role cannot take this action in the current month state.');
}
export const zooms = [8, 12, 18, 25, 34];
export default function schedule() {
    let plot: HTMLElement | undefined,
        observer: ResizeObserver | undefined,
        notify = () => {};
    return {
        tab:
            typeof window !== 'undefined' &&
            new URLSearchParams(location.search).get('panel') === 'timesheet'
                ? 'Timesheet'
                : 'Gantt',
        rows: tasks.map((r) => ({ ...r })),
        selected: 'r1',
        zoom: 2,
        showCritical: true,
        routeMode: 'selected',
        windowStart: 0,
        visibleDays: 12,
        get lanes() {
            return packLanes(this.rows);
        },
        get horizonLabels() {
            const width = Math.max(1, plot?.clientWidth ?? 375);
            const step = (this.days * 34) / width <= 30 ? 1 : 3;
            const date = new Date(epoch);
            const labels: { day: number; label: string }[] = [];
            for (let day = 1; day <= this.days; day = (date.getTime() - epoch) / dayMs + 1) {
                if (day === 1 || ((this.days - day + 1) * width) / this.days >= 44)
                    labels.push({ day, label: date.toISOString().slice(0, 7) });
                date.setUTCMonth(date.getUTCMonth() + step);
            }
            return labels;
        },
        get maxStart() {
            return Math.max(0, this.days - this.visibleDays);
        },
        syncWindow() {
            if (!plot) return;
            const cell = this.zooms[this.zoom];
            this.visibleDays = Math.min(this.days, plot.clientWidth / cell);
            this.windowStart = Math.max(
                0,
                Math.min(this.maxStart, Math.abs(plot.scrollLeft) / cell),
            );
            notify();
        },
        mountPlot(el: HTMLElement, onUpdate = () => {}) {
            this.unmountPlot();
            plot = el;
            notify = onUpdate;
            observer = new ResizeObserver(() => this.syncWindow());
            observer.observe(el);
            this.syncWindow();
        },
        unmountPlot() {
            observer?.disconnect();
            plot = undefined;
            notify = () => {};
        },
        destroy() {
            this.unmountPlot();
        },
        pan(start: number) {
            if (!plot) return;
            const day = Math.max(0, Math.min(this.maxStart, start));
            plot.scrollLeft =
                (getComputedStyle(plot).direction === 'rtl' ? -1 : 1) * day * this.zooms[this.zoom];
            this.syncWindow();
        },
        horizonKey(e: KeyboardEvent) {
            if (!['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            e.preventDefault();
            const rtl = plot && getComputedStyle(plot).direction === 'rtl';
            this.pan(
                e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                      ? this.maxStart
                      : this.windowStart + (e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1),
            );
        },
        beginPan(e: PointerEvent, el: HTMLElement) {
            if (e.button !== 0) return;
            const box = el.getBoundingClientRect(),
                rtl = getComputedStyle(el).direction === 'rtl';
            const coordinate = (event: PointerEvent) =>
                ((rtl ? box.right - event.clientX : event.clientX - box.left) * this.days) /
                box.width;
            const hit = coordinate(e),
                offset =
                    hit >= this.windowStart && hit <= this.windowStart + this.visibleDays
                        ? hit - this.windowStart
                        : this.visibleDays / 2;
            const move = (event: PointerEvent) => this.pan(coordinate(event) - offset);
            const finish = () => {
                el.removeEventListener('pointermove', move);
                el.removeEventListener('pointerup', finish);
                el.removeEventListener('pointercancel', finish);
            };
            el.setPointerCapture(e.pointerId);
            move(e);
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerup', finish);
            el.addEventListener('pointercancel', finish);
        },
        isTraced(id: string) {
            return (
                this.routeMode === 'all' ||
                (this.routeMode === 'selected' && this.trace.nodes.has(id))
            );
        },
        history: [] as ScheduleReceipt[],
        future: [] as ScheduleReceipt[],
        month: initialMonth(),
        role: 'Employee' as Role,
        self: false,
        notice: '',
        decisions: ['Worked', 'Absent', 'Leave'] as Decision[],
        roles: ['Employee', 'Manager', 'HR'] as Role[],
        zooms,
        timescale,
        get days() {
            return Math.max(60, ...this.rows.map((r) => r.endDay + 2));
        },
        get trace() {
            return traceRoute(this.selected);
        },
        get fundingRoutes() {
            return this.rows.map((r) => ({
                task: r.id,
                wbs: r.wbs,
                proposal: grants[r.id],
                agreement: sponsors[grants[r.id]],
                traced: this.isTraced(r.id),
            }));
        },
        get critical() {
            return criticalPath(this.rows);
        },
        get actions() {
            return (
                {
                    Open: ['Confirm'],
                    Confirmed: ['Approve'],
                    Approved: ['Lock'],
                    Locked: ['Reopen'],
                } as const
            )[this.month.status];
        },
        get printable() {
            return this.month.answers.every(Boolean);
        },
        get responsible() {
            return (
                { Open: 'Employee', Confirmed: 'Manager', Approved: 'HR', Locked: 'HR' } as const
            )[this.month.status];
        },
        select(id: string) {
            this.selected = id;
        },
        shift(id: string, delta: number) {
            if (id === 'phase') return;
            const receipt = editReceipt(this.rows, id, delta);
            if (!receipt.ok) {
                this.notice = 'Predecessor or first-day boundary reached.';
                return;
            }
            this.rows = replayReceipt(this.rows, receipt);
            this.history = [...this.history.slice(-39), receipt];
            this.future = [];
            this.selected = id;
            this.notice = 'Moved ' + receipt.changes.length + ' tasks.';
        },
        undo() {
            const receipt = this.history.at(-1);
            if (!receipt) return;
            this.rows = replayReceipt(this.rows, receipt, true);
            this.history.pop();
            this.future.push(receipt);
            this.notice = 'Entire edit undone.';
        },
        redo() {
            const receipt = this.future.at(-1);
            if (!receipt) return;
            this.rows = replayReceipt(this.rows, receipt);
            this.future.pop();
            this.history.push(receipt);
            this.notice = 'Entire edit restored.';
        },
        shortcut(e: KeyboardEvent) {
            if (this.tab !== 'Gantt' || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z')
                return;
            e.preventDefault();
            if (e.shiftKey) this.redo();
            else this.undo();
        },
        dragStart(e: PointerEvent, id: string, el: HTMLElement, refresh: () => void = () => {}) {
            if (e.button !== 0) return;
            const start = e.clientX,
                width = this.zooms[this.zoom],
                sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
            el.setPointerCapture(e.pointerId);
            const finish = (up: PointerEvent) => {
                const delta = Math.round(((up.clientX - start) * sign) / width);
                if (delta) this.shift(id, delta);
                else this.select(id);
                refresh();
            };
            el.addEventListener('pointerup', finish, { once: true });
            el.addEventListener(
                'pointercancel',
                () => el.removeEventListener('pointerup', finish),
                { once: true },
            );
        },
        answer(index: number, value: Decision) {
            if (
                this.month.status === 'Open' &&
                this.role === 'Employee' &&
                this.decisions.includes(value)
            )
                this.month.answers[index] = value;
        },
        consumption(value: boolean) {
            if (this.month.status === 'Locked' && this.role === 'HR') this.month.consumed = value;
        },
        advance(action: string) {
            const result = reduceMonth(this.month, action, this.role, this.self);
            this.month = result.month;
            this.notice = result.message;
        },
        printMonth() {
            if (this.printable && this.tab === 'Timesheet') window.print();
        },
        download() {
            if (!this.printable) return;
            const csv =
                '\uFEFFDate,Punches,Decision\r\n2026-03-03,1,' +
                this.month.answers[0] +
                '\r\n2026-03-09,0,' +
                this.month.answers[1] +
                '\r\n';
            const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'march-timesheet.csv';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
    };
}
