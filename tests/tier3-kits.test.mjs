import test from 'node:test';
import assert from 'node:assert/strict';
import ask from '../src/content/vault/bilingual-ask-palette/model.ts';
import inbox from '../src/content/vault/needs-action-inbox/model.ts';
import lifecycle from '../src/content/vault/status-gate-lifecycle/model.ts';
import { loadDigest } from '../src/content/vault/needs-action-inbox/digest.ts';

test('five-record Ask index finds and highlights all four demonstration queries', (t) => {
    const model = ask(),
        timings = [];
    for (let i = 0; i < 260; i++) {
        model.query = model.presets[i % 4];
        const start = performance.now(),
            hit = model.matches[0],
            elapsed = performance.now() - start;
        assert.ok(
            [...hit.highlights, ...hit.alias].some((part) => part.matched),
            model.query,
        );
        if (i >= 20) timings.push(elapsed);
    }
    timings.sort((a, b) => a - b);
    t.diagnostic(
        '240 warm five-record searches, median ' +
            timings[120].toFixed(3) +
            ' ms and p95 ' +
            timings[228].toFixed(3) +
            ' ms.',
    );
});
test('six digest adapters omit only the failed source, keep zero neutral, and recover', async () => {
    const partial = await loadDigest('licenses');
    assert.equal(partial.failed, 1);
    assert.equal(partial.rows.length, 5);
    assert.ok(partial.rows.every((r) => r.key !== 'licenses'));
    assert.equal(partial.rows.find((r) => r.key === 'access').tone, 'neutral');
    assert.equal((await loadDigest(null)).rows.length, 6);
});
test('inbox action returns a typed decision envelope and invalidates stale undo', () => {
    const m = inbox();
    try {
        m.stale();
        assert.deepEqual(m.decide('Approve'), { outcome: 'changed' });
        m.reload();
        assert.deepEqual(m.decide('Approve'), { outcome: 'done' });
        assert.deepEqual(m.decide('Snooze'), { outcome: 'already_handled' });
        m.stale();
        m.undo();
        assert.equal(m.rows[0].handled, 'Approve');
        assert.equal(m.outcome, 'changed');
    } finally {
        m.destroy();
    }
});
test('rejected proposal replaces the review stop, dates later stops only on commit, and can return to draft', () => {
    const m = lifecycle();
    m.begin();
    m.target = 'Rejected';
    m.reason = 'More evidence required.';
    assert.equal(m.apply(), true);
    assert.equal(m.stepViews.length, 7);
    assert.equal(m.stepViews.find((s) => s.active).state, 'rejected');
    assert.equal(m.stepViews.find((s) => s.label === 'Approved').date, undefined);
    m.begin();
    m.reason = 'Review updated draft.';
    assert.equal(m.apply(), true);
    assert.equal(m.current, 'Draft');
});
