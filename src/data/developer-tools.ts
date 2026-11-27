export const developerTools = [
    {
        id: 'request-trace',
        title: 'Request Debugger',
        description:
            'Replay two reviewers racing to approve the same request and trace the database writes.',
        keywords: [
            'laravel',
            'pest',
            'api',
            'race condition',
            'concurrency',
            'idempotency',
            'تصحيح',
        ],
    },
    {
        id: 'workflow-regression',
        title: 'Workflow Regression Lab',
        description: 'Run the same acceptance tests against two versions of an approval policy.',
        keywords: ['workflow', 'permissions', 'roles', 'ci', 'test', 'صلاحيات'],
    },
    {
        id: 'csv-test-packs',
        title: 'CSV Test Pack Builder',
        description:
            'Generate repeatable CSV edge cases and expected rows for your importer tests.',
        keywords: ['csv', 'fixtures', 'import', 'spreadsheet', 'pest', 'استيراد'],
    },
    {
        id: 'vault-install',
        title: 'Installable Vault Kits',
        description: 'Inspect the source and dependencies, then run a kit in a clean project.',
        keywords: ['install', 'registry', 'react', 'keyboard', 'saved views', 'مكونات'],
    },
    {
        id: 'sql',
        title: 'SQL Result Lab',
        description:
            'Run two SQLite queries side by side and trace an inflated total to its joined rows.',
        keywords: ['sqlite', 'query', 'database', 'join', 'sql', 'قاعدة بيانات'],
    },
    {
        id: 'stack-parity',
        title: 'Stack Parity Lab',
        description: 'Follow the same workflow test in React and Livewire and compare the results.',
        keywords: ['react', 'livewire', 'parity', 'compare', 'php', 'laravel', 'مقارنة'],
    },
] as const;

export const developerPath = (id: (typeof developerTools)[number]['id']) => `/developer/${id}/`;
