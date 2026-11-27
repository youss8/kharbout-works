import { z } from 'astro/zod';
import {
    evaluateWorkflow,
    readWorkflowContract,
    type WorkflowContract,
    type WorkflowDecision,
    type WorkflowRequest,
} from './workflow-tester.ts';

export const workflowInputLimit = 256 * 1024;

const expectedOutcome = z.strictObject({
    allowed: z.boolean(),
    nextState: z.string().min(1),
    auditEvent: z.string().min(1).nullable(),
});

const suiteSchema = z.strictObject({
    suiteVersion: z.literal(1).optional(),
    contractVersion: z.number().int().min(1).optional(),
    cases: z
        .array(
            z.strictObject({
                title: z.string().trim().min(1).max(120),
                request: z.strictObject({
                    state: z.string().min(1),
                    action: z.string().min(1),
                    role: z.string().min(1),
                    actor: z.string(),
                    owner: z.string(),
                    actorBranch: z.string(),
                    recordBranch: z.string(),
                    complete: z.boolean(),
                    returnReason: z.string(),
                    evidence: z.array(z.string()),
                }),
                expected: expectedOutcome,
            }),
        )
        .min(1)
        .max(100),
});

type WorkflowSuite = z.infer<typeof suiteSchema>;
type Outcome = z.infer<typeof expectedOutcome>;
export type WorkflowRegressionSource = 'baseline' | 'candidate' | 'suite';
export type WorkflowRegressionSources = Record<WorkflowRegressionSource, string>;

const review: WorkflowRequest = {
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

const blockedReview = { allowed: false, nextState: 'review', auditEvent: null };

const exampleSuite: WorkflowSuite = {
    suiteVersion: 1,
    cases: [
        {
            title: 'An independent reviewer approves',
            request: review,
            expected: { allowed: true, nextState: 'approved', auditEvent: 'approved' },
        },
        {
            title: 'Self-approval is blocked',
            request: { ...review, actor: review.owner },
            expected: blockedReview,
        },
        {
            title: 'Cross-branch approval is blocked',
            request: { ...review, actorBranch: 'south' },
            expected: blockedReview,
        },
        {
            title: 'Return requires a reason',
            request: { ...review, action: 'return' },
            expected: blockedReview,
        },
    ],
};

function approvalTransition(contract: WorkflowContract) {
    return contract.transitions.find(
        ({ from, action }) => from === 'review' && action === 'approve',
    );
}

const encoder = new TextEncoder();

function inputTooLarge(source: string) {
    return (
        source.length > workflowInputLimit || encoder.encode(source).byteLength > workflowInputLimit
    );
}

export function editReviewerGuard(source: string, required: boolean): string | null {
    if (inputTooLarge(source)) return null;
    const { contract } = readWorkflowContract(source);
    if (!contract) return null;
    const approval = approvalTransition(contract);
    if (!approval) return null;
    if (approval.requires.includes('different_author') === required) return source;
    const remaining = approval.requires.filter((guard) => guard !== 'different_author');
    const requires = required ? [...remaining, 'different_author'] : remaining;
    return JSON.stringify(
        {
            ...contract,
            transitions: contract.transitions.map((transition) =>
                transition === approval ? { ...transition, requires } : transition,
            ),
        },
        null,
        2,
    );
}

export function workflowRegressionExamples(baseline: WorkflowContract): WorkflowRegressionSources {
    const candidate = editReviewerGuard(
        JSON.stringify({ ...baseline, version: baseline.version + 1 }),
        false,
    );
    if (!candidate)
        throw new Error('The workflow regression example requires an approval transition.');
    return {
        baseline: JSON.stringify(baseline, null, 2),
        candidate,
        suite: JSON.stringify(exampleSuite, null, 2),
    };
}

function readSuite(source: string) {
    let value: unknown;
    try {
        value = JSON.parse(source);
    } catch {
        return { errors: ['The acceptance suite contains invalid JSON.'] } as const;
    }
    const result = suiteSchema.safeParse(value);
    if (!result.success) {
        return {
            errors: result.error.issues.map(
                ({ path, message }) => `${path.length ? path.join('.') : 'Suite'} — ${message}`,
            ),
        } as const;
    }
    return { suite: result.data } as const;
}

export function workflowOutcome({ allowed, nextState, auditEvent }: WorkflowDecision): Outcome {
    return { allowed, nextState, auditEvent };
}

function sameOutcome(first: Outcome, second: Outcome) {
    return (
        first.allowed === second.allowed &&
        first.nextState === second.nextState &&
        first.auditEvent === second.auditEvent
    );
}

function transitionGuards(contract: WorkflowContract, request: WorkflowRequest) {
    return (
        contract.transitions.find(
            ({ from, action }) => from === request.state && action === request.action,
        )?.requires ?? []
    );
}

export function compareWorkflowSources(sources: WorkflowRegressionSources) {
    const cleaned = Object.fromEntries(
        Object.entries(sources).map(([key, value]) => [key, value.replace(/^\uFEFF/u, '')]),
    ) as WorkflowRegressionSources;
    const tooLarge = ['This input exceeds the 256 KB limit.'];
    const baseline = inputTooLarge(cleaned.baseline)
        ? { errors: tooLarge }
        : readWorkflowContract(cleaned.baseline);
    const candidate = inputTooLarge(cleaned.candidate)
        ? { errors: tooLarge }
        : readWorkflowContract(cleaned.candidate);
    const suite = inputTooLarge(cleaned.suite) ? { errors: tooLarge } : readSuite(cleaned.suite);
    if (baseline.errors || candidate.errors || suite.errors) {
        return {
            errors: {
                baseline: baseline.errors ?? [],
                candidate: candidate.errors ?? [],
                suite: suite.errors ?? [],
            },
        } as const;
    }

    const original = baseline.contract;
    const proposed = candidate.contract;
    const rows = suite.suite.cases.map(({ title, request, expected }) => {
        const baselineDecision = evaluateWorkflow(original, request);
        const candidateDecision = evaluateWorkflow(proposed, request);
        const baselineGuards = transitionGuards(original, request);
        const candidateGuards = transitionGuards(proposed, request);
        return {
            title,
            request,
            expected,
            baseline: baselineDecision,
            candidate: candidateDecision,
            baselinePassed: sameOutcome(baselineDecision, expected),
            candidatePassed: sameOutcome(candidateDecision, expected),
            outcomeChanged: !sameOutcome(baselineDecision, candidateDecision),
            removedGuards: baselineGuards.filter((guard) => !candidateGuards.includes(guard)),
            addedGuards: candidateGuards.filter((guard) => !baselineGuards.includes(guard)),
        };
    });
    return {
        report: {
            baselineVersion: original.version,
            candidateVersion: proposed.version,
            baselineWarnings: baseline.warnings,
            candidateWarnings: candidate.warnings,
            baselineFailures: rows.filter((row) => !row.baselinePassed).length,
            candidateFailures: rows.filter((row) => !row.candidatePassed).length,
            regressions: rows.filter((row) => row.baselinePassed && !row.candidatePassed).length,
            rows,
        },
    } as const;
}

export type WorkflowRegressionComparison = ReturnType<typeof compareWorkflowSources>;
export type WorkflowRegressionReport = NonNullable<WorkflowRegressionComparison['report']>;
