import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    compareWorkflowSources,
    editReviewerGuard,
    workflowInputLimit,
    workflowOutcome,
    workflowRegressionExamples,
} from '../src/lib/tools/workflow-regression.ts';
import { workflowExample } from '../src/lib/tools/workflow-tester.ts';

const cases = workflowRegressionExamples(
    workflowExample(
        readFileSync(
            new URL(
                '../src/content/templates/03-state-machine-permission-matrix.md',
                import.meta.url,
            ),
            'utf8',
        ),
    ),
);

test('the same acceptance cases catch an accidentally allowed self-approval', () => {
    const { report } = compareWorkflowSources(cases);
    assert.equal(report.baselineFailures, 0);
    assert.equal(report.candidateFailures, 1);
    assert.equal(report.regressions, 1);
    const selfApproval = report.rows.find((row) => row.title === 'Self-approval is blocked');
    assert.deepEqual(workflowOutcome(selfApproval.baseline), selfApproval.expected);
    assert.deepEqual(workflowOutcome(selfApproval.candidate), {
        allowed: true,
        nextState: 'approved',
        auditEvent: 'approved',
    });
    assert.deepEqual(selfApproval.removedGuards, ['different_author']);
    assert.match(selfApproval.baseline.reason, /reviewer differs from the author/u);
    assert.equal(selfApproval.outcomeChanged, true);
    assert.equal(report.rows[0].candidatePassed, true);

    const candidate = editReviewerGuard(cases.candidate, true);
    const fixed = compareWorkflowSources({ ...cases, candidate }).report;
    assert.equal(fixed.candidateFailures, 0);
    assert.equal(fixed.regressions, 0);
});

test('the expectation is independent and a baseline failure is not labeled a regression', () => {
    const authored = JSON.parse(cases.suite);
    const selfApproval = authored.cases[1];
    selfApproval.expected.auditEvent = 'anything_else';

    const suite = JSON.stringify({ contractVersion: 1, cases: [selfApproval] });
    const { report } = compareWorkflowSources({ ...cases, suite });
    assert.equal(report.rows[0].expected.auditEvent, 'anything_else');
    assert.equal(report.baselineFailures, 1);
    assert.equal(report.candidateFailures, 1);
    assert.equal(report.regressions, 0);
});

test('comparison isolates document errors, handles a BOM, and bounds input size', () => {
    const result = compareWorkflowSources({ baseline: '{', candidate: '{}', suite: '{}' });
    assert.match(result.errors.baseline[0], /invalid JSON/u);
    assert.match(result.errors.candidate.join('\n'), /version/u);
    assert.match(result.errors.suite.join('\n'), /cases/u);
    assert.match(
        compareWorkflowSources({ ...cases, suite: ' '.repeat(workflowInputLimit + 1) }).errors
            .suite[0],
        /limit/u,
    );
    assert.equal(
        compareWorkflowSources({ ...cases, suite: '\uFEFF' + cases.suite }).report.regressions,
        1,
    );
});
