import { test } from 'node:test';
import assert from 'node:assert/strict';
import schedule, {
    applyRippleEdit,
    packLanes,
    editReceipt,
    replayReceipt,
    criticalPath,
    initialMonth,
    reduceMonth,
    tasks,
    timescale,
    traceRoute,
} from '../src/content/vault/gantt-and-timesheet-machines/model.ts';

test('timescale uses integer UTC days across daylight-saving boundaries', () => {
    assert.deepEqual(timescale(6), { label: '2026-03-06', weekend: true });
    assert.equal(timescale(7).weekend, true);
    assert.equal(timescale(8).weekend, false);
    assert.equal(timescale(9).label, '2026-03-09');
});

test('a convergent dependency receives the final lower bound once and undo/redo restores whole edits', () => {
    const desk = schedule();
    desk.shift('r1', 3);
    assert.deepEqual(
        desk.rows.map((t) => t.startDay),
        [4, 12, 13, 20],
    );
    desk.undo();
    assert.deepEqual(desk.rows, tasks);
    desk.redo();
    assert.deepEqual(
        desk.rows.map((t) => t.endDay),
        [11, 19, 15, 23],
    );
    desk.undo();
    desk.shift('r2', 2);
    assert.equal(desk.future.length, 0);
    assert.throws(
        () =>
            applyRippleEdit(tasks, 'r1', 1, [
                { from: 'r1', to: 'r2', lag: 0 },
                { from: 'r2', to: 'r1', lag: 0 },
            ]),
        /cycle/,
    );
});

test('route traces ancestors and dependents without entering siblings', () => {
    const trace = traceRoute('r2');
    assert.deepEqual([...trace.nodes].sort(), ['r1', 'r2', 'r4']);
    assert.deepEqual(trace.funding, ['P-014', 'FA-01', 'P-009', 'FA-03']);
    assert.deepEqual([...criticalPath(tasks)].sort(), ['r1', 'r2', 'r4']);
    assert.deepEqual([...criticalPath(applyRippleEdit(tasks, 'r3', 8))].sort(), ['r3', 'r4']);
});

test('timesheet requires human decisions and independent approval, and reverses only unused credit', () => {
    const draft = initialMonth();
    assert.equal(reduceMonth(draft, 'Confirm', 'Employee', false).month, draft);
    const signed = reduceMonth(
        { ...draft, answers: ['Worked', 'Absent'] },
        'Confirm',
        'Employee',
        false,
    ).month;
    assert.equal(signed.status, 'Confirmed');
    assert.equal(reduceMonth(signed, 'Approve', 'Manager', true).month, signed);
    assert.equal(reduceMonth(signed, 'Approve', 'Employee', false).month, signed);
    const approved = reduceMonth(signed, 'Approve', 'Manager', false).month;
    const locked = reduceMonth(approved, 'Lock', 'HR', false).month;
    assert.equal(locked.credit, 4);
    assert.equal(reduceMonth(locked, 'Lock', 'HR', false).month, locked);
    assert.equal(reduceMonth({ ...locked, consumed: true }, 'Reopen', 'HR', false).month.credit, 4);
    assert.equal(reduceMonth(locked, 'Reopen', 'HR', false).month.credit, 0);
});
test('receipts replay the full change set atomically and reject stale or unrelated rows', () => {
    const receipt = editReceipt(tasks, 'r1', 2);
    assert.deepEqual(
        receipt.changes.map((c) => c.id),
        ['r1', 'r2', 'r3', 'r4'],
    );
    const next = replayReceipt(tasks, receipt);
    assert.deepEqual(replayReceipt(next, receipt, true), tasks);
    assert.throws(() => replayReceipt(next, receipt), /changed/);
    assert.equal(editReceipt(tasks, 'unknown', 1).ok, false);
});
test('horizon packs overlapping intervals into bounded lanes and labels containment and route roles', () => {
    const packed = packLanes(tasks);
    assert.equal(packed.length, 4);
    assert.ok(packed.every((t) => t.lane < 6));
    for (const a of packed)
        for (const b of packed)
            if (a !== b && a.lane === b.lane) assert.ok(a.end < b.start || b.end < a.start);
    assert.deepEqual(traceRoute('r2').roles, {
        phase: 'Context',
        r2: 'Selected',
        r1: 'Driver',
        r4: 'Dependent',
    });
    assert.deepEqual(Object.values(traceRoute('phase').roles).sort(), [
        'Contained',
        'Contained',
        'Contained',
        'Contained',
        'Selected',
    ]);
});
