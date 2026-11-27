import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    evaluateWorkflow,
    readWorkflowContract,
    workflowExample,
    workflowMermaid,
} from '../src/lib/tools/workflow-tester.ts';

const example = workflowExample(
    readFileSync(
        new URL('../src/content/templates/03-state-machine-permission-matrix.md', import.meta.url),
        'utf8',
    ),
);

const request = {
    state: 'review',
    action: 'approve',
    role: 'reviewer',
    actor: 'maya',
    owner: 'amir',
    actorBranch: 'north',
    recordBranch: 'north',
    complete: true,
    returnReason: '',
    evidence: [],
};

test('the published approval contract allows a different in-branch reviewer', () => {
    const decision = evaluateWorkflow(example, request);
    assert.equal(decision.allowed, true);
    assert.equal(decision.nextState, 'approved');
    assert.equal(decision.auditEvent, 'approved');
    assert.deepEqual(
        decision.checks.map(({ passed }) => passed),
        [true, true],
    );
});

test('self-approval, branch mismatch and a blank return reason preserve state without an audit event', () => {
    const failedRequests = [
        [{ actor: request.owner }, 'different_author'],
        [{ actorBranch: 'south' }, 'same_branch'],
        [{ action: 'return', returnReason: '   ' }, 'return_reason'],
    ];
    for (const [changes, guard] of failedRequests) {
        const decision = evaluateWorkflow(example, { ...request, ...changes });
        assert.equal(decision.allowed, false);
        assert.equal(decision.nextState, 'review');
        assert.equal(decision.auditEvent, null);
        assert.equal(decision.checks.find(({ passed }) => !passed)?.guard, guard);
    }
    assert.equal(
        evaluateWorkflow(example, {
            ...request,
            action: 'return',
            returnReason: 'Missing attachment',
        }).auditEvent,
        'returned',
    );
});

test('unavailable actions and ineligible roles are denied before guard evaluation', () => {
    const missing = evaluateWorkflow(example, { ...request, state: 'approved' });
    const role = evaluateWorkflow(example, { ...request, role: 'author' });
    assert.match(missing.reason, /unavailable from "approved"/u);
    assert.match(role.reason, /Role "author" cannot run "approve"/u);
    assert.deepEqual(role.checks, []);
});

test('import flags bad references and ambiguous actions while warning on unreachable states', () => {
    const contract = structuredClone(example);
    contract.initial = 'incorrect';
    contract.transitions[0].to = 'nowhere';
    contract.transitions[0].roles = ['clerk'];
    contract.transitions.push(contract.transitions[0]);
    const invalid = readWorkflowContract(JSON.stringify(contract));
    assert.match(
        invalid.errors.join('\n'),
        /Initial state.*unknown state.*unknown role.*repeats action/su,
    );
    assert.ok(readWorkflowContract('{malformed').errors);

    const importable = readWorkflowContract(
        JSON.stringify({ ...example, states: [...example.states, 'retired'] }),
    );
    assert.equal(importable.contract?.initial, 'draft');
    assert.deepEqual(importable.warnings, ['State "retired" has no path from "draft".']);
    assert.deepEqual(readWorkflowContract(JSON.stringify(example)).contract, example);
});

test('unknown guards require explicit evidence and the Mermaid source retains each transition', () => {
    const custom = structuredClone(example);
    custom.transitions[2].requires.push('constructor');
    const missing = evaluateWorkflow(custom, request);
    const provided = evaluateWorkflow(custom, { ...request, evidence: ['constructor'] });
    assert.equal(missing.allowed, false);
    assert.equal(provided.allowed, true);
    assert.match(workflowMermaid(custom), /state "review" as state2.*state2 --> state3: approve/su);
});
