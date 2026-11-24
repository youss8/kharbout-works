// Form values are JSON scalars, nested field records, or arrays of selected IDs.
function fieldKey(value: unknown): string {
    if (Array.isArray(value)) {
        return 'set:' + JSON.stringify([...new Set(value.map(fieldKey))].sort());
    }
    if (value !== null && typeof value === 'object') {
        return (
            'record:' +
            JSON.stringify(
                Object.entries(value)
                    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
                    .map(([key, field]) => [key, fieldKey(field)]),
            )
        );
    }
    if (value === null || typeof value === 'string' || typeof value === 'number') {
        const normalized = String(value ?? '').trim().replace(/^((?:[01]\d|2[0-3]):[0-5]\d):00$/, '$1');
        return 'field:' + normalized;
    }
    return typeof value + ':' + String(value);
}

export function isNormalizedDirty(baseline: unknown, current: unknown): boolean {
    return fieldKey(baseline) !== fieldKey(current);
}
