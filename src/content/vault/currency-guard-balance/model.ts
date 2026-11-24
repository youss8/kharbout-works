export const ledger = [
    { amount: 125000.5, currency: 'EUR' },
    { amount: 420000, currency: 'USD' },
];
export function formatMoney(amount: number, currency: string | null | undefined) {
    if (!currency?.trim()) throw new Error('A currency code is required.');
    const code = currency.trim().toUpperCase();
    const parts = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'code',
    }).formatToParts(amount);
    return (
        parts
            .filter((part) => part.type !== 'currency' && part.type !== 'literal')
            .map((part) => part.value)
            .join('') +
        ' ' +
        code
    );
}
export function subtotal(rows: typeof ledger) {
    if (!rows.length) throw new Error('Choose at least one ledger entry.');
    const currencies = new Set(rows.map((row) => row.currency));
    if (currencies.size !== 1)
        throw new Error('Select a single currency. The ledger contains EUR and USD.');
    return formatMoney(
        rows.reduce((sum, r) => sum + r.amount, 0),
        rows[0].currency,
    );
}
export function ledgerSummary(mix: boolean) {
    try {
        return {
            totals: mix ? [subtotal(ledger)] : ledger.map((row) => subtotal([row])),
            reason: '',
        };
    } catch (error) {
        return { totals: ledger.map((row) => subtotal([row])), reason: (error as Error).message };
    }
}
export function deriveBalance(used: number, credit: boolean, pending: boolean) {
    const capacity = 120 + (credit ? 8 : 0);
    const remaining = capacity - used - (pending ? 16 : 0);
    const width = Math.max(0, Math.min(100, (100 * used) / capacity));
    const minutes = Math.round(Math.abs(remaining) * 60);
    return {
        hours: remaining,
        usedWidth: width,
        pendingWidth: Math.min(100 - width, (100 * (pending ? 16 : 0)) / capacity),
        creditStart: (100 * 120) / capacity,
        duration:
            (remaining < 0 ? '−' : '') +
            Math.floor(minutes / 480) +
            'd ' +
            Math.floor((minutes % 480) / 60) +
            'h ' +
            (minutes % 60) +
            'm',
    };
}
export default function moneyBalance() {
    return {
        eligible: true,
        used: 40,
        credit: true,
        pending: true,
        mix: false,
        get summary() {
            return ledgerSummary(this.mix);
        },
        get left() {
            return deriveBalance(this.used, this.credit, this.pending);
        },
    };
}
