import fixture from '../../kit/modules/approval-api/traces/approval-api.json';

export interface TraceStep {
    id: string;
    title: string;
    detail: string;
    source: { path: string; line: number };
    data: unknown;
    code?: string;
}

export interface ApprovalScenario {
    id: 'concurrent-approval' | 'lost-response-retry';
    title: string;
    description: string;
    steps: TraceStep[];
    responses: { label: string; status: number; replayed: boolean }[];
    result: {
        state: string;
        version: number;
        approvalCount: number;
        auditEventCount: number;
    };
}

const prefix = '../../kit/modules/approval-api/';
const source = import.meta.glob<string>(
    '../../kit/modules/approval-api/{app/**/*.php,routes/*.php,tests/**/*.php,scripts/*.php}',
    { eager: true, query: '?raw', import: 'default' },
);

export const approvalRuntime = fixture.runtime;

export const approvalScenarios: ApprovalScenario[] = fixture.scenarios.map((scenario) => ({
    ...scenario,
    id: scenario.id as ApprovalScenario['id'],
    responses: scenario.steps.flatMap(({ id, data }) => {
        if (typeof data.status !== 'number') return [];
        return [
            {
                label: data.actor ?? (id === 'retry' ? 'Retried request' : 'Original request'),
                status: data.status,
                replayed: data.replayed === true,
            },
        ];
    }),
    steps: scenario.steps.map((step) => {
        const file = prefix + step.source.path.replace(/^kit\/modules\/approval-api\//, '');
        const lines = source[file]?.trimEnd().split(/\r?\n/);
        if (!lines || !lines[step.source.line - 1])
            throw new Error('Missing published source for approval trace step ' + step.id);
        const start = Math.max(step.source.line - 4, 0);
        return {
            ...step,
            code: lines
                .slice(start, step.source.line + 3)
                .map(
                    (line, offset) =>
                        (start + offset + 1 === step.source.line ? '› ' : '  ') +
                        String(start + offset + 1).padStart(3) +
                        '  ' +
                        line,
                )
                .join('\n'),
        };
    }),
}));

if (fixture.schemaVersion !== 1 || approvalScenarios.length !== 2)
    throw new Error('Expected both version 1 approval traces');
