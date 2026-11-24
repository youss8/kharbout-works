import { adapters, readSource, loadDigest } from './digest.ts';
export type DecisionResult = { outcome: 'changed' | 'already_handled' | 'done' };
type Decision = 'Approve' | 'Snooze';
type Item = {
    key: string;
    subject: string;
    waitingDays: number;
    overlap: string;
    version: number;
    expected: number;
    handled: Decision | null;
};
export default function createModel() {
    return {
        digest: adapters.map(readSource),
        failed: 0,
        fault: false,
        busy: false,
        request: 0,
        rows: [
            {
                key: 'leave:81',
                subject: 'Annual leave · three days',
                waitingDays: 3,
                overlap: 'Backup coordinator also away 28–30 December',
            },
            { key: 'attendance:28', subject: 'Attendance correction', waitingDays: 2, overlap: '' },
            { key: 'contract:13', subject: 'Contract change review', waitingDays: 1, overlap: '' },
        ].map((row) => ({ ...row, version: 1, expected: 1, handled: null }) as Item),
        active: 0,
        outcome: '',
        undoItem: null as { key: string; version: number; until: number } | null,
        timer: undefined as ReturnType<typeof globalThis.setTimeout> | undefined,
        notify: undefined as (() => void) | undefined,
        async load(fail: boolean) {
            const id = ++this.request;
            this.fault = fail;
            this.busy = true;
            const { rows, failed } = await loadDigest(fail ? 'licenses' : null);
            if (id !== this.request) return;
            this.digest = rows;
            this.failed = failed;
            this.busy = false;
            this.notify?.();
        },
        select(i: number) {
            this.active = Math.max(0, Math.min(this.rows.length - 1, i));
        },
        stale() {
            this.rows = this.rows.map((r, i) =>
                i === this.active ? { ...r, version: r.version + 1 } : r,
            );
            this.outcome = 'A colleague updated this item.';
        },
        reload() {
            this.rows = this.rows.map((r, i) =>
                i === this.active ? { ...r, expected: r.version } : r,
            );
            this.outcome = 'Latest version loaded.';
        },
        decide(decision: Decision): DecisionResult {
            const row = this.rows[this.active];
            if (row.handled) {
                this.outcome = 'already_handled';
                return { outcome: 'already_handled' };
            }
            if (row.expected !== row.version) {
                this.outcome = 'changed';
                return { outcome: 'changed' };
            }
            const version = row.version + 1;
            this.rows = this.rows.map((r) =>
                r.key === row.key ? { ...r, handled: decision, version, expected: version } : r,
            );
            this.outcome = 'done';
            this.undoItem = { key: row.key, version, until: Date.now() + 6000 };
            globalThis.clearTimeout(this.timer);
            this.timer = globalThis.setTimeout(() => {
                this.undoItem = null;
                this.notify?.();
            }, 6000);
            return { outcome: 'done' };
        },
        undo() {
            const undo = this.undoItem;
            if (!undo) return;
            const row = this.rows.find((r) => r.key === undo.key);
            if (Date.now() >= undo.until || row?.version !== undo.version) {
                this.outcome = 'changed';
            } else {
                this.rows = this.rows.map((r) =>
                    r.key === undo.key
                        ? { ...r, handled: null, version: r.version + 1, expected: r.version + 1 }
                        : r,
                );
                this.outcome = 'Decision undone.';
            }
            this.undoItem = null;
            globalThis.clearTimeout(this.timer);
        },
        keyboard(event: KeyboardEvent, root: HTMLElement) {
            if (
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                !['j', 'k', 'e', 's'].includes(event.key)
            )
                return;
            event.preventDefault();
            if (event.key === 'e' || event.key === 's') {
                this.decide(event.key === 'e' ? 'Approve' : 'Snooze');
                return;
            }
            this.select(this.active + (event.key === 'j' ? 1 : -1));
            root.querySelectorAll<HTMLButtonElement>('[data-inbox-row]')[this.active]?.focus();
        },
        destroy() {
            globalThis.clearTimeout(this.timer);
        },
    };
}
