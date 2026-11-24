import { bilingualSearch, prepareAskIndex } from '../../../lib/kernels/bilingualAsk.ts';
const entries = [
    { key: 'returns', label: 'Monthly site returns', aliases: ['العائدات الشهرية', 'reports'] },
    { key: 'tickets', label: 'New support request', aliases: ['تذكرة جديدة', 'create'] },
    { key: 'late', label: 'Overdue submissions', aliases: ['المتأخرات', 'late'] },
    { key: 'theme', label: 'Dark appearance', aliases: ['داكن', 'night'] },
    { key: 'archive', label: 'Historical records', aliases: ['كان', 'archive'] },
];
const index = prepareAskIndex(entries);
const aliasIndex = prepareAskIndex(
    entries.flatMap((item) => item.aliases.map((label) => ({ key: item.key, label }))),
);
export default function createModel() {
    return {
        query: '',
        presets: ['retrns', 'العائدات', ';hk', 'late'],
        recent: [] as string[],
        selected: '',
        get matches() {
            const hits = bilingualSearch(this.query, { items: index, recent: this.recent });
            const aliasHits = this.query.trim()
                ? bilingualSearch(this.query, { items: aliasIndex })
                : [];
            return hits.map((hit) => ({
                ...hit,
                alias: hit.highlights.some((p) => p.matched)
                    ? []
                    : (aliasHits.find((alias) => alias.item.key === hit.item.key)?.highlights ??
                      []),
            }));
        },
        pick(key: string) {
            const match = this.matches.find((row) => row.item.key === key);
            if (!match) return;
            this.selected = match.item.label;
            this.recent = [key, ...this.recent].slice(0, 32);
        },
    };
}
