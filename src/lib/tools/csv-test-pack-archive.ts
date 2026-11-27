import JSZip from 'jszip';

interface CsvPackSources {
    adapter: string;
    parser: string;
    parserTypes: string;
    license: string;
}

const runner = `import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { importCsv } from './tools/csv-test-pack-adapter.mjs';

const csv = await readFile(new URL('./sample.csv', import.meta.url), 'utf8');
const { rows, columns, rules, version } = JSON.parse(
    await readFile(new URL('./expected.json', import.meta.url), 'utf8'),
);
assert.equal(version, 1, 'Expected fixture format 1');

test('CSV importer matches independently authored outcomes', async (context) => {
    const actual = await importCsv(csv, { columns, rules });
    assert.equal(actual.length, rows.length, 'One outcome per data record');
    for (const [index, expected] of rows.entries()) {
        await context.test('CSV record ' + expected.record + ' · ' + expected.id, () => {
            assert.deepEqual(actual[index], expected);
        });
    }
});
`;

const readme = `# CSV import test pack

This pack has a synthetic UTF-8 CSV, expected record outcomes, a reference importer, and a runnable test. The expected values were defined for the cases before running the reference adapter.

## Run it

Use Node.js 24 or later. Extract the archive and run this in its directory.

\`\`\`sh
node --test import.test.mjs
\`\`\`

The pack uses Node's built-in test runner and needs no dependency installation. A CSV record number counts the header as record 1 and treats an embedded newline as part of one record.

## Connect your own importer

Change the \`importCsv\` import in \`import.test.mjs\` to an adapter for your application. The adapter receives the raw \`csv\` string and \`{ columns, rules }\` from \`expected.json\`. It may be async. Return one outcome per data record, in source order, with this shape.

\`\`\`js
{ record: 2, id: 'ROW-…', status: 'accepted', code: 'ok',
  value: { date: '2026-02-14', quantity: 8, note: 'Received' } }
{ record: 7, id: 'ROW-…', status: 'rejected', code: 'invalid-date' }
\`\`\`

Return a \`skipped\` outcome for later duplicate IDs when the pack uses \`keep-first\`. Accepted quantities are numbers or \`null\`, and accepted dates are ISO calendar dates. Notes preserve embedded quotes and newlines. Keep \`expected.json\` as the independently authored expectation for the selected rules.

The reference adapter shows how to map headers, validate dates, and distinguish absent values from zero. The MIT notice applies to the bundled source.
`;

export function createCsvTestScaffold(sources: CsvPackSources) {
    const files: Record<string, string> = {
        'import.test.mjs': runner,
        'tools/csv-test-pack-adapter.mjs': sources.adapter,
        'kernels/safeCsv.ts': sources.parser,
        'kernels/cleanForWrite.ts': sources.parserTypes,
        'README.md': readme,
        LICENSE: sources.license,
    };
    const archive = new JSZip();
    for (const [name, content] of Object.entries(files)) {
        archive.file(name, content, { date: new Date(Date.UTC(2000, 0, 1)), createFolders: false });
    }
    return archive;
}
