export const groups = [
    { id: 'ready', label: 'On track', tone: 'ok', glyph: '●' },
    { id: 'breach', label: 'Breached', tone: 'crit', glyph: '■' },
    { id: 'waiting', label: 'Waiting', tone: 'warn', glyph: '◐' },
    { id: 'missing', label: 'Missing asset', tone: 'warn', glyph: '◐' },
];
export function requests() {
    return [
        'ready',
        'waiting',
        'breach',
        'ready',
        'breach',
        'waiting',
        'ready',
        'ready',
        'ready',
        'breach',
        'waiting',
        'ready',
    ].map((state, i) => ({ id: 'REQ-' + (101 + i), state }));
}
export function signals(rows: ReturnType<typeof requests>) {
    return groups.map((group) => {
        const count = rows.filter((row) => row.state === group.id).length;
        return {
            ...group,
            count,
            tone: count ? group.tone : 'neutral',
            glyph: count ? group.glyph : '○',
            width: count ? Math.max(2, (100 * count) / rows.length) : 0,
        };
    });
}
const animations = new WeakMap<Element, number>();
const lastTarget = new WeakMap<Element, number>();
export function countTo(el: HTMLElement, next: number) {
    cancelAnimationFrame(animations.get(el) ?? 0);
    const from = lastTarget.get(el) ?? 0,
        start = performance.now();
    lastTarget.set(el, next);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === next) {
        el.textContent = String(next);
        return;
    }
    const paint = (now: number) => {
        const t = Math.min(1, (now - start) / 220);
        el.textContent = String(Math.round(from + (next - from) * (1 - (1 - t) ** 3)));
        if (t < 1 && el.isConnected) animations.set(el, requestAnimationFrame(paint));
    };
    animations.set(el, requestAnimationFrame(paint));
}
export default function queueSignals() {
    return {
        rows: requests(),
        slice: '',
        countTo,
        get tiles() {
            return signals(this.rows);
        },
        get visible() {
            return this.rows.filter((r) => !this.slice || r.state === this.slice);
        },
        toggle(id: string) {
            this.slice = this.slice === id ? '' : id;
        },
        clear() {
            this.rows = this.rows.map((r) => (r.state === 'breach' ? { ...r, state: 'ready' } : r));
        },
    };
}
