import { cleanLayout, flushRows, resizePanel } from '../../../lib/kernels/flushRows';

export const catalog = [
    { panel: 'returns', title: 'Monthly returns', cols: 6, rows: 2, minCols: 4 },
    { panel: 'funding', title: 'Funding health', cols: 6, rows: 2, minCols: 4 },
    { panel: 'queue', title: 'Priority queue', cols: 8, rows: 2, minCols: 4 },
    { panel: 'digest', title: 'Needs action', cols: 4, rows: 2, minCols: 4 },
];
const storageKey = 'vault.operations-desk.v1';
function readLayout() {
    try {
        return cleanLayout(JSON.parse(localStorage.getItem(storageKey) ?? 'null'), catalog);
    } catch {
        return cleanLayout(null, catalog);
    }
}
function flip(root: Element, update: () => void) {
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-grid-panel]'));
    const old = panels.map((el) => [el, el.getBoundingClientRect()] as const);
    update();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    requestAnimationFrame(() => {
        for (const [el, before] of old) {
            const after = el.getBoundingClientRect();
            if (before.x === after.x && before.y === after.y) continue;
            el.animate(
                [
                    {
                        transform:
                            'translate(' +
                            (before.x - after.x) +
                            'px,' +
                            (before.y - after.y) +
                            'px)',
                    },
                    { transform: 'none' },
                ],
                { duration: 220, easing: 'cubic-bezier(.25,.8,.25,1)' },
            );
        }
    });
}
export default function deskGrid() {
    return {
        saved: readLayout(),
        layout: readLayout(),
        editing: false,
        drag: '',
        pending: '',
        notice: '',
        get rows() {
            return flushRows(this.layout);
        },
        get monitor() {
            const valid = this.rows.every((row) => row.reduce((sum, p) => sum + p.cols, 0) === 12);
            return (
                this.rows.length +
                ' rows · ' +
                (valid ? 'Every row totals 12 · Zero holes ✓' : 'Check row widths')
            );
        },
        customize() {
            this.layout = cleanLayout(this.saved, catalog);
            this.editing = true;
            this.notice = '';
        },
        cancel() {
            this.layout = cleanLayout(this.saved, catalog);
            this.editing = false;
            this.drag = '';
        },
        save() {
            this.saved = cleanLayout(this.layout, catalog);
            this.layout = this.saved;
            this.editing = false;
            try {
                localStorage.setItem(storageKey, JSON.stringify(this.saved));
                this.notice = 'Layout saved.';
            } catch {
                this.notice = 'Layout saved for this visit. Browser storage unavailable.';
            }
        },
        reset() {
            if (this.editing) this.layout = cleanLayout(null, catalog);
        },
        swap(from: string, to: string, root: Element) {
            if (!this.editing || this.pending || from === to) return;
            const items = this.layout.slice(),
                a = items.findIndex((p) => p.panel === from),
                b = items.findIndex((p) => p.panel === to);
            if (a < 0 || b < 0) return;
            this.pending = from;
            [items[a], items[b]] = [
                { ...items[b], cols: items[a].cols },
                { ...items[a], cols: items[b].cols },
            ];
            flip(root, () => {
                this.layout = flushRows(items).flat();
            });
            this.drag = '';
            queueMicrotask(() => {
                this.pending = '';
            });
        },
        size(id: string, delta: number, root: Element) {
            if (!this.editing) return;
            const row = this.rows.find((group) => group.some((p) => p.panel === id));
            const edge = row?.at(-1)?.panel === id ? 'start' : 'end';
            flip(root, () => {
                this.layout = resizePanel(this.layout, id, edge, delta);
            });
        },
        canSize(id: string, delta: number) {
            const row = this.rows.find((group) => group.some((p) => p.panel === id));
            if (!row || row.length < 2) return false;
            const index = row.findIndex((p) => p.panel === id),
                panel = row[index],
                neighbor = row[index + 1] ?? row[index - 1];
            return delta < 0 ? panel.cols > panel.minCols : neighbor.cols > neighbor.minCols;
        },
        keys(e: KeyboardEvent, id: string, root: Element) {
            if (e.key === 'Escape') {
                this.cancel();
                return;
            }
            if (
                !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
                !this.editing
            )
                return;
            e.preventDefault();
            let delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
            if (
                (e.key === 'ArrowRight' || e.key === 'ArrowLeft') &&
                getComputedStyle(root).direction === 'rtl'
            )
                delta *= -1;
            if (e.shiftKey) this.size(id, delta * 2, root);
            else {
                const target = this.layout[this.layout.findIndex((p) => p.panel === id) + delta];
                if (target) this.swap(id, target.panel, root);
            }
        },
        edgeStart(
            e: PointerEvent,
            id: string,
            root: Element,
            grip = e.currentTarget as HTMLElement,
            refresh: () => void = () => {},
        ) {
            if (!this.editing || e.button !== 0) return;
            const start = e.clientX,
                cell = root.getBoundingClientRect().width / 12;
            const row = this.rows.find((group) => group.some((p) => p.panel === id));
            const sign =
                (getComputedStyle(root).direction === 'rtl' ? -1 : 1) *
                (row?.at(-1)?.panel === id ? -1 : 1);
            const baseline = this.layout.slice(),
                edge = row?.at(-1)?.panel === id ? 'start' : 'end';
            const initial = baseline.find((p) => p.panel === id)!.cols;
            let applied = 0;
            const move = (event: PointerEvent) => {
                if (event.pointerId !== e.pointerId) return;
                const delta = ((event.clientX - start) * sign) / cell - applied;
                if (Math.abs(delta) < 0.65) return;
                const requested = applied + Math.sign(delta) * Math.floor(Math.abs(delta) + 0.35);
                const next = resizePanel(baseline, id, edge, requested);
                const newStep = next.find((p) => p.panel === id)!.cols - initial;
                if (newStep === applied) return;
                applied = newStep;
                this.layout = next;
                refresh();
            };
            const cleanup = () => {
                grip.removeEventListener('pointermove', move);
                grip.removeEventListener('pointerup', finish);
                grip.removeEventListener('pointercancel', cancel);
                grip.removeEventListener('lostpointercapture', cancel);
            };
            const finish = (event: PointerEvent) => {
                move(event);
                cleanup();
            };
            const cancel = () => {
                cleanup();
                this.layout = baseline;
                refresh();
            };
            grip.setPointerCapture(e.pointerId);
            grip.addEventListener('pointermove', move);
            grip.addEventListener('pointerup', finish);
            grip.addEventListener('pointercancel', cancel);
            grip.addEventListener('lostpointercapture', cancel);
        },
    };
}
