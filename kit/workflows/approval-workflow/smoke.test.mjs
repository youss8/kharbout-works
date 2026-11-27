import assert from 'node:assert/strict';
import test from 'node:test';
import {
    actors,
    availableActions,
    canRead,
    needsAttention,
    requests,
    transition,
} from './workflow.mjs';

const [author, reviewer, otherBranch] = actors;
const [draft, pending, ownRequest] = requests;

test('the author submits and a different reviewer approves with two audit entries', () => {
    const submitted = transition(draft, author, 'submit', 1).updated;
    assert.equal(submitted.state, 'review');
    assert.equal(submitted.version, 2);
    const approved = transition(submitted, reviewer, 'approve', 2).updated;
    assert.equal(approved.state, 'approved');
    assert.equal(approved.version, 3);
    assert.deepEqual(
        approved.history.map((event) => event.type),
        ['submitted', 'approved'],
    );
    assert.deepEqual(availableActions(approved, reviewer), []);
    assert.equal(needsAttention(approved, reviewer), false);
    assert.match(transition(approved, reviewer, 'approve', 2).message, /changed/);
});

test('scope limits record visibility, inbox membership, and transitions', () => {
    assert.equal(canRead(pending, otherBranch), false);
    assert.equal(canRead(ownRequest, author), false);
    assert.equal(needsAttention(pending, reviewer), true);
    assert.equal(needsAttention(ownRequest, reviewer), false);
    assert.deepEqual(availableActions(pending, otherBranch), []);
    assert.match(transition(pending, otherBranch, 'approve', 1).message, /outside/);
});

test('self-approval, incomplete submission and a reasonless return cannot write events', () => {
    const self = transition(ownRequest, reviewer, 'approve', 1);
    assert.equal(self.updated, null);
    assert.match(self.message, /own request/);
    assert.match(
        transition({ ...draft, complete: false }, author, 'submit', 1).message,
        /required fields/,
    );
    assert.match(transition(pending, reviewer, 'return', 1, '  ').message, /Add a return reason/);
    const returned = transition(pending, reviewer, 'return', 1, '  Add the quote  ').updated;
    assert.equal(returned.state, 'draft');
    assert.equal(returned.history[0].reason, 'Add the quote');
    assert.deepEqual(pending.history, []);
});
