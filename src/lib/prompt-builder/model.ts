import { parsePromptTemplate, renderPromptTemplate } from '../prompt-template.ts';
import { isModelProfile, modelProfile, type ModelProfileId } from './profiles.ts';
import { chains, findWorkflow, l, type Locale } from './workflows.ts';

export const variants = ['concise', 'detailed'] as const;
export type Variant = (typeof variants)[number];
export const tones = {
    neutral: l('Neutral', 'محايدة'),
    friendly: l('Friendly', 'ودّية'),
    formal: l('Formal', 'رسمية'),
    direct: l('Direct', 'مباشرة'),
};
export const formats = {
    default: l('Workflow default', 'التنسيق الافتراضي'),
    bullets: l('Bulleted list', 'قائمة نقطية'),
    table: l('Table', 'جدول'),
    prose: l('Prose', 'نص متصل'),
    json: l('JSON object', 'كائن JSON'),
};

export const maxFieldLength = 8_000;
export const maxPromptLength = 40_000;
// Version one permits up to 438,500 UTF-16 units across fields, edits and runs.
// Even six-byte JSON escapes and indentation fit in this backup envelope.
export const maxImportBytes = 4 * 1024 * 1024;
export const maxSavedRuns = 4;
export const maxPromptExtraLength = 2_000;

export interface Draft {
    version: 1;
    workflowId: string;
    workflowVersion: 1;
    values: Record<string, string>;
    preferences: {
        audience: string;
        tone: keyof typeof tones;
        format: keyof typeof formats;
        outputLocale: Locale;
        target: 'chat' | 'coding';
        profile: ModelProfileId;
        sources: string;
        criteria: string;
        example: string;
    };
    edits: Partial<Record<Variant, string>>;
    chain: { id: string; step: number } | null;
    runs: { prompt: string; result: string }[];
}

export function newDraft(workflowId = 'blank', outputLocale: Locale = 'en'): Draft {
    return {
        version: 1,
        workflowId,
        workflowVersion: 1,
        values: {},
        preferences: {
            audience: '',
            tone: 'neutral',
            format: 'default',
            outputLocale,
            target: 'chat',
            profile: 'universal',
            sources: '',
            criteria: '',
            example: '',
        },
        edits: {},
        chain: null,
        runs: [],
    };
}

const promptLabels = {
    task: l('Task', 'المهمة'),
    context: l('Provided context', 'السياق المقدَّم'),
    requirements: l('Response requirements', 'متطلبات الرد'),
    goal: l('Goal', 'الهدف'),
    expectations: l('Expectations', 'النتيجة المتوقعة'),
    sources: l('Sources', 'المصادر'),
    criteria: l('Acceptance criteria', 'معايير القبول'),
    example: l('Response example', 'مثال على الرد'),
    audience: l('Audience', 'الجمهور'),
    tone: l('Tone', 'النبرة'),
    format: l('Answer format', 'تنسيق الرد'),
    language: l('Write the response in English.', 'اكتب الرد باللغة العربية.'),
    concise: l('Keep the response concise.', 'اجعل الرد موجزًا.'),
    detailed: l('Give a detailed, structured response.', 'قدِّم ردًا منظّمًا ومفصّلًا.'),
    missing: l(
        'Ask a focused question or mark as unknown:',
        'اطرح سؤالًا محددًا أو وضّح أن المعلومات غير معروفة:',
    ),
    coding: l(
        'When citing source, name known files or symbols. Report which checks you actually ran and list any suggested checks separately.',
        'عند الاستشهاد بالشيفرة، اذكر الملفات أو الرموز المعروفة. اذكر الفحوص التي أجريتها بالفعل وافصلها عن الفحوص المقترحة.',
    ),
    source: l(
        'Use the supplied context as source material. Flag any assumptions.',
        'استخدم السياق المقدَّم كمادة مرجعية ووضّح أي افتراضات.',
    ),
    sourceAccess: l(
        'Use the listed sources where accessible. State which requested sources you could not access.',
        'استخدم المصادر المدرجة حيثما أمكن الوصول إليها. اذكر المصادر المطلوبة التي تعذّر الوصول إليها.',
    ),
    exampleReference: l(
        'Use the example as a guide to the response format.',
        'استخدم المثال دليلًا على تنسيق الرد.',
    ),
    json: l(
        'Return a single valid JSON object as the entire response, without a code fence.',
        'اجعل الرد كاملًا كائن JSON صالحًا واحدًا دون إطار شيفرة.',
    ),
};

const standardOrder = [
    'task',
    'context',
    'sources',
    'requirements',
    'criteria',
    'example',
] as const;
const sectionOrder = {
    standard: standardOrder,
    'output-first': ['task', 'requirements', 'criteria', 'context', 'sources', 'example'],
    'query-last': ['requirements', 'criteria', 'context', 'sources', 'example', 'task'],
    xml: standardOrder,
    copilot: standardOrder,
} satisfies Record<
    ReturnType<typeof modelProfile>['layout'],
    readonly (typeof standardOrder)[number][]
>;

export function invalidResponseExample(preferences: Draft['preferences']): boolean {
    if (preferences.format !== 'json' || !preferences.example.trim()) return false;
    try {
        return !record(JSON.parse(preferences.example));
    } catch {
        return true;
    }
}

function xmlText(text: string): string {
    return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function compilePrompt(draft: Draft, variant: Variant): string {
    const workflow = findWorkflow(draft.workflowId);
    if (!workflow) return '';
    const preferences = draft.preferences;
    const profile = modelProfile(preferences.profile);
    const locale = preferences.outputLocale;
    const label = (key: keyof typeof promptLabels) => promptLabels[key][locale];
    const values = Object.fromEntries(
        workflow.fields.flatMap((field) => {
            const value = draft.values[field.key];
            return value?.trim() ? [[field.key, value.trim()]] : [];
        }),
    );
    const fields = workflow.fields.filter((field) => Object.hasOwn(values, field.key));
    const missing = workflow.fields.filter(
        (field) => field.required && !Object.hasOwn(values, field.key),
    );
    const xml = profile.layout === 'xml';
    const copilot = profile.layout === 'copilot';
    const codingTask =
        preferences.target === 'coding' ||
        workflow.group === 'engineering' ||
        workflow.id === 'verification-checklist';
    const sources = preferences.sources.trim();
    const criteria = preferences.criteria.trim();
    const example = invalidResponseExample(preferences) ? '' : preferences.example.trim();
    const requirements = [
        label('language'),
        label(variant),
        label('source'),
        preferences.audience.trim() ? `${label('audience')}: {{AUDIENCE}}` : '',
        `${label('tone')}: ${tones[preferences.tone][locale]}`,
        preferences.format !== 'default' && preferences.format !== 'json'
            ? `${label('format')}: ${formats[preferences.format][locale]}`
            : '',
        preferences.format === 'json' ? label('json') : '',
        preferences.target === 'coding' || (profile.coding && codingTask) ? label('coding') : '',
        !profile.coding || codingTask ? profile.rule?.[locale] : '',
        sources && !copilot ? label('sourceAccess') : '',
        example ? label('exampleReference') : '',
        missing.length
            ? `${label('missing')} ${missing.map((field) => field.label[locale]).join(locale === 'ar' ? '، ' : ', ')}.`
            : '',
        ...(variant === 'detailed' ? workflow.checks.map((check) => check[locale] + '.') : []),
    ]
        .filter(Boolean)
        .map((line) => '- ' + line)
        .join('\n');
    const plainContext = fields
        .map((field) => `### ${field.label[locale]}\n{{${field.key}}}`)
        .join('\n\n');
    const xmlContext = fields
        .map(
            (field) =>
                `<${field.key.toLowerCase()}>\n${field.label[locale]}\n{{${field.key}}}\n</${field.key.toLowerCase()}>`,
        )
        .join('\n');
    const sections = {
        task: { text: workflow.instruction[locale], title: label(copilot ? 'goal' : 'task') },
        context: { text: xml ? xmlContext : plainContext, title: label('context') },
        sources: { text: sources ? '{{BUILDER_SOURCES}}' : '', title: label('sources') },
        requirements: {
            text: requirements,
            title: label(copilot ? 'expectations' : 'requirements'),
        },
        criteria: { text: criteria ? '{{BUILDER_CRITERIA}}' : '', title: label('criteria') },
        example: { text: example ? '{{BUILDER_EXAMPLE}}' : '', title: label('example') },
    };
    const template = sectionOrder[profile.layout]
        .flatMap((id) => {
            const { text, title } = sections[id];
            if (!text) return [];
            return xml ? [`<${id}>\n${text}\n</${id}>`] : [`## ${title}\n${text}`];
        })
        .join('\n\n');
    if (preferences.audience.trim()) values.AUDIENCE = preferences.audience.trim();
    if (sources) values.BUILDER_SOURCES = sources;
    if (criteria) values.BUILDER_CRITERIA = criteria;
    if (example) values.BUILDER_EXAMPLE = example;
    if (xml) {
        for (const key of Object.keys(values)) values[key] = xmlText(values[key]);
    }
    return renderPromptTemplate(
        parsePromptTemplate(template, Object.keys(values), workflow.id),
        values,
    );
}

export const visiblePrompt = (draft: Draft, variant: Variant) =>
    draft.edits[variant] ?? compilePrompt(draft, variant);

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function boundedString(value: unknown, length: number): value is string {
    return typeof value === 'string' && value.length <= length;
}

export function readDraft(value: unknown): Draft | null {
    if (!record(value) || value.version !== 1 || typeof value.workflowId !== 'string') return null;
    const workflow = findWorkflow(value.workflowId);
    if (!workflow || workflow.version !== value.workflowVersion) return null;
    const { values, preferences, edits, runs, chain } = value;
    if (!record(values) || !record(preferences) || !record(edits) || !Array.isArray(runs))
        return null;
    if (
        !boundedString(preferences.audience, 500) ||
        typeof preferences.tone !== 'string' ||
        !Object.hasOwn(tones, preferences.tone) ||
        typeof preferences.format !== 'string' ||
        !Object.hasOwn(formats, preferences.format) ||
        (preferences.outputLocale !== 'en' && preferences.outputLocale !== 'ar') ||
        (preferences.target !== 'chat' && preferences.target !== 'coding') ||
        (preferences.profile !== undefined && !isModelProfile(preferences.profile)) ||
        (preferences.sources !== undefined &&
            !boundedString(preferences.sources, maxPromptExtraLength)) ||
        (preferences.criteria !== undefined &&
            !boundedString(preferences.criteria, maxPromptExtraLength)) ||
        (preferences.example !== undefined &&
            !boundedString(preferences.example, maxPromptExtraLength))
    )
        return null;

    const draft = newDraft(workflow.id, preferences.outputLocale);
    draft.preferences = {
        audience: preferences.audience,
        tone: preferences.tone as keyof typeof tones,
        format: preferences.format as keyof typeof formats,
        target: preferences.target,
        outputLocale: preferences.outputLocale,
        profile: preferences.profile ?? 'universal',
        sources: preferences.sources ?? '',
        criteria: preferences.criteria ?? '',
        example: preferences.example ?? '',
    };
    if (Object.keys(values).some((key) => !workflow.fields.some((field) => field.key === key)))
        return null;
    for (const { key } of workflow.fields) {
        if (!Object.hasOwn(values, key)) continue;
        const answer = values[key];
        if (!boundedString(answer, maxFieldLength)) return null;
        draft.values[key] = answer;
    }
    if (Object.keys(edits).some((key) => key !== 'concise' && key !== 'detailed')) return null;
    for (const variant of variants) {
        if (!Object.hasOwn(edits, variant)) continue;
        const text = edits[variant];
        if (!boundedString(text, maxPromptLength)) return null;
        draft.edits[variant] = text;
    }
    if (runs.length > maxSavedRuns) return null;
    for (const run of runs) {
        if (
            !record(run) ||
            !boundedString(run.prompt, maxPromptLength) ||
            !boundedString(run.result, maxPromptLength)
        )
            return null;
        draft.runs.push({ prompt: run.prompt, result: run.result });
    }
    if (chain !== null) {
        if (
            !record(chain) ||
            typeof chain.id !== 'string' ||
            typeof chain.step !== 'number' ||
            !Number.isInteger(chain.step)
        )
            return null;
        const definition = chains.find((item) => item.id === chain.id);
        if (definition?.steps[chain.step] !== workflow.id) return null;
        draft.chain = { id: chain.id, step: chain.step };
    }
    return draft;
}

export function handoffContext(draft: Draft): string {
    const workflow = findWorkflow(draft.workflowId);
    return (workflow?.fields ?? [])
        .flatMap((field) => {
            const text = draft.values[field.key]?.trim();
            return text ? [`${field.label[draft.preferences.outputLocale]}\n${text}`] : [];
        })
        .join('\n\n');
}

export function advanceChain(draft: Draft, handoff: string, goal: string): Draft | null {
    if (!draft.chain || !handoff.trim() || handoff.length > maxFieldLength) return null;
    const { id, step } = draft.chain;
    const chain = chains.find((item) => item.id === id);
    const next = chain?.steps[step + 1];
    if (!next) return null;
    const nextDraft = newDraft(next);
    nextDraft.preferences = { ...draft.preferences, sources: '', criteria: '', example: '' };
    nextDraft.chain = { id, step: step + 1 };
    const firstStepOfBugChain = id === 'bug-fix' && step === 0;
    nextDraft.values[chain.carry[step]] = handoff;
    if (firstStepOfBugChain && goal.trim() && goal.length <= maxFieldLength)
        nextDraft.values.GOAL = goal;
    return nextDraft;
}
