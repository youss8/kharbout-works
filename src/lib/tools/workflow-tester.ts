import { z } from 'astro/zod';

const name = z.string().regex(/^[a-z][a-z0-9_]*$/u, 'Use a lowercase workflow identifier.');
const names = z.array(name).refine((items) => new Set(items).size === items.length, {
    message: 'Identifiers must be unique.',
});

const transitionSchema = z.strictObject({
    from: name,
    to: name,
    action: name,
    roles: names.min(1),
    requires: names,
    auditEvent: name,
});

const contractSchema = z.strictObject({
    version: z.number().int().min(1),
    initial: name,
    states: names.min(1),
    roles: names.min(1),
    transitions: z.array(transitionSchema).min(1),
});

export type WorkflowContract = z.infer<typeof contractSchema>;

export interface WorkflowRequest {
    state: string;
    action: string;
    role: string;
    actor: string;
    owner: string;
    actorBranch: string;
    recordBranch: string;
    complete: boolean;
    returnReason: string;
    evidence: string[];
}

interface GuardCheck {
    guard: string;
    passed: boolean;
    reason: string;
}

export interface WorkflowDecision {
    allowed: boolean;
    nextState: string;
    auditEvent: string | null;
    reason: string;
    checks: GuardCheck[];
}

type ContractCheck =
    | { contract: WorkflowContract; warnings: string[]; errors?: never }
    | { contract?: never; warnings?: never; errors: string[] };

export function readWorkflowContract(source: string): ContractCheck {
    let value: unknown;
    try {
        value = JSON.parse(source);
    } catch {
        return {
            errors: ['The contract contains invalid JSON. Check the braces, quotes, and commas.'],
        };
    }

    const shape = contractSchema.safeParse(value);
    if (!shape.success) {
        return {
            errors: shape.error.issues.map(({ path, message }) => {
                const location = path.length ? path.join('.') : 'Contract';
                return `${location} — ${message}`;
            }),
        };
    }

    const contract = shape.data;
    const errors: string[] = [];
    const states = new Set(contract.states);
    const roles = new Set(contract.roles);
    const actions = new Set<string>();
    const outgoing = new Map<string, string[]>();
    if (!states.has(contract.initial)) {
        errors.push(`Initial state "${contract.initial}" is missing from states.`);
    }

    for (const [index, transition] of contract.transitions.entries()) {
        const row = `Transition ${index + 1}`;
        const actionKey = `${transition.from}:${transition.action}`;
        if (actions.has(actionKey)) {
            errors.push(`${row} repeats action "${transition.action}" from "${transition.from}".`);
        }
        actions.add(actionKey);
        if (!states.has(transition.from))
            errors.push(`${row} starts from an unknown state "${transition.from}".`);
        if (!states.has(transition.to))
            errors.push(`${row} targets an unknown state "${transition.to}".`);
        for (const role of transition.roles) {
            if (!roles.has(role)) errors.push(`${row} references an unknown role "${role}".`);
        }
        const targets = outgoing.get(transition.from) ?? [];
        targets.push(transition.to);
        outgoing.set(transition.from, targets);
    }
    if (errors.length) return { errors };

    const reachable = new Set([contract.initial]);
    for (const state of reachable) {
        for (const target of outgoing.get(state) ?? []) reachable.add(target);
    }
    const warnings = contract.states
        .filter((state) => !reachable.has(state))
        .map((state) => `State "${state}" has no path from "${contract.initial}".`);
    return { contract, warnings };
}

export function workflowExample(body: string): WorkflowContract {
    const source = body.match(/### Machine-readable instance\s+```json\s+([\s\S]*?)```/u)?.[1];
    if (!source) throw new Error('The permission matrix template is missing its JSON example.');
    const result = readWorkflowContract(source);
    if (result.errors) throw new Error(result.errors.join('\n'));
    return result.contract;
}

export const workflowGuardLabels: Readonly<Record<string, string>> = {
    owns_record: 'The actor owns the record',
    complete: 'Required fields are complete',
    same_branch: 'The actor and record belong to the same branch',
    return_reason: 'A return reason is provided',
    different_author: 'The reviewer differs from the author',
};

function relationship(first: string, second: string, expectMatch: boolean) {
    return (
        Boolean(first.trim() && second.trim()) && (first.trim() === second.trim()) === expectMatch
    );
}

function checkGuard(guard: string, request: WorkflowRequest): GuardCheck {
    const facts: Record<string, boolean> = {
        owns_record: relationship(request.actor, request.owner, true),
        complete: request.complete,
        same_branch: relationship(request.actorBranch, request.recordBranch, true),
        return_reason: Boolean(request.returnReason.trim()),
        different_author: relationship(request.actor, request.owner, false),
    };

    return Object.hasOwn(facts, guard)
        ? { guard, passed: facts[guard], reason: workflowGuardLabels[guard] }
        : {
              guard,
              passed: request.evidence.includes(guard),
              reason: `Evidence provided for "${guard}"`,
          };
}

export function evaluateWorkflow(
    contract: WorkflowContract,
    request: WorkflowRequest,
): WorkflowDecision {
    const denied = {
        allowed: false,
        nextState: request.state,
        auditEvent: null,
        checks: [],
    };
    if (!contract.states.includes(request.state)) {
        return { ...denied, reason: `State "${request.state}" is missing from the contract.` };
    }
    if (!contract.roles.includes(request.role)) {
        return { ...denied, reason: `Role "${request.role}" is missing from the contract.` };
    }

    const transition = contract.transitions.find(
        ({ from, action }) => from === request.state && action === request.action,
    );
    if (!transition) {
        return { ...denied, reason: `"${request.action}" is unavailable from "${request.state}".` };
    }
    if (!transition.roles.includes(request.role)) {
        return { ...denied, reason: `Role "${request.role}" cannot run "${request.action}".` };
    }

    const checks = transition.requires.map((guard) => checkGuard(guard, request));
    const failed = checks.find(({ passed }) => !passed);
    if (failed) {
        return { ...denied, checks, reason: `Guard failed: ${failed.reason}.` };
    }
    return {
        allowed: true,
        nextState: transition.to,
        auditEvent: transition.auditEvent,
        reason: checks.length
            ? 'The role is eligible and every required guard passes.'
            : 'The role is eligible. This action has no additional guards.',
        checks,
    };
}

export function workflowMermaid(contract: WorkflowContract) {
    const states = new Map(contract.states.map((state, index) => [state, `state${index + 1}`]));
    return [
        'stateDiagram-v2',
        ...Array.from(states, ([name, id]) => `    state "${name}" as ${id}`),
        `    [*] --> ${states.get(contract.initial)}`,
        ...contract.transitions.map(
            ({ from, to, action }) => `    ${states.get(from)} --> ${states.get(to)}: ${action}`,
        ),
        '',
    ].join('\n');
}
