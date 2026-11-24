import type AlpineApi from 'alpinejs';
import fixture from '../../../data/demos/pt-funding-flow.json';

export type Currency = 'USD' | 'EUR';
type Node = { id: string; label: string };
type Edge = { from: string; to: string; amount: number };

export function flowGraph(currency: Currency) {
    const agreements = fixture.agreements.filter((a) => a.currency === currency);
    const proposals = new Set(agreements.map((a) => a.proposal)),
        sponsors = new Set(agreements.map((a) => a.sponsor));
    const projects = fixture.projects.filter((p) => p.proposals.some((id) => proposals.has(id)));
    const columns: { name: string; nodes: Node[] }[] = [
        {
            name: 'Sponsors',
            nodes: fixture.sponsors
                .filter((s) => sponsors.has(s.id))
                .map((s) => ({ id: s.id, label: s.name })),
        },
        {
            name: 'Proposals',
            nodes: fixture.proposals
                .filter((p) => proposals.has(p.id))
                .map((p) => ({ id: p.id, label: p.title })),
        },
        { name: 'Projects', nodes: projects.map((p) => ({ id: p.id, label: p.name })) },
    ];
    const edges: Edge[] = [];
    function add(from: string, to: string, amount: number) {
        const existing = edges.find((e) => e.from === from && e.to === to);
        if (existing) existing.amount += amount;
        else edges.push({ from, to, amount });
    }
    for (const a of agreements) {
        add(a.sponsor, a.proposal, a.budget);
        const downstream = projects.filter((p) => p.proposals.includes(a.proposal));
        for (const p of downstream) add(a.proposal, p.id, a.budget / downstream.length);
    }
    return { columns, edges, agreements };
}
export function traceFlow(edges: readonly Edge[], id: string) {
    const result = new Set<string>();
    if (!id) return result;
    for (const [next, previous] of [
        ['to', 'from'],
        ['from', 'to'],
    ] as const) {
        const queue = [id],
            seen = new Set([id]);
        for (let i = 0; i < queue.length; i++) {
            const current = queue[i];
            result.add(current);
            for (const e of edges)
                if (e[previous] === current && !seen.has(e[next])) {
                    seen.add(e[next]);
                    queue.push(e[next]);
                }
        }
    }
    return result;
}

export function ribbons(map: HTMLElement, edges: Edge[]) {
    const origin = map.getBoundingClientRect(),
        rtl = getComputedStyle(map).direction === 'rtl';
    const bounds = new Map(
        Array.from(map.querySelectorAll<HTMLElement>('[data-node]'), (el) => [
            el.dataset.node!,
            el.getBoundingClientRect(),
        ]),
    );
    if (origin.width === 0) return [];
    const totals = (side: 'from' | 'to') =>
        edges.reduce(
            (sum, e) => sum.set(e[side], (sum.get(e[side]) ?? 0) + e.amount),
            new Map<string, number>(),
        );
    const incoming = totals('to'),
        outgoing = totals('from');
    const scales = [...bounds].flatMap(([id, r]) =>
        [incoming.get(id), outgoing.get(id)]
            .filter((v): v is number => Boolean(v))
            .map((v) => (r.height * 0.72) / v),
    );
    const scale = Math.min(...scales);
    const slots = (totals: Map<string, number>) =>
        new Map(
            [...bounds].map(([id, r]) => [
                id,
                r.top - origin.top + (r.height - (totals.get(id) ?? 0) * scale) / 2,
            ]),
        );
    const starts = slots(outgoing),
        ends = slots(incoming);
    return edges.flatMap((e) => {
        const a = bounds.get(e.from),
            b = bounds.get(e.to);
        if (!a || !b) return [];
        const x = (rtl ? a.left : a.right) - origin.left,
            end = (rtl ? b.right : b.left) - origin.left,
            mid = (x + end) / 2;
        const half = (e.amount * scale) / 2;
        const y = starts.get(e.from)! + half,
            z = ends.get(e.to)! + half;
        starts.set(e.from, y + half);
        ends.set(e.to, z + half);
        const path =
            'M ' +
            x +
            ' ' +
            (y - half) +
            ' C ' +
            mid +
            ' ' +
            (y - half) +
            ' ' +
            mid +
            ' ' +
            (z - half) +
            ' ' +
            end +
            ' ' +
            (z - half) +
            ' L ' +
            end +
            ' ' +
            (z + half) +
            ' C ' +
            mid +
            ' ' +
            (z + half) +
            ' ' +
            mid +
            ' ' +
            (y + half) +
            ' ' +
            x +
            ' ' +
            (y + half) +
            ' Z';
        return [{ ...e, path }];
    });
}
export function trackGeometry(map: HTMLElement, draw: () => void) {
    let frame = 0;
    const schedule = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(map);
    const attrs = new MutationObserver(schedule);
    for (let el: HTMLElement | null = map; el; el = el.parentElement)
        attrs.observe(el, { attributes: true, attributeFilter: ['dir'] });
    schedule();
    return () => {
        resize.disconnect();
        attrs.disconnect();
        cancelAnimationFrame(frame);
    };
}
export default function fundingFlow() {
    let dispose: undefined | (() => void), root: HTMLElement | undefined;
    return {
        state: { currency: 'USD' as Currency, hover: '', focus: '', pinned: '' },
        init() {
            const Alpine = (window as Window & { Alpine?: typeof AlpineApi }).Alpine;
            if (!Alpine) throw new Error('Load Alpine before mounting the funding flow.');
            if (!Alpine.store('flow')) Alpine.store('flow', this.state);
            this.state = Alpine.store('flow') as typeof this.state;
        },
        get currency() {
            return this.state.currency;
        },
        paths: [] as ReturnType<typeof ribbons>,
        get graph() {
            return flowGraph(this.currency);
        },
        get trace() {
            return traceFlow(
                this.graph.edges,
                this.state.hover || this.state.focus || this.state.pinned,
            );
        },
        hot(id: string) {
            return !this.trace.size || this.trace.has(id);
        },
        pick(id: string) {
            this.state.pinned = this.state.pinned === id ? '' : id;
        },
        change(currency: Currency) {
            this.state.currency = currency;
            this.state.hover = '';
            this.state.focus = '';
            this.state.pinned = '';
            requestAnimationFrame(() => this.draw());
        },
        draw() {
            if (root) this.paths = ribbons(root, this.graph.edges);
        },
        paint(svg: SVGSVGElement) {
            svg.replaceChildren(
                ...this.paths.map((p) => {
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', p.path);
                    path.dataset.hot = String(this.hot(p.from) && this.hot(p.to));
                    return path;
                }),
            );
        },
        mount(el: HTMLElement) {
            root = el;
            dispose = trackGeometry(el, () => this.draw());
        },
        destroy() {
            dispose?.();
            this.state.hover = '';
            this.state.focus = '';
            this.state.pinned = '';
        },
    };
}
