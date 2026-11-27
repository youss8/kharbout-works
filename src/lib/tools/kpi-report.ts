import { computePooledRatio } from '../kernels/pooledRatio.ts';
import { parseCsv, toCsv } from '../kernels/safeCsv.ts';

export const kpiCsvMaxBytes = 2 * 1024 * 1024;
const maxRecords = 10_000;

export const kpiFields = [
    { key: 'site', label: 'Site', names: ['site', 'site name', 'branch', 'location'] },
    { key: 'period', label: 'Period', names: ['period', 'reporting period', 'month', 'quarter'] },
    { key: 'numerator', label: 'Numerator', names: ['numerator', 'retained', 'actual numerator'] },
    {
        key: 'denominator',
        label: 'Denominator',
        names: ['denominator', 'cohort size', 'eligible', 'actual denominator'],
    },
] as const;

type KpiField = (typeof kpiFields)[number]['key'];
export type KpiMapping = Record<KpiField, number>;
export type KpiRowStatus = 'Included' | 'Missing' | 'Invalid' | 'Duplicate';

interface KpiCsvRecord {
    number: number;
    cells: string[];
}

export interface KpiDataset {
    headers: string[];
    records: KpiCsvRecord[];
    mapping: KpiMapping;
}

interface KpiRow {
    number: number;
    site: string;
    period: string;
    periodKey: string;
    numerator: string;
    denominator: string;
    status: KpiRowStatus;
    reason: string;
    reading: { numerator: number; denominator: number } | null;
}

const identity = (text: string) => text.normalize('NFKC').toLowerCase();
const headerKey = (text: string) => identity(text).replace(/[^\p{L}\p{N}]/gu, '');
const missing = (value: string) => /^(?:n\/?a|—|–|-)?$/i.test(value);

export function readKpiCsv(text: string): KpiDataset {
    if (text.length > kpiCsvMaxBytes || new TextEncoder().encode(text).length > kpiCsvMaxBytes) {
        throw new Error('Choose a CSV under 2 MiB or split it into smaller reports.');
    }
    const parsed = parseCsv(text);
    const present = parsed.flatMap((cells, index) =>
        cells.some((cell) => cell.trim()) ? [{ number: index + 1, cells }] : [],
    );
    const [header, ...records] = present;
    const headers = header?.cells.map((cell) => cell.trim()) ?? [];
    if (headers.length < kpiFields.length) {
        throw new Error('Use a comma-separated CSV with a header and at least four columns.');
    }
    if (records.length === 0) throw new Error('Add at least one data record below the header.');
    if (records.length > maxRecords) {
        throw new Error('Use up to 10,000 data records or split the CSV by reporting period.');
    }

    const columns = headers.map(headerKey);
    const mapping = Object.fromEntries(
        kpiFields.map(({ key, names }) => {
            const aliases = names.map(headerKey);
            const matches = columns.flatMap((column, index) =>
                aliases.includes(column) ? [index] : [],
            );
            return [key, matches.length === 1 ? matches[0] : -1];
        }),
    ) as KpiMapping;

    return { headers, records, mapping };
}

export function validateKpiMapping(dataset: KpiDataset, mapping: KpiMapping): string | null {
    const columns = kpiFields.map(({ key }) => mapping[key]);
    if (
        columns.some(
            (column) => !Number.isInteger(column) || column < 0 || column >= dataset.headers.length,
        )
    ) {
        return 'Choose a CSV column for each of the four fields.';
    }
    if (new Set(columns).size !== kpiFields.length) return 'Use a different column for each field.';
    return null;
}

function parseCount(raw: string): number | null {
    const count = /^\d+$/.test(raw) ? Number(raw) : NaN;
    return Number.isSafeInteger(count) ? count : null;
}

function readKpiRow(record: KpiCsvRecord, mapping: KpiMapping, columnCount: number): KpiRow {
    const row = {
        number: record.number,
        site: record.cells[mapping.site]?.trim() ?? '',
        period: record.cells[mapping.period]?.trim() ?? '',
        numerator: record.cells[mapping.numerator]?.trim() ?? '',
        denominator: record.cells[mapping.denominator]?.trim() ?? '',
    };
    const details = { ...row, periodKey: missing(row.period) ? '' : identity(row.period) };
    const excluded = (status: 'Missing' | 'Invalid', reason: string): KpiRow => ({
        ...details,
        status,
        reason,
        reading: null,
    });
    if (record.cells.length !== columnCount) {
        return excluded(
            'Invalid',
            `Expected ${columnCount} columns, found ${record.cells.length}.`,
        );
    }
    const missingFields = kpiFields.filter(({ key }) => missing(row[key]));
    const numerator = parseCount(row.numerator);
    const denominator = parseCount(row.denominator);
    if (!missing(row.numerator) && numerator === null) {
        return excluded('Invalid', 'Numerator must be a non-negative whole number.');
    }
    if (!missing(row.denominator) && (denominator === null || denominator === 0)) {
        return excluded('Invalid', 'Denominator must be a positive whole number.');
    }
    if (numerator === null || denominator === null || missingFields.length) {
        const labels = missingFields.map(({ label }) => label.toLowerCase()).join(', ');
        return excluded('Missing', `Missing ${labels}.`);
    }
    if (numerator > denominator) return excluded('Invalid', 'Numerator exceeds the denominator.');
    return {
        ...details,
        status: 'Included',
        reason: numerator === 0 ? 'Measured zero included.' : '',
        reading: { numerator, denominator },
    };
}

export function createKpiReport(dataset: KpiDataset, mapping: KpiMapping) {
    const mappingError = validateKpiMapping(dataset, mapping);
    if (mappingError) throw new Error(mappingError);

    const rows = dataset.records.map((record) =>
        readKpiRow(record, mapping, dataset.headers.length),
    );
    const duplicateGroups = new Map<string, KpiRow[]>();
    const periods = new Map<string, { label: string; rows: KpiRow[] }>();
    for (const row of rows) {
        if (!row.periodKey) continue;
        const group = periods.get(row.periodKey) ?? { label: row.period, rows: [] };
        group.rows.push(row);
        periods.set(row.periodKey, group);

        if (missing(row.site)) continue;
        const key = JSON.stringify([row.periodKey, identity(row.site)]);
        const matching = duplicateGroups.get(key) ?? [];
        matching.push(row);
        duplicateGroups.set(key, matching);
    }
    for (const matching of duplicateGroups.values()) {
        if (matching.length === 1) continue;
        for (const row of matching) {
            const previousIssue = row.status === 'Included' ? '' : ` ${row.reason}`;
            row.status = 'Duplicate';
            row.reason = `${matching.length} records share this site and period.${previousIssue}`;
            row.reading = null;
        }
    }

    const periodSummaries = [...periods].map(([key, { label, rows: periodRows }]) => {
        const ratio = computePooledRatio(periodRows.map(({ reading }) => reading));
        const precise =
            Number.isSafeInteger(ratio.numerator) && Number.isSafeInteger(ratio.denominator);
        return { key, label, ...ratio, precise };
    });
    return {
        rows,
        periods: periodSummaries,
        unassigned: rows.filter(({ periodKey }) => !periodKey).length,
    };
}

export type KpiReport = ReturnType<typeof createKpiReport>;

const percentFormatter = new Intl.NumberFormat('en', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
});
export const formatKpiPercent = (value: number | null) =>
    value === null ? '—' : `${percentFormatter.format(value)}%`;

export function exportKpiReport(report: KpiReport): string {
    return toCsv([
        [
            'Type',
            'CSV record',
            'Site',
            'Period',
            'Numerator',
            'Denominator',
            'Status',
            'Reason',
            'Included records',
            'Excluded records',
            'Pooled rate',
            'Site average',
        ],
        ...report.periods.map((period) => [
            'Summary',
            '',
            '',
            period.label,
            period.precise && period.included ? period.numerator : '',
            period.precise && period.included ? period.denominator : '',
            '',
            period.precise ? '' : 'Sum exceeds the supported whole-number range.',
            period.included,
            period.excluded,
            period.precise && period.pooled !== null ? formatKpiPercent(period.pooled) : '',
            period.precise && period.average !== null ? formatKpiPercent(period.average) : '',
        ]),
        ...report.rows.map((row) => [
            'Record',
            row.number,
            row.site,
            row.period,
            row.numerator,
            row.denominator,
            row.status,
            row.reason,
            '',
            '',
            '',
            '',
        ]),
    ]);
}
