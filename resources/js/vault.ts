import type { Locale } from './i18n';

export const workflowPlatforms = ['claude', 'gemini', 'codex', 'multi-agent'] as const;

export type WorkflowPlatform = (typeof workflowPlatforms)[number];
type WorkflowStatus = 'planned' | 'example-tested';

export type WorkflowVariable = {
    name: string;
    label: string;
    example: string;
    multiline: boolean;
};

export type Workflow = {
    id: string;
    title: string;
    summary: string;
    platform: WorkflowPlatform;
    status: WorkflowStatus;
    tags: string[];
    template: string;
    variables: WorkflowVariable[];
    sampleOutput: { before: string; after: string };
    setup: [string, string];
};

export type PromptSegment =
    { type: 'text'; text: string } | { type: 'variable'; name: string; token: string };

const platformLabels: Record<WorkflowPlatform, Record<Locale, string>> = {
    claude: { en: 'Claude Skills', de: 'Claude Skills', ar: 'مهارات Claude' },
    gemini: {
        en: 'Gemini Gems & Skills',
        de: 'Gemini Gems und Skills',
        ar: 'أدوات Gemini ومهاراته',
    },
    codex: { en: 'Codex CLI', de: 'Codex CLI', ar: 'سطر أوامر Codex' },
    'multi-agent': { en: 'Multi-agent', de: 'Mehrere Agenten', ar: 'وكلاء متعددون' },
};

export function workflowPlatformLabel(platform: WorkflowPlatform, locale: Locale) {
    return platformLabels[platform][locale];
}

const statusLabels: Record<WorkflowStatus, Record<Locale, string>> = {
    planned: { en: 'Planned', de: 'Geplant', ar: 'مخطط له' },
    'example-tested': { en: 'Example tested', de: 'Beispiel getestet', ar: 'تم اختبار المثال' },
};

export function workflowStatusLabel(status: WorkflowStatus, locale: Locale) {
    return statusLabels[status][locale];
}

function searchable(text: string) {
    return text
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .replace(/[-‐‑–—]/g, ' ')
        .toLowerCase();
}

export function searchWorkflows(workflows: readonly Workflow[], query: string, locale: Locale) {
    const terms = query.trim().split(/\s+/).filter(Boolean).map(searchable);

    return workflows.filter((workflow) => {
        const tags = workflow.tags.map(searchable);
        const text = searchable(
            [
                workflow.title,
                workflow.summary,
                workflow.platform,
                workflowPlatformLabel(workflow.platform, 'en'),
                workflowPlatformLabel(workflow.platform, locale),
                ...workflow.tags,
            ].join(' '),
        );

        return terms.every((term) =>
            term.startsWith('#')
                ? tags.some((tag) => tag.startsWith(term.slice(1)))
                : text.includes(term),
        );
    });
}

export function parsePrompt(
    template: string,
    variables: readonly WorkflowVariable[],
): PromptSegment[] {
    const declared = new Set(variables.map((variable) => variable.name));
    const segments: PromptSegment[] = [];
    let offset = 0;

    for (const match of template.matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}|\[([A-Z][A-Z0-9_]*)\]/g)) {
        const [token, canonical, alias] = match;
        // Bracketed names need a declaration to distinguish them from Markdown labels.
        if (!canonical && !declared.has(alias)) continue;

        if (match.index > offset) {
            segments.push({ type: 'text', text: template.slice(offset, match.index) });
        }

        segments.push({ type: 'variable', name: canonical ?? alias, token });
        offset = match.index + token.length;
    }

    if (offset < template.length) {
        segments.push({ type: 'text', text: template.slice(offset) });
    }

    return segments;
}

export function compilePrompt(
    segments: readonly PromptSegment[],
    values: Readonly<Record<string, string>>,
) {
    const parts = segments.map((segment) => {
        if (segment.type === 'text') return { text: segment.text, changed: false };

        const value = values[segment.name];
        return value?.trim()
            ? { text: value, changed: value !== segment.token }
            : { text: segment.token, changed: false };
    });

    return { text: parts.map((part) => part.text).join(''), parts };
}
