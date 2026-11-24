import performance from '../../data/demos/pt-kpi-cockpit.json';
import funding from '../../data/demos/pt-funding-flow.json';
import { computePooledRatio } from '../../lib/kernels/pooledRatio';

const periods = ['YTD', 'Q1', 'Q2', 'Q3', 'Q4'];
const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(2026, index, 1));
    return { key: date.toISOString().slice(0, 7), name: date.toLocaleString('en', { month: 'short', timeZone: 'UTC' }), index };
});
const reportMonth = Number(performance.asOf.slice(5, 7)) - 1;

function flattenTree(nodes, parents = []) {
    return nodes.flatMap(node => [
        { ...node, parents, depth: parents.length },
        ...flattenTree(node.children ?? [], [...parents, node.id]),
    ]);
}
const objectives = flattenTree(performance.tree);
const indicators = objectives.flatMap(node => node.kpis ?? []);

const latestPercentageReading = (target, month) => target.readings.findLast(item => item.month <= months[month].key);

function snapshot(kpi, target, month) {
    if (month < 0 || month > reportMonth) return null;
    if (kpi.measure === 'percentage') {
        const reading = latestPercentageReading(target, month);
        return reading?.denominator > 0 ? reading : null;
    }
    if (kpi.cumulative) return month === reportMonth ? target.latest : null;
    if (target.monthly[month] === undefined) return null;
    return target.monthly.slice(0, month + 1).reduce((sum, actual) => sum + actual, 0);
}

function gapReason(kpi, target, month) {
    if (month > reportMonth) return 'After reporting cutoff';
    if (kpi.measure === 'percentage' && (month === reportMonth || latestPercentageReading(target, month))) {
        return 'Missing denominator';
    }
    return 'No reading at cutoff';
}

function calculate(kpi, targets, month, method) {
    const readings = targets.map(target => snapshot(kpi, target, month));
    const values = readings.filter(value => value !== null);
    const covered = values.length;
    if (kpi.measure === 'percentage') {
        const { numerator, denominator, average, pooled } = computePooledRatio(readings);
        const target = covered ? targets.filter(row => snapshot(kpi, row, month)).reduce((sum, row) => sum + row.target, 0) / covered : null;
        return { actual: method === 'naive' ? average : pooled, target, numerator, denominator };
    }
    return {
        actual: covered ? values.reduce((sum, value) => sum + value, 0) : null,
        target: targets.reduce((sum, value) => sum + value.target, 0),
    };
}

const states = {
    zero: { name: 'Zero recorded', shape: 'outline', tone: 'neutral', icon: '○' },
    unavailable: { name: 'No reading', shape: 'dashed', tone: 'accent', icon: '–' },
    green: { name: 'On track', shape: 'surface', tone: 'ok', icon: '✓' },
    amber: { name: 'Needs attention', shape: 'outline', tone: 'warn', icon: '!' },
    red: { name: 'Off track', shape: 'solid', tone: 'crit', icon: '↓' },
};
const formatNumber = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
const kpiCockpit = () => ({
    periods, sites: performance.sites, sponsors: performance.sponsors, asOf: performance.asOf,
    sponsor: '', site: '', period: 'YTD', includePending: false,
    selected: 'EMP-02', inspector: 'Matrix', method: 'pooled', collapsed: [],
    reset() {
        Object.assign(this, { sponsor: '', site: '', period: 'YTD', includePending: false, selected: 'EMP-02', inspector: 'Matrix', method: 'pooled', collapsed: [] });
    },
    get cutoff() { return this.period === 'YTD' ? reportMonth : Number(this.period.slice(1)) * 3 - 1; },
    get displayedMonths() {
        const start = this.period === 'YTD' ? 0 : this.cutoff - 2;
        return months.slice(start, this.cutoff + 1);
    },
    get elapsed() { return (Math.min(this.cutoff, reportMonth) + 1) / 12; },
    get visibleNodes() { return objectives.filter(node => !node.parents.some(id => this.collapsed.includes(id))); },
    get current() { return indicators.find(kpi => kpi.code === this.selected); },
    get targets() { return this.matching(this.current); },
    matching(kpi) {
        return kpi.targets.filter(row => (!this.sponsor || row.sponsor === this.sponsor) && (!this.site || row.site === this.site));
    },
    toggleNode(id) { this.collapsed = this.collapsed.includes(id) ? this.collapsed.filter(item => item !== id) : [...this.collapsed, id]; },
    get rows() { return indicators.map(kpi => this.summary(kpi)); },
    get result() { return this.summary(this.current); },
    get exclusionNotes() {
        const counts = new Map();
        for (const target of this.targets) {
            if (snapshot(this.current, target, this.cutoff) !== null) continue;
            const reason = gapReason(this.current, target, this.cutoff);
            counts.set(reason, (counts.get(reason) ?? 0) + 1);
        }
        return [...counts].map(([reason, count]) => `${count} ${count === 1 ? 'site' : 'sites'} excluded · ${reason.toLowerCase()}`);
    },
    summary(kpi, month = this.cutoff) {
        const targets = this.matching(kpi);
        const rollup = calculate(kpi, targets, month, this.method);
        const pending = this.includePending && month === reportMonth ? targets.reduce((sum, item) => sum + (item.pending ?? 0), 0) : 0;
        const ratio = rollup.actual === null || !rollup.target ? null : rollup.actual / rollup.target;
        const pace = ratio === null ? null : ratio / ((month + 1) / 12);
        const state = pace === null ? states.unavailable : rollup.actual === 0 ? states.zero : pace >= 0.9 ? states.green : pace >= 0.7 ? states.amber : states.red;
        return { ...rollup, pending, ratio, state, progress: Math.min(100, (ratio ?? 0) * 100), pendingWidth: rollup.target ? Math.min(Math.max(0, 100 - (ratio ?? 0) * 100), pending / rollup.target * 100) : 0 };
    },
    get siteCount() {
        return new Set(indicators.flatMap(kpi => this.matching(kpi).filter(row => snapshot(kpi, row, this.cutoff) !== null).map(row => row.site))).size;
    },
    get targetAchievement() {
        const measured = this.rows.filter(row => row.ratio !== null);
        return measured.length ? Math.round(measured.filter(row => row.ratio >= 1).length / measured.length * 100) + '%' : '—';
    },
    get gaps() {
        const gaps = objectives.filter(node => node.level === 'outcome' && !node.kpis.length).map(node => node.id + ' · No KPI linked');
        for (const kpi of indicators) {
            for (const row of this.matching(kpi)) {
                if (snapshot(kpi, row, this.cutoff) !== null) continue;
                const reason = gapReason(kpi, row, this.cutoff);
                gaps.push(kpi.code + ' · ' + this.siteName(row.site) + ' · ' + reason);
            }
        }
        return gaps;
    },
    siteName(id) { return this.sites.find(site => site.id === id)?.name ?? id; },
    show(value, kpi = this.current) { return value === null ? '—' : formatNumber.format(value) + (kpi.measure === 'percentage' ? '%' : ''); },
    cell(row, month) {
        if (this.current.measure === 'percentage') {
            const entry = row.readings.find(reading => reading.month === month.key);
            return entry?.denominator ? entry.numerator + '/' + entry.denominator : '—';
        }
        if (this.current.cumulative) return month.index === reportMonth ? String(row.latest) : '—';
        return row.monthly[month.index] === undefined ? '—' : String(row.monthly[month.index]);
    },
});

const healthLabels = {
    onTrack: { name: 'On Track', shape: 'surface', tone: 'ok', icon: '✓' },
    needsAttention: { name: 'Needs Attention', shape: 'outline', tone: 'warn', icon: '!' },
    offTrack: { name: 'Off Track', shape: 'solid', tone: 'crit', icon: '×' },
};
const fundColumns = [
    { name: 'Sponsor', nodes: funding.sponsors.map(row => ({ id: row.id, label: row.name })) },
    { name: 'Proposal', nodes: funding.proposals.map(row => ({ id: row.id, label: row.title })) },
    { name: 'Project', nodes: funding.projects.map(row => ({ id: row.id, label: row.name })) },
];

function fundingConnections() {
    const connections = new Map();
    function add(source, target, currency, cents) {
        const id = `${source}:${target}:${currency}`;
        connections.set(id, { id, source, target, currency, cents: (connections.get(id)?.cents ?? 0) + cents });
    }

    for (const { sponsor, proposal, currency, budget } of funding.agreements) {
        const cents = Math.round(budget * 100);
        add(sponsor, proposal, currency, cents);
        const projects = funding.projects.filter(project => project.proposals.includes(proposal));
        if (!projects.length) continue;
        // The handoff supplies relationships but no allocation. Split each agreement evenly for the demo.
        const share = Math.floor(cents / projects.length);
        const remainder = cents % projects.length;
        projects.forEach((project, index) => add(proposal, project.id, currency, share + Number(index < remainder)));
    }
    return [...connections.values()];
}

export const fundingEdges = fundingConnections();
const maxRibbonCents = new Map();
for (const { currency, cents } of fundingEdges) {
    maxRibbonCents.set(currency, Math.max(1, cents, maxRibbonCents.get(currency) ?? 0));
}

function health(agreement) {
    if (agreement.tranches.some(row => row.state === 'failed')) return 'offTrack';
    const overdue = [...agreement.tranches, ...agreement.reports].some(row => ['expected', 'requested'].includes(row.state) && row.due < funding.asOf);
    return overdue ? 'needsAttention' : 'onTrack';
}
const moneyFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const fundingFlow = () => ({
    columns: fundColumns, healthLabels, asOf: funding.asOf,
    agreements: structuredClone(funding.agreements), healthFilter: '', activeTab: 'Register',
    hovered: '', focused: '', pinned: '', detailId: '', edges: [], message: '',
    init() {
        this.$nextTick(() => {
            const observer = new ResizeObserver(() => this.measure());
            observer.observe(this.$refs.map);
            for (const node of this.$refs.map.querySelectorAll('[data-flow-node]')) observer.observe(node);
            const direction = new MutationObserver(() => this.measure());
            direction.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
            this.disconnectObserver = () => { observer.disconnect(); direction.disconnect(); };
            this.measure();
        });
    },
    destroy() { this.disconnectObserver?.(); },
    reset() {
        this.close();
        Object.assign(this, { agreements: structuredClone(funding.agreements), healthFilter: '', activeTab: 'Register', hovered: '', focused: '', pinned: '', message: '' });
    },
    health, money(value, currency) { return currency + ' ' + moneyFormat.format(value); },
    name(id) { return fundColumns.flatMap(col => col.nodes).find(node => node.id === id)?.label ?? id; },
    get detail() { return this.agreements.find(row => row.id === this.detailId); },
    get ledger() {
        return this.filtered.flatMap(a => a.tranches.filter(t => t.state === 'received').map(t => ({ ...t, agreement: a.id, currency: a.currency }))).sort((a, b) => a.receivedOn.localeCompare(b.receivedOn));
    },
    get calendar() {
        return this.filtered.flatMap(a => [
            ...a.tranches.map(t => ({ date: t.due, title: a.id + ' · Tranche · ' + this.money(t.amount, a.currency), state: t.state })),
            ...a.reports.map(r => ({ date: r.due, title: a.id + ' · ' + r.type + ' report', state: r.state })),
        ]).sort((a, b) => a.date.localeCompare(b.date));
    },
    get totals() {
        return ['USD', 'EUR'].map(currency => ({
            currency,
            requested: funding.proposals.reduce((sum, row) => sum + (row.requested[currency] ?? 0), 0),
            agreed: this.agreements.reduce((sum, row) => sum + (row.currency === currency ? row.budget : 0), 0),
            received: this.agreements.filter(a => a.currency === currency).reduce((sum, a) => sum + this.received(a), 0),
        }));
    },
    received(a) { return a.tranches.reduce((sum, t) => sum + (t.state === 'received' ? t.amount : 0), 0); },
    count(key) { return this.agreements.filter(a => health(a) === key).length; },
    get filtered() { return this.agreements.filter(a => !this.healthFilter || health(a) === this.healthFilter); },
    get trace() { return this.hovered || this.focused || this.pinned; },
    get related() {
        if (!this.trace) return [];
        const project = funding.projects.find(p => p.id === this.trace);
        const matches = this.agreements.filter(a => a.sponsor === this.trace || a.proposal === this.trace || project?.proposals.includes(a.proposal));
        const nodes = new Set([this.trace]);
        for (const a of matches) {
            nodes.add(a.sponsor);
            nodes.add(a.proposal);
            nodes.add(a.id);
            for (const p of funding.projects) if (p.proposals.includes(a.proposal) && (!project || p.id === project.id)) nodes.add(p.id);
        }
        return [...nodes];
    },
    traceClass(id) { return this.trace ? this.related.includes(id) ? 'is-traced' : 'is-dimmed' : ''; },
    open(id) {
        this.detailId = id;
        if (!this.$refs.drawer.open) this.$refs.drawer.showModal();
    },
    close() { if (this.$refs.drawer.open) this.$refs.drawer.close(); this.detailId = ''; },
    markReceived(index) {
        const t = this.detail?.tranches[index];
        if (!t || t.state !== 'expected') return;
        t.state = 'received';
        t.receivedOn = funding.asOf;
        this.message = this.detail.id + ' · ' + this.money(t.amount, this.detail.currency) + ' received. Health: ' + healthLabels[health(this.detail)].name + '.';
    },
    measure() {
        const map = this.$refs.map;
        const origin = map.getBoundingClientRect();
        const rtl = getComputedStyle(map).direction === 'rtl';
        const anchors = new Map([...map.querySelectorAll('[data-flow-node]')].map(node => [node.dataset.flowNode, node.getBoundingClientRect()]));
        this.edges = fundingEdges.flatMap(edge => {
            const from = anchors.get(edge.source), to = anchors.get(edge.target);
            if (!from || !to || !origin.width) return [];
            const x1 = (rtl ? from.left : from.right) - origin.left;
            const x2 = (rtl ? to.right : to.left) - origin.left;
            const y1 = from.top + from.height / 2 - origin.top, y2 = to.top + to.height / 2 - origin.top;
            const middle = (x1 + x2) / 2;
            const ceiling = maxRibbonCents.get(edge.currency);
            return [{ id: edge.id, path: 'M' + x1 + ' ' + y1 + ' C' + middle + ' ' + y1 + ', ' + middle + ' ' + y2 + ', ' + x2 + ' ' + y2, width: edge.cents / ceiling * 14 }];
        });
    },
});

export default function registerPortfolio(Alpine) {
    Alpine.data('kpiCockpit', kpiCockpit);
    Alpine.data('fundingFlow', fundingFlow);
}
