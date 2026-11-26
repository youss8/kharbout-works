import type { RegisterField } from './cleanForWrite.ts';

export function escapeCsvCell(value: unknown): string {
    const text = String(value ?? '');
    const safe = /^(?:[\t\r]|\s*[=+@-])/u.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
}

export function toCsv(rows: readonly (readonly unknown[])[]): string {
    return '\uFEFF' + rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

/** RFC 4180 quoted fields, escaped quotes and embedded line breaks. */
export function parseCsv(text: string): string[][] {
    const source = text.replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let row: string[] = [],
        cell = '',
        quoted = false,
        closed = false;
    let line = 1;
    for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (quoted) {
            if (char === '"' && source[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (char === '"') {
                quoted = false;
                closed = true;
            } else {
                cell += char;
                if (char === '\n') line++;
            }
        } else if (char === ',' || char === '\n' || char === '\r') {
            row.push(cell);
            cell = '';
            closed = false;
            if (char !== ',') {
                if (char === '\r' && source[i + 1] === '\n') i++;
                rows.push(row);
                row = [];
                line++;
            }
        } else if (char === '"' && !cell && !closed) {
            quoted = true;
        } else {
            if (closed || char === '"') throw new Error(`Unexpected character on line ${line}.`);
            cell += char;
        }
    }
    if (quoted) throw new Error(`Unclosed quoted field on line ${line}.`);
    if (row.length || cell || closed) rows.push([...row, cell]);
    return rows;
}

export function parseRegisterDate(raw: string): string | null {
    let iso = raw;
    if (/^\d{1,5}$/.test(raw)) {
        const serial = Number(raw);
        // Excel's serial 60 names the fictional date 1900-02-29.
        if (serial < 1 || serial === 60) return null;
        iso = new Date(Date.UTC(1899, 11, serial < 60 ? 31 : 30) + serial * 86_400_000)
            .toISOString()
            .slice(0, 10);
    }
    const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(iso);
    if (slash) iso = `${slash[3]}-${slash[1].padStart(2, '0')}-${slash[2].padStart(2, '0')}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const date = new Date(iso + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().startsWith(iso) ? iso : null;
}

const headerKey = (text: string) =>
    text
        .trim()
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, '');

export function parseRegisterCsv(
    text: string,
    fields: readonly RegisterField[],
    file = 'paste.csv',
) {
    const [headers = [], ...records] = parseCsv(text);
    const aliases = new Map(
        fields.flatMap((field) =>
            [field.key, field.label ?? field.key, ...(field.aliases ?? [])].map(
                (alias) => [headerKey(alias), field] as const,
            ),
        ),
    );
    const columns = headers.map((header) => aliases.get(headerKey(header)));
    const targets = new Set<string>();
    headers.forEach((header, index) => {
        const field = columns[index];
        const target = field ? 'field:' + field.key : 'metadata:' + header;
        if (targets.has(target)) {
            const label = field?.label ?? header;
            throw new Error(
                `${file}:1 · More than one column maps to "${label}". Rename or remove one of the columns.`,
            );
        }
        targets.add(target);
    });
    const warnings: string[] = [];
    const rows = records.flatMap((record, index) => {
        if (record.every((cell) => !cell.trim())) return [];
        const values: Record<string, string | number | null> = Object.create(null);
        const metadata: Record<string, string> = Object.create(null);
        const warn = (message: string) => warnings.push(`${file}:${index + 2} · ${message}`);
        if (record.length !== headers.length)
            warn(`Expected ${headers.length} columns, read ${record.length}.`);
        record.forEach((cell, i) => {
            const field = columns[i];
            if (!field) {
                metadata[headers[i] ?? `Column ${i + 1}`] = cell;
                return;
            }
            const raw = cell.trim();
            let value: string | number | null = raw && !/^n\/a$/i.test(raw) ? raw : null;
            if (value !== null && field.type === 'date') value = parseRegisterDate(raw);
            if (value !== null && field.type === 'number')
                value = Number.isFinite(Number(raw)) ? Number(raw) : null;
            if (typeof value === 'number' && field.min !== undefined && value < field.min)
                throw new Error(
                    `${file}:${index + 2} · ${field.label ?? field.key} must be ${field.min} or greater.`,
                );
            if (raw && value === null && !/^n\/a$/i.test(raw))
                warn(`Invalid ${field.type} in ${field.label ?? field.key}.`);
            values[field.key] = value;
        });
        for (const field of fields) {
            if (field.required && values[field.key] == null)
                warn(`Missing ${field.label ?? field.key}.`);
        }
        return [{ ...values, metadata }];
    });
    return { rows, warnings };
}
