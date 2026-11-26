import { parseRegisterCsv, toCsv } from '../../../lib/kernels/safeCsv';
import { cleanForWrite, type RegisterField } from '../../../lib/kernels/cleanForWrite';
export const fields: RegisterField[] = [
    { key: 'name', label: 'Backup job', aliases: ['Job Name', 'Job'], required: true },
    { key: 'interval', label: 'Interval (h)', aliases: ['Interval'], type: 'number', min: 0 },
    { key: 'last', label: 'Last run', type: 'date' },
    { key: 'notes', label: 'Internal notes', detail: true, type: 'textarea' },
];
const sample =
    'Extra Tag,Job Name,Interval,Last Run\r\ncritical-tier,File Server Nightly,24,46022\r\nprimary,App DB Hourly,1,n/a\r\nsecondary,Archive Sweep,12,invalid';
type Row = Record<string, unknown> & { id: number };
const snapshot = Date.parse('2026-01-05T12:00:00Z');
export function rowTone(row: Record<string, unknown>) {
    if (row.interval == null || Number(row.interval) === 0)
        return { tone: 'neutral', label: '○ Unscheduled' };
    if (row.last == null) return { tone: 'warn', label: '◐ Run date missing' };
    const next = Date.parse(row.last + 'T00:00:00Z') + Number(row.interval) * 3_600_000;
    return next < snapshot
        ? { tone: 'crit', label: '■ Backup overdue' }
        : { tone: 'ok', label: '● Within interval' };
}
export default function createModel() {
    return {
        fields,
        rowTone,
        csv: sample,
        warnings: [] as string[],
        error: '',
        preview: [] as Record<string, unknown>[],
        rows: [
            {
                id: 1,
                name: 'Workstation snapshot',
                interval: 24,
                last: '2026-01-05',
                notes: 'Keep encrypted',
                metadata: {},
            },
        ] as Row[],
        search: '',
        editing: 0,
        includeDetail: false,
        form: {} as Record<string, string>,
        payload: '',
        diff: '',
        notice: '',
        get columns() {
            return fields.filter((f) => !f.detail);
        },
        get editable() {
            return fields.filter((f) => !f.detail || this.includeDetail);
        },
        get visible() {
            return this.rows.filter((row) =>
                fields.some((f) =>
                    String(row[f.key] ?? '')
                        .toLowerCase()
                        .includes(this.search.trim().toLowerCase()),
                ),
            );
        },
        parse() {
            this.error = '';
            this.preview = [];
            this.warnings = [];
            try {
                const { rows, warnings } = parseRegisterCsv(this.csv, fields);
                this.preview = rows;
                this.warnings = warnings;
                if (!rows.length) this.notice = 'No data rows found.';
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Unable to parse CSV.';
            }
        },
        loadSample() {
            this.csv = sample;
            this.parse();
        },
        loadRows() {
            let next = Math.max(...this.rows.map((row) => row.id), 0);
            const valid = this.preview.filter((row) =>
                fields.every((f) => !f.required || row[f.key] != null),
            );
            this.rows = [...this.rows, ...valid.map((row) => ({ ...row, id: ++next }))];
            this.preview = [];
            this.notice = 'Loaded ' + valid.length + ' records.';
        },
        edit(row: Row) {
            this.editing = row.id;
            this.includeDetail = false;
            this.form = Object.fromEntries(fields.map((f) => [f.key, String(row[f.key] ?? '')]));
            this.notice = '';
        },
        save() {
            const before = this.rows.find((row) => row.id === this.editing);
            if (!before) return;
            const raw = Object.fromEntries(this.editable.map((f) => [f.key, this.form[f.key]]));
            const patch = cleanForWrite(this.editable, raw);
            for (const f of this.editable) {
                if (f.required && !patch[f.key]) {
                    this.notice = 'Enter ' + f.label + '.';
                    return;
                }
                if (f.type === 'number' && patch[f.key] !== null) {
                    const n = Number(patch[f.key]);
                    if (!Number.isFinite(n)) {
                        this.notice = 'Enter a number for ' + f.label + '.';
                        return;
                    }
                    if (f.min !== undefined && n < f.min) {
                        this.notice = f.label + ' must be ' + f.min + ' or greater.';
                        return;
                    }
                    patch[f.key] = n;
                }
            }
            this.rows = this.rows.map((r) => (r.id === this.editing ? { ...r, ...patch } : r));
            this.payload = JSON.stringify(patch, null, 2);
            this.diff = JSON.stringify(
                Object.fromEntries(
                    Object.keys(patch)
                        .filter((k) => before[k] !== patch[k])
                        .map((k) => [k, { before: before[k] ?? null, after: patch[k] }]),
                ),
                null,
                2,
            );
            this.editing = 0;
            this.notice = 'Changes saved.';
        },
        exportCsv() {
            const csv = toCsv([
                fields.map((f) => f.label),
                ...this.visible.map((r) => fields.map((f) => r[f.key])),
            ]);
            const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'backup-register.csv';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
    };
}
