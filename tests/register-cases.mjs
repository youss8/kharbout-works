import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanForWrite } from '../src/lib/kernels/cleanForWrite.ts';
import {
    parseCsv,
    parseRegisterCsv,
    parseRegisterDate,
    escapeCsvCell,
    toCsv,
} from '../src/lib/kernels/safeCsv.ts';
import {
    compareUrgency,
    durationParts,
    rankPriority,
    slaElapsedPercent,
    slaState,
} from '../src/lib/kernels/sla.ts';

const hour = 3_600_000;
test('register enforces field-specific minimums and preserves zero', () => {
    const fields = [{ key: 'interval', type: 'number', min: 0 }, { key: 'change', type: 'number' }];
    assert.throws(() => parseRegisterCsv('interval,change\n-3,1', fields), /interval must be 0 or greater/);
    const { rows } = parseRegisterCsv('interval,change\n0,-2\n0.5,3', fields);
    assert.deepEqual(rows.map(row => [row.interval, row.change]), [[0, -2], [0.5, 3]]);
});
const ticket = { created_at: 0, sla_due_at: 4 * hour, status: 'Open', priority: 'High' };

test('SLA elapsed has a 2% floor, a 100% ceiling and respects the resolution instant', () => {
    assert.equal(slaElapsedPercent(ticket, 0), 2);
    assert.equal(slaElapsedPercent(ticket, hour), 25);
    assert.equal(slaElapsedPercent(ticket, 5 * hour), 100);
    assert.equal(slaElapsedPercent({ ...ticket, sla_due_at: null }, hour), null);
    assert.equal(slaElapsedPercent({ ...ticket, sla_due_at: 0 }, hour), null);
    assert.equal(
        slaElapsedPercent({ ...ticket, status: 'Closed', resolved_at: hour }, 5 * hour),
        25,
    );
    assert.deepEqual(durationParts(-90 * 60_000), { hours: 1, minutes: 30 });
});

test('urgency ranks breached, closing, healthy, missing and closed records', () => {
    const now = 4 * hour;
    const queue = [
        ticket,
        { ...ticket, status: 'Resolved' },
        { ...ticket, sla_due_at: null },
        { ...ticket, sla_due_at: 6 * hour },
        { ...ticket, sla_due_at: 3 * hour },
    ];
    assert.deepEqual(
        queue.sort((a, b) => compareUrgency(a, b, now)).map((row) => slaState(row, now)),
        ['breached', 'closing', 'ok', 'unknown', 'closed'],
    );
    assert.equal(rankPriority(' urgent '), rankPriority('Critical'));
    assert.ok(rankPriority('unknown') > rankPriority('Low'));
});

test('formula-safe CSV neutralizes six leading tokens, quotes fields and writes one BOM', () => {
    for (const first of ['=', '+', '-', '@', '\t', '\r']) {
        assert.equal(escapeCsvCell(first + 'x'), `"'${first}x"`);
    }
    assert.equal(escapeCsvCell('  =1'), `"'  =1"`);
    const file = toCsv([
        ['Name', 'Description'],
        ['بيان', 'Two, "three"\r\nlines'],
    ]);
    assert.equal(file.codePointAt(0), 0xfeff);
    assert.deepEqual(parseCsv(file), [
        ['Name', 'Description'],
        ['بيان', 'Two, "three"\r\nlines'],
    ]);
    assert.throws(() => parseCsv('x,"unfinished'), /line 1/);
    assert.deepEqual(parseCsv('a,"",\r\n'), [['a', '', '']]);
});

test('register importer normalizes aliases, preserves unmapped columns, and identifies invalid rows', () => {
    const fields = [
        { key: 'name', label: 'Job', aliases: ['Job Name'], required: true },
        { key: 'last', label: 'Last Run', type: 'date' },
        { key: 'interval', type: 'number' },
    ];
    const result = parseRegisterCsv(
        'Extra,Last run,job_name,interval\nred,46022,Dock,24\nblue,02/30/2026,,n/a',
        fields,
        'jobs.csv',
    );
    assert.equal(result.rows[0].name, 'Dock');
    assert.equal(result.rows[0].last, '2025-12-31');
    assert.equal(result.rows[0].interval, 24);
    assert.equal(result.rows[0].metadata.Extra, 'red');
    assert.equal(result.rows[1].interval, null);
    assert.equal(result.warnings.length, 2);
    assert.ok(result.warnings.every((warning) => warning.startsWith('jobs.csv:3')));
    assert.equal(parseRegisterDate('12/31/2025'), '2025-12-31');
    assert.equal(parseRegisterDate('2024-02-29'), '2024-02-29');
    assert.equal(parseRegisterDate('2025-02-29'), null);
});

test('partial register writes trim blank fields to null and omit unseen keys', () => {
    const fields = [{ key: 'name' }, { key: 'hours' }, { key: 'notes', detail: true }];
    assert.deepEqual(cleanForWrite(fields, { name: ' Dock ', hours: ' ', private: 5 }), {
        name: 'Dock',
        hours: null,
    });
    assert.deepEqual(cleanForWrite(fields, { hours: 0, notes: ' verified ' }), {
        hours: 0,
        notes: 'verified',
    });
    assert.deepEqual(cleanForWrite(fields, Object.create({ name: 'inherited' })), {});
});

test('duplicate CSV columns are rejected before a mapped field or metadata can be overwritten', () => {
    const fields = [{ key: 'name', label: 'Backup job', aliases: ['Job', 'Job Name'] }];
    for (const header of ['Job,Job', 'Job,Job Name', 'Job,Ｊｏｂ Ｎａｍｅ']) {
        assert.throws(() => parseRegisterCsv(`${header}\nFirst,Second`, fields), /paste\.csv:1.+Backup job/);
    }
    assert.throws(() => parseRegisterCsv('Job,Tag,Tag\nFirst,Red,Blue', fields), /paste\.csv:1.+Tag/);
    const { rows } = parseRegisterCsv('Job,Tag,Owner\nFirst,Red,NA', fields);
    assert.equal(rows[0].name, 'First');
    assert.equal(rows[0].metadata.Owner, 'NA');
});
