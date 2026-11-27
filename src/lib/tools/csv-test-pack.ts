import type JSZip from 'jszip';
import { toCsv } from '../kernels/safeCsv.ts';

export interface CsvTestRules {
    duplicateIds: 'reject-all' | 'keep-first';
    ambiguousDate: 'reject' | 'month-first' | 'day-first';
    blankQuantity: 'reject' | 'null';
}

export interface CsvTestSettings extends CsvTestRules {
    seed: string;
    headerLanguage: 'en' | 'ar';
    includeBom: boolean;
}

const columnsByLanguage = {
    en: { id: 'Record ID', date: 'Received date', quantity: 'Quantity', note: 'Note' },
    ar: { id: 'معرّف السجل', date: 'تاريخ الاستلام', quantity: 'الكمية', note: 'ملاحظة' },
};

type CsvField = keyof typeof columnsByLanguage.en;
type CsvValues = Record<CsvField, string>;

interface AcceptedValue {
    date: string;
    quantity: number | null;
    note: string;
}

export type CsvTestResult =
    | { status: 'accepted'; code: 'ok'; value: AcceptedValue }
    | {
          status: 'rejected' | 'skipped';
          code: 'duplicate-id' | 'ambiguous-date' | 'invalid-date' | 'missing-quantity';
      };

interface CsvCase {
    title: string;
    raw: CsvValues;
    expected: CsvTestResult;
}

const fields: CsvField[] = ['id', 'date', 'quantity', 'note'];

export const defaultCsvTestSettings: CsvTestSettings = {
    seed: 'office-1042',
    headerLanguage: 'en',
    includeBom: true,
    duplicateIds: 'reject-all',
    ambiguousDate: 'reject',
    blankQuantity: 'reject',
};

export function validCsvTestSeed(seed: string): boolean {
    return /^[a-z0-9][a-z0-9_-]{0,31}$/i.test(seed);
}

function seedQuantity(seed: string): number {
    let hash = 2_166_136_261;
    for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619);
    return 1 + ((hash >>> 0) % 89);
}

const accepted = (date: string, quantity: number | null, note: string): CsvTestResult => ({
    status: 'accepted',
    code: 'ok',
    value: { date, quantity, note },
});

export function createCsvTestPack(settings: CsvTestSettings) {
    const { seed, headerLanguage, includeBom, duplicateIds, ambiguousDate, blankQuantity } =
        settings;
    if (!validCsvTestSeed(seed))
        throw new Error(
            'Use 1–32 letters, digits, dashes, or underscores. Start with a letter or digit.',
        );

    const metric = seedQuantity(seed);
    const date = '2026-02-14';
    const multiline = 'North office, intake\nReviewed by "Mina"';
    const columns = columnsByLanguage[headerLanguage];
    const record = (suffix: string, rawDate: string, quantity: string | number, note: string) => ({
        id: `ROW-${seed}-${suffix}`,
        date: rawDate,
        quantity: String(quantity),
        note,
    });

    // Expected values are deliberately authored with the fixture, before running any importer.
    const cases: CsvCase[] = [
        {
            title: 'Valid record',
            raw: record('01', date, metric, 'Received'),
            expected: accepted(date, metric, 'Received'),
        },
        {
            title: 'Quoted multiline note',
            raw: record('02', date, metric, multiline),
            expected: accepted(date, metric, multiline),
        },
        {
            title: 'Measured zero',
            raw: record('03', date, 0, 'No units received'),
            expected: accepted(date, 0, 'No units received'),
        },
        {
            title: 'Blank quantity',
            raw: record('04', date, '', 'Quantity was not reported'),
            expected:
                blankQuantity === 'null'
                    ? accepted(date, null, 'Quantity was not reported')
                    : { status: 'rejected', code: 'missing-quantity' },
        },
        {
            title: 'Ambiguous date',
            raw: record('05', '03/04/2026', metric, 'Date sent with slashes'),
            expected:
                ambiguousDate === 'reject'
                    ? { status: 'rejected', code: 'ambiguous-date' }
                    : accepted(
                          ambiguousDate === 'month-first' ? '2026-03-04' : '2026-04-03',
                          metric,
                          'Date sent with slashes',
                      ),
        },
        {
            title: 'Invalid calendar date',
            raw: record('06', '2026-02-30', metric, 'Day outside the calendar'),
            expected: { status: 'rejected', code: 'invalid-date' },
        },
        {
            title: 'First copy of duplicate ID',
            raw: record('07', date, metric, 'First submitted row'),
            expected:
                duplicateIds === 'keep-first'
                    ? accepted(date, metric, 'First submitted row')
                    : { status: 'rejected', code: 'duplicate-id' },
        },
        {
            title: 'Second copy of duplicate ID',
            raw: record('07', date, metric + 1, 'Conflicting quantity'),
            expected: {
                status: duplicateIds === 'keep-first' ? 'skipped' : 'rejected',
                code: 'duplicate-id',
            },
        },
    ];

    const examples = cases.map(({ title, raw, expected }, index) => ({
        record: index + 2,
        title,
        raw,
        expected,
    }));
    const csv = toCsv([
        fields.map((key) => columns[key]),
        ...cases.map(({ raw }) => fields.map((key) => raw[key])),
    ]);

    return {
        examples,
        csv: includeBom ? csv : csv.slice(1),
        expected: {
            version: 1,
            seed,
            encoding: includeBom ? 'UTF-8 with BOM' : 'UTF-8',
            columns,
            rules: { duplicateIds, ambiguousDate, blankQuantity },
            rows: examples.map(({ raw, record, expected }) => ({
                record,
                id: raw.id,
                ...expected,
            })),
        },
    };
}

export type CsvTestPack = ReturnType<typeof createCsvTestPack>;

export function addCsvTestPackData(archive: JSZip, pack: CsvTestPack) {
    const options = { date: new Date(Date.UTC(2000, 0, 1)), createFolders: false };
    archive.file('sample.csv', pack.csv, options);
    archive.file('expected.json', JSON.stringify(pack.expected, null, 2) + '\n', options);
    return archive;
}
