import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runReactStackParity } from '../src/lib/tools/stack-parity.ts';

const fixtureUrl = new URL('../src/data/stack-parity.json', import.meta.url);
const kit = new URL('../src/content/vault/status-gate-lifecycle/', import.meta.url);
const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8'));
const recorded = JSON.parse(
    readFileSync(new URL('../src/data/stack-parity-livewire.json', import.meta.url), 'utf8'),
);

function digest(url) {
    const content = readFileSync(url, 'utf8').replace(/\r\n?/gu, '\n');
    return createHash('sha256').update(content).digest('hex');
}

test('the real React model and the recorded Livewire trace meet the same fixture expectations', () => {
    assert.deepEqual(runReactStackParity(fixture), fixture.expected);
    assert.deepEqual(recorded.trace, fixture.expected);
});

test('a React run with missing approval evidence leaves the record in Review', () => {
    const trace = runReactStackParity({ approval: { ...fixture.approval, budget: false } });
    assert.equal(trace.fresh.stage, 'Review');
    assert.equal(trace.fresh.version, 2);
    assert.equal(trace.fresh.message, 'Confirm budget and dates.');
    assert.equal(trace.fresh.event, null);
});

test('the recorded Livewire trace is tied to the exact fixture and implementation', () => {
    assert.equal(recorded.fixtureSha256, digest(fixtureUrl));
    assert.equal(recorded.componentSha256, digest(new URL('Example.php', kit)));
    assert.equal(recorded.viewSha256, digest(new URL('view.blade.php', kit)));
});
