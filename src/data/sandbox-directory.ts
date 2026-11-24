export const sandboxTitles: Record<string, string> = {
    'service-desk': 'SLA-driven service desk',
    'estate-overview': 'Estate and endpoint monitor',
    'leave-engine': 'Leave pricing and two-tier approval desk',
    'attendance-amend': 'Attendance month and signed contract diff',
    'kpi-cockpit': 'KPI performance and pooled ratios',
    'funding-flow': 'Funding flow and agreement health',
};

export interface SandboxChallenge {
    title: string;
    instructions: string;
    expected: string;
    reference: { label: string; href: string; summary: string };
}

export const sandboxChallenges: Record<string, SandboxChallenge> = {
    'leave-engine': {
        title: 'Quote a leave request before submitting it',
        instructions: 'Keep the Employee role and the default dates. In the request composer, change Part of day from Full day to AM.',
        expected: 'Quoted hours drop from 16h to 8h. The holiday and weekend still appear in the day-by-day quote.',
        reference: {
            label: 'Leave pricing and approval rules',
            href: '#modeling',
            summary: 'The case study shows how one quote is used for preview, reservation and approval. A decision uses the hours originally quoted for the request.',
        },
    },
    'attendance-amend': {
        title: 'Clear the exceptions before confirming a month',
        instructions: 'In Attendance month, resolve 3 November as Worked Full and 9 November as Half Day.',
        expected: 'Employee confirm becomes available after both exceptions are resolved.',
        reference: {
            label: 'Timesheet and scheduling state machines',
            href: '/vault/#gantt-and-timesheet-machines',
            summary: 'The Vault shows a reusable monthly timesheet with state transitions and approval receipts, alongside a separate scheduling example.',
        },
    },
    'kpi-cockpit': {
        title: 'Compare two ways of combining site results',
        instructions: 'Use the default EMP-02 indicator and YTD period. In the KPI inspector, change Rollup method from Pooled ratio to Naive average.',
        expected: 'The result changes from 67.8% to 59.6%. Switch back to see the pooled calculation of 61 out of 90.',
        reference: {
            label: 'Pooled KPI calculation',
            href: '#modeling',
            summary: 'The pooled rate divides the sum of reporting numerators by the sum of reporting denominators. Sites missing a denominator are excluded.',
        },
    },
    'funding-flow': {
        title: 'Record a tranche and see agreement health update',
        instructions: 'Open Inspect FA-01, then choose Mark Tranche Received.',
        expected: 'FA-01 becomes On Track and shows USD 300,000 received. The EUR total stays the same.',
        reference: {
            label: 'Funding Sankey by currency',
            href: '/vault/#html-svg-sankey-flow',
            summary: 'The reusable diagram traces funding from sponsor to proposal to project with separate amounts for each currency.',
        },
    },
};

export const securitySummaries: Record<string, string> = {
    'SYS-01': 'Row-level security on all 47 tables, column grants and immutable revision history.',
    'SYS-02': 'Branch and reporting-line scopes, record policies and a dedicated encryption key for pay tiers.',
    'SYS-03': 'Position-aware permissions, field-level finance controls and a read-only HRIS connection.',
};
