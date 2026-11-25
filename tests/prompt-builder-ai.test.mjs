import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { providerRequest, readOutput, readRequest } from '../supabase/functions/prompt-ai/contract.ts';

test('AI intake accepts only known, unique fields and leaves missing answers absent', () => {
    const notes = 'Lina will confirm the workshop room.';
    const fields = [{ key: 'NOTES', label: 'Source notes' }, { key: 'RECIPIENT', label: 'Recipient' }];
    const request = readRequest({ action: 'suggest', notes, fields });
    assert.equal(readRequest({ action: 'suggest', notes, fields: [fields[0], fields[0]] }), null);
    assert.deepEqual(readOutput(request, JSON.stringify({ fields: [{ key: 'NOTES', value: notes }] })),
        { action: 'suggest', fields: [{ key: 'NOTES', value: notes }] });
    assert.equal(readOutput(request, '{"fields":[{"key":"OTHER","value":"Unknown"}]}'), null);
    assert.equal(providerRequest(request).text.format.strict, true);
    assert.equal(providerRequest(request).store, false);
});

test('AI comparisons require one result for every checklist entry', () => {
    const run = { prompt: 'Write a meeting summary', result: 'The workshop is on Thursday.' };
    const request = readRequest({ action: 'evaluate', runs: [run, run], checks: ['Preserve the date', 'State remaining work'] });
    const good = { index: 0, a: true, b: true, explanation: 'Both preserve the date.' };
    const missing = { index: 1, a: false, b: false, explanation: 'Both omit the next action.' };
    assert.equal(readOutput(request, JSON.stringify({ results: [missing, missing] })), null);
    assert.deepEqual(readOutput(request, JSON.stringify({ results: [missing, good] })), { action: 'evaluate', results: [good, missing] });
    assert.equal(readRequest({ action: 'evaluate', runs: [run], checks: ['Date'] }), null);
});
