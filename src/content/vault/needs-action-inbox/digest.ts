type Source = { key: string; label: string; urgency: 'crit' | 'warn'; read: () => number };
const unhandled = (states: string[], status: string) => states.filter((s) => s === status).length;
export const adapters: Source[] = [
    {
        key: 'loans',
        label: 'Overdue loans',
        urgency: 'crit',
        read: () => [-4, -2, 3, -1, -7].filter((days) => days < 0).length,
    },
    {
        key: 'licenses',
        label: 'Expiring licenses',
        urgency: 'warn',
        read: () => [5, 12, 50].filter((days) => days <= 30).length,
    },
    {
        key: 'returns',
        label: 'Late site returns',
        urgency: 'crit',
        read: () => unhandled(['late', 'late', 'submitted', 'late'], 'late'),
    },
    {
        key: 'access',
        label: 'Access reviews',
        urgency: 'warn',
        read: () => unhandled(['complete', 'complete'], 'pending'),
    },
    {
        key: 'leave',
        label: 'Leave requests',
        urgency: 'warn',
        read: () => unhandled(['pending', 'approved', 'pending'], 'pending'),
    },
    {
        key: 'contracts',
        label: 'Ending contracts',
        urgency: 'warn',
        read: () => [9, 40, 83].filter((days) => days <= 30).length,
    },
];
export function readSource(source: Source) {
    const count = source.read(),
        tone = count === 0 ? 'neutral' : source.urgency;
    return {
        key: source.key,
        label: source.label,
        count,
        tone,
        glyph: tone === 'neutral' ? '○' : tone === 'crit' ? '■' : '◐',
    };
}
export async function loadDigest(unavailable: string | null) {
    const results = await Promise.allSettled(
        adapters.map(async (source) => {
            if (source.key === unavailable) throw Error(source.label + ' unavailable');
            return readSource(source);
        }),
    );
    const rows = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    return { rows, failed: results.length - rows.length };
}
