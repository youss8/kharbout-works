type Terms = { title: string; site: string; hours: number };
const live: Terms = { title: 'Senior coordinator', site: 'North Hub', hours: 7 };
const amendments = [
    {
        id: 'AMD-01',
        date: '2025-09-01',
        reason: 'Promotion and transfer',
        before: { title: 'Coordinator', site: 'East Annex', hours: 8 },
        after: { title: 'Senior coordinator', site: 'North Hub', hours: 8 },
    },
    {
        id: 'AMD-02',
        date: '2026-03-01',
        reason: 'Working week adjustment',
        before: { title: 'Senior coordinator', site: 'North Hub', hours: 8 },
        after: live,
    },
];
export function reconstructAsSigned(current: Terms, chain: typeof amendments) {
    return { ...(chain[0]?.before ?? current) };
}
type Position = {
    id: string;
    title: string;
    parent?: string;
    technical?: string;
    vacant?: boolean;
    holder?: string;
};
const org: Position[] = [
    { id: 'P1', title: 'Operations director', holder: 'Operations lead 01' },
    { id: 'P2', title: 'Systems lead', parent: 'P1', holder: 'Assigned post' },
    { id: 'P3', title: 'Data analyst', parent: 'P1', vacant: true },
    { id: 'P4', title: 'Service lead', parent: 'P1', holder: 'Assigned post' },
    {
        id: 'P5',
        title: 'Support analyst',
        parent: 'P2',
        technical: 'P4',
        holder: 'Service specialist',
    },
];
export function layoutOrgTree(nodes: Position[], compact: boolean, rtl: boolean) {
    const levels = new Map<string, number>();
    const pending = [...nodes];
    while (pending.length) {
        const i = pending.findIndex((p) => !p.parent || levels.has(p.parent));
        if (i === -1) throw Error('Reporting tree contains a cycle or missing parent.');
        const [p] = pending.splice(i, 1);
        levels.set(p.id, p.parent ? levels.get(p.parent)! + 1 : 0);
    }
    const depth = Math.max(0, ...levels.values());
    const spacing = compact ? 64 : 94;
    const width = 510;
    const positions = nodes.map((n) => {
        const level = levels.get(n.id)!;
        const peers = nodes.filter((p) => levels.get(p.id) === level);
        const fraction = (peers.findIndex((p) => p.id === n.id) + 0.5) / peers.length;
        return { ...n, x: width * (rtl ? 1 - fraction : fraction), y: 26 + level * spacing };
    });
    return { positions, width, height: 55 + depth * spacing };
}
const ns = 'http://www.w3.org/2000/svg';
function element(name: string, attributes: Record<string, string>) {
    const el = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attributes)) el.setAttribute(k, v);
    return el;
}
export default function createModel() {
    return {
        tab:
            typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('panel') === 'org'
                ? 'Org chart'
                : 'Contract',
        signed: false,
        compact: false,
        hide: false,
        selected: 'P1',
        amendments,
        viewer: 'Coordinator',
        pay: null as typeof import('./pay-fixture').pay | null,
        payState: 'ready' as 'ready' | 'loading' | 'error',
        roleVersion: 0,
        async switchViewer(role: string) {
            const token = ++this.roleVersion;
            this.viewer = role === 'HR manager' ? role : 'Coordinator';
            this.pay = null;
            this.payState = 'ready';
            if (this.viewer !== 'HR manager') return;
            this.payState = 'loading';
            try {
                const { pay } = await import('./pay-fixture');
                if (token === this.roleVersion) {
                    this.pay = pay;
                    this.payState = 'ready';
                }
            } catch {
                if (token === this.roleVersion) this.payState = 'error';
            }
        },
        get terms() {
            const base = this.signed ? reconstructAsSigned(live, amendments) : live;
            return this.pay
                ? { ...base, 'monthly pay': this.signed ? this.pay.original : this.pay.live }
                : base;
        },
        get positions() {
            return org.filter((p) => !this.hide || !p.vacant);
        },
        get position() {
            return this.positions.find((p) => p.id === this.selected);
        },
        draw(svg: SVGSVGElement) {
            const { positions, width, height } = layoutOrgTree(
                this.positions,
                this.compact,
                svg.closest('[dir]')?.getAttribute('dir') === 'rtl',
            );
            const focused = svg.contains(document.activeElement)
                ? document.activeElement?.getAttribute('data-position')
                : null;
            svg.replaceChildren();
            svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
            for (const node of positions)
                for (const [parent, technical] of [
                    [node.parent, false],
                    [node.technical, true],
                ] as const) {
                    const from = positions.find((p) => p.id === parent);
                    if (!from) continue;
                    const mid = (from.y + node.y) / 2;
                    svg.append(
                        element('path', {
                            d: `M${from.x} ${from.y + 15} V${mid} H${node.x} V${node.y - 15}`,
                            fill: 'none',
                            stroke: 'currentColor',
                            'stroke-dasharray': technical ? '5 4' : 'none',
                        }),
                    );
                }
            for (const node of positions) {
                const group = element('g', {
                    'data-position': node.id,
                    role: 'button',
                    tabindex: '0',
                    'aria-label': node.title + (node.vacant ? ' · vacant' : ''),
                    transform: `translate(${node.x},${node.y})`,
                });
                group.append(
                    element('rect', {
                        x: '-71',
                        y: '-15',
                        width: '142',
                        height: '30',
                        rx: '3',
                        fill: 'var(--bg-surface, white)',
                        stroke: 'currentColor',
                        'stroke-width': this.selected === node.id ? '2.5' : '1',
                        'stroke-dasharray': node.vacant ? '4 3' : 'none',
                    }),
                );
                const label = element('text', {
                    'text-anchor': 'middle',
                    y: '4',
                    'font-size': '11',
                    fill: 'currentColor',
                });
                label.textContent = (node.vacant ? '○ ' : '') + node.title;
                group.append(label);
                svg.append(group);
            }
            if (focused)
                svg.querySelector<SVGElement>(
                    '[data-position="' + CSS.escape(focused) + '"]',
                )?.focus();
        },
        select(event: Event) {
            const target =
                event.target instanceof Element ? event.target.closest('[data-position]') : null;
            if (target) this.selected = target.getAttribute('data-position') ?? 'P1';
        },
        download(svg: SVGSVGElement) {
            const copy = document.createElementNS(ns, 'svg');
            copy.setAttribute('viewBox', svg.getAttribute('viewBox')!);
            for (const child of svg.children) copy.append(child.cloneNode(true));
            copy.setAttribute('color', '#101412');
            copy.setAttribute('width', '510');
            copy.querySelectorAll('rect').forEach((r) => r.setAttribute('fill', 'white'));
            const url = URL.createObjectURL(
                new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }),
            );
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporting-lines.svg';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
    };
}
