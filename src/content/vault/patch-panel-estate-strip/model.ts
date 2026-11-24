import estate from '../../../data/demos/it-estate-ops.json';

export const branches = estate.branches;
const now = Date.parse(estate.now),
    stale = estate.staleAfterMinutes * 60000;
export type Endpoint = (typeof estate.endpoints)[number];
export const metrics = ['cpu', 'ram', 'disk'] as const;
export const stateLabels = { online: '● Online', stale: '◐ Stale', unknown: '○ Never seen' };
export function endpoints(): Endpoint[] {
    const rows = estate.endpoints.map((p) => ({ ...p }));
    for (let n = 0; n < 30; n++) {
        const branch = branches[n % 10 < 5 ? 0 : n % 10 < 8 ? 1 : 2];
        rows.push({
            id: 'extra-' + n,
            name:
                branch.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('') +
                '-WS-' +
                (101 + n),
            branch: branch.id,
            type: 'Workstation',
            cpu: 12 + ((n * 7) % 84),
            ram: 29 + ((n * 11) % 68),
            disk: 21 + ((n * 13) % 76),
            last_seen:
                n % 11 === 0
                    ? null
                    : new Date(now - (n % 8 === 0 ? 30 : n % 10) * 60000).toISOString(),
        });
    }
    return rows;
}
export function state(p: Endpoint, at: number) {
    return p.last_seen === null
        ? 'unknown'
        : at - Date.parse(p.last_seen) > stale
          ? 'stale'
          : 'online';
}
export function grouped(ports: Endpoint[], at: number) {
    return branches
        .map((b) => {
            const endpoints = ports.filter((p) => p.branch === b.id);
            return {
                ...b,
                endpoints,
                online: endpoints.filter((p) => state(p, at) === 'online').length,
            };
        })
        .sort((a, b) => b.endpoints.length - a.endpoints.length || a.name.localeCompare(b.name));
}
export function tooltipPosition(anchor: HTMLElement) {
    const rect = anchor.getBoundingClientRect(),
        w = Math.min(240, innerWidth - 16);
    const x = Math.max(8, Math.min(rect.left, innerWidth - w - 8));
    const endSide = getComputedStyle(anchor).direction === 'rtl';
    const y = rect.bottom + 160 < innerHeight ? rect.bottom + 5 : Math.max(8, rect.top - 152);
    return {
        insetInlineStart: (endSide ? innerWidth - x - w : x) + 'px',
        insetBlockStart: y + 'px',
        inlineSize: w + 'px',
    };
}
export default function patchPanel() {
    const started = Date.now();
    let interval: ReturnType<typeof setInterval> | undefined;
    return {
        at: now,
        init(notify: () => void = () => {}) {
            clearInterval(interval);
            interval = setInterval(() => {
                this.at = now + Math.max(0, Date.now() - started);
                notify();
            }, 15_000);
        },
        destroy() {
            clearInterval(interval);
        },
        get refreshed() {
            return new Date(this.at).toISOString().slice(11, 19) + ' UTC';
        },
        ports: endpoints(),
        branch: branches[0].id,
        current: '',
        chosen: estate.endpoints[0].id,
        position: {} as ReturnType<typeof tooltipPosition>,
        message: '',
        metrics,
        stateLabels,
        state(port: Endpoint) {
            return state(port, this.at);
        },
        get groups() {
            return grouped(this.ports, this.at);
        },
        get detail() {
            return this.ports.find((p) => p.id === this.current);
        },
        inspect(id: string, el: HTMLElement) {
            this.chosen = id;
            this.current = id;
            this.position = tooltipPosition(el);
        },
        close() {
            this.current = '';
        },
        outage() {
            this.ports = this.ports.map((p) =>
                p.branch === this.branch && p.last_seen !== null
                    ? { ...p, last_seen: new Date(this.at - stale - 60000).toISOString() }
                    : p,
            );
            this.message =
                branches.find((b) => b.id === this.branch)!.name + ' missed its check-ins.';
        },
        checkIn() {
            this.ports = this.ports.map((p) =>
                p.id === this.chosen ? { ...p, last_seen: new Date(this.at).toISOString() } : p,
            );
            this.message = this.ports.find((p) => p.id === this.chosen)!.name + ' checked in.';
        },
    };
}
