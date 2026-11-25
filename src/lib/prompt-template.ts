export interface PromptSegment {
    text: string;
    key?: string;
}

export function parsePromptTemplate(raw: string, keys: readonly string[], id: string): PromptSegment[] {
    const segments: PromptSegment[] = [];
    const declared = new Set(keys);
    const used = new Set<string>();
    let cursor = 0;

    for (const match of raw.matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)) {
        const key = match[1];
        if (!declared.has(key)) throw new Error(id + ': undeclared prompt variable ' + key);
        if (match.index > cursor) segments.push({ text: raw.slice(cursor, match.index) });
        segments.push({ key, text: match[0] });
        used.add(key);
        cursor = match.index + match[0].length;
    }

    if (raw.length > cursor) segments.push({ text: raw.slice(cursor) });
    if (keys.length !== used.size) throw new Error(id + ': unused or duplicate prompt variable');
    return segments;
}

export function renderPromptTemplate(segments: readonly PromptSegment[], values: Record<string, string>): string {
    return segments.map(segment => segment.key ? values[segment.key] : segment.text).join('');
}
