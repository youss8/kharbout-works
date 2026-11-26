export interface RegisterField {
    key: string;
    label?: string;
    aliases?: readonly string[];
    type?: string;
    min?: number;
    required?: boolean;
    detail?: boolean;
}

/** Only submitted editable fields participate in a partial update. */
export function cleanForWrite(
    fields: readonly RegisterField[],
    raw: Record<string, unknown>,
): Record<string, unknown> {
    return Object.fromEntries(
        fields
            .filter((field) => Object.hasOwn(raw, field.key))
            .map(({ key }) => {
                const value = raw[key];
                return [key, typeof value === 'string' ? value.trim() || null : value];
            }),
    );
}
