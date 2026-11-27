import { parseCsv, parseRegisterDate } from '../kernels/safeCsv.ts';

function checkDate(value, preference) {
    let date = value;
    const slash = /^(\d{2})\/(\d{2})\/(\d{4})$/u.exec(value);
    if (slash) {
        const [, first, second, year] = slash;
        const ambiguous = Number(first) <= 12 && Number(second) <= 12 && first !== second;
        if (ambiguous && preference === 'reject') return { code: 'ambiguous-date' };
        const dayFirst = Number(first) > 12 || (Number(second) <= 12 && preference === 'day-first');
        date = dayFirst ? `${year}-${second}-${first}` : `${year}-${first}-${second}`;
    }
    return /^\d{4}-\d{2}-\d{2}$/u.test(date) && parseRegisterDate(date)
        ? { date }
        : { code: 'invalid-date' };
}

export function importCsv(csv, { columns, rules }) {
    const [header = [], ...records] = parseCsv(csv);
    const fields = Object.entries(columns).map(([name, heading]) => {
        const index = header.indexOf(heading);
        if (index === -1 || index !== header.lastIndexOf(heading)) {
            throw new Error(`Expected one column named ${heading}.`);
        }
        return [name, index];
    });
    const rows = records.map((record) =>
        Object.fromEntries(fields.map(([name, index]) => [name, record[index] ?? ''])),
    );
    const counts = new Map();
    for (const { id } of rows) counts.set(id, (counts.get(id) ?? 0) + 1);

    const seen = new Set();
    return rows.map(({ id, date, quantity, note }, index) => {
        const outcome = { record: index + 2, id };
        if (rules.duplicateIds === 'reject-all' && counts.get(id) > 1) {
            return { ...outcome, status: 'rejected', code: 'duplicate-id' };
        }
        if (seen.has(id)) return { ...outcome, status: 'skipped', code: 'duplicate-id' };
        seen.add(id);

        const checkedDate = checkDate(date, rules.ambiguousDate);
        if (checkedDate.code) return { ...outcome, status: 'rejected', code: checkedDate.code };
        const rawQuantity = quantity.trim();
        if (!rawQuantity && rules.blankQuantity === 'reject') {
            return { ...outcome, status: 'rejected', code: 'missing-quantity' };
        }
        const numericQuantity = rawQuantity === '' ? null : Number(rawQuantity);
        if (
            numericQuantity !== null &&
            (!/^\d+$/u.test(rawQuantity) || !Number.isSafeInteger(numericQuantity))
        ) {
            return { ...outcome, status: 'rejected', code: 'invalid-quantity' };
        }
        return {
            ...outcome,
            status: 'accepted',
            code: 'ok',
            value: { date: checkedDate.date, quantity: numericQuantity, note },
        };
    });
}
