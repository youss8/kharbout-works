import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import JSZip from 'jszip';
import { parseCsv } from '../src/lib/kernels/safeCsv.ts';
import { importCsv } from '../src/lib/tools/csv-test-pack-adapter.mjs';
import { createCsvTestScaffold } from '../src/lib/tools/csv-test-pack-archive.ts';
import {
    addCsvTestPackData,
    createCsvTestPack,
    defaultCsvTestSettings,
} from '../src/lib/tools/csv-test-pack.ts';

test('CSV packs are repeatable and keep accepted zero distinct from a rejected blank', () => {
    const pack = createCsvTestPack(defaultCsvTestSettings);
    assert.deepEqual(pack, createCsvTestPack(defaultCsvTestSettings));
    assert.notEqual(pack.csv, createCsvTestPack({ ...defaultCsvTestSettings, seed: 'other' }).csv);
    assert.throws(
        () => createCsvTestPack({ ...defaultCsvTestSettings, seed: '../../file' }),
        /letters/u,
    );
    assert.equal(pack.csv.charCodeAt(0), 0xfeff);

    const parsed = parseCsv(pack.csv);
    assert.equal(parsed.length, 9);
    assert.equal(parsed[2][3], 'North office, intake\nReviewed by "Mina"');
    assert.equal(parsed[3][2], '0');
    assert.equal(parsed[4][2], '');
    assert.equal(pack.expected.rows[2].value.quantity, 0);
    assert.equal(pack.expected.rows[3].code, 'missing-quantity');
    assert.deepEqual(
        pack.expected.rows.slice(4).map(({ code }) => code),
        ['ambiguous-date', 'invalid-date', 'duplicate-id', 'duplicate-id'],
    );
});

test('the independent reference importer matches the outcomes across rule combinations', () => {
    for (const headerLanguage of ['ar', 'en']) {
        for (const includeBom of [false, true]) {
            for (const duplicateIds of ['reject-all', 'keep-first']) {
                for (const ambiguousDate of ['reject', 'month-first', 'day-first']) {
                    for (const blankQuantity of ['reject', 'null']) {
                        const pack = createCsvTestPack({
                            ...defaultCsvTestSettings,
                            headerLanguage,
                            includeBom,
                            duplicateIds,
                            ambiguousDate,
                            blankQuantity,
                        });
                        assert.deepEqual(importCsv(pack.csv, pack.expected), pack.expected.rows);
                    }
                }
            }
        }
    }
});

test('an extracted archive runs without npm installation and catches a blank-to-zero regression', async (context) => {
    const directory = await mkdtemp(join(tmpdir(), 'kharbout-csv-test-pack-'));
    context.after(() => rm(directory, { recursive: true, force: true }));

    const pack = createCsvTestPack({
        ...defaultCsvTestSettings,
        headerLanguage: 'ar',
        blankQuantity: 'null',
        ambiguousDate: 'day-first',
        duplicateIds: 'keep-first',
    });
    const readSource = (name) => readFile(new URL(name, import.meta.url), 'utf8');
    const [adapter, parser, parserTypes, license] = await Promise.all([
        readSource('../src/lib/tools/csv-test-pack-adapter.mjs'),
        readSource('../src/lib/kernels/safeCsv.ts'),
        readSource('../src/lib/kernels/cleanForWrite.ts'),
        readSource('../LICENSE'),
    ]);
    const builtScaffold = await createCsvTestScaffold({
        adapter,
        parser,
        parserTypes,
        license,
    }).generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
    });
    const archive = addCsvTestPackData(await JSZip.loadAsync(builtScaffold), pack);
    const bytes = await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const downloaded = await JSZip.loadAsync(bytes);
    const filenames = [
        'import.test.mjs',
        'tools/csv-test-pack-adapter.mjs',
        'kernels/safeCsv.ts',
        'kernels/cleanForWrite.ts',
        'README.md',
        'LICENSE',
        'sample.csv',
        'expected.json',
    ];
    assert.deepEqual(Object.keys(downloaded.files), filenames);
    await Promise.all(
        filenames.map(async (name) => {
            const path = join(directory, name);
            await mkdir(dirname(path), { recursive: true });
            await writeFile(path, await downloaded.file(name).async('nodebuffer'));
        }),
    );

    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const run = () =>
        spawnSync(process.execPath, ['--test', 'import.test.mjs'], {
            cwd: directory,
            encoding: 'utf8',
            timeout: 20_000,
            env,
        });
    const original = run();
    assert.equal(original.status, 0, original.stdout + original.stderr);

    const changed = adapter.replace('quantity: numericQuantity', 'quantity: numericQuantity ?? 0');
    assert.notEqual(changed, adapter);
    await writeFile(join(directory, 'tools', 'csv-test-pack-adapter.mjs'), changed);
    const regression = run();
    assert.equal(regression.status, 1, regression.stdout + regression.stderr);
    assert.match(regression.stdout, /CSV record 5/u);
    assert.match(regression.stdout, /quantity: null/u);
});
