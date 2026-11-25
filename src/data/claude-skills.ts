import { z } from 'astro/zod';
import { createHash } from 'node:crypto';
import deliveryRecords from './claude-skill-delivery.json';
import discoveryReport from './claude-skill-discovery.json';
import { portableSkillHosts, portableSkillSlugs, publisherCompatibility, publisherCompatibilityNotes } from './claude-skill-compatibility';
import { adapterName, guideHeader } from '../lib/claude-skill-exports';

const text = z.string().trim().min(1);
const sourceUrl = z.url().startsWith('https://');
const delivery = z.record(z.string(), z.object({
    method: z.enum(['skill-file', 'collection', 'plugin', 'native', 'archive', 'installer']),
    label: text, url: sourceUrl, note: text.optional(),
    packageUrl: sourceUrl.optional(), packageLabel: text.optional(), repositoryZip: sourceUrl.optional(),
}).refine(item => Boolean(item.packageUrl) === Boolean(item.packageLabel), 'A package link needs a URL and a label.')).parse(deliveryRecords);

export const evidenceLabels = {
    verified: 'Example passed',
    publisher: 'Publisher lists support',
    directory: 'Directory lists support',
    format: 'Standard format',
    guide: 'Guide only',
} as const;
type Compatibility = { agent: string; level: keyof typeof evidenceLabels; source: string };
const formatSkills = new Set(portableSkillSlugs);
const checkedHeaders: Record<string, string> = discoveryReport.headers;
const entry = z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: text,
    kind: text,
    aliases: z.array(text),
    description: text,
    requirements: text,
    steps: z.array(text).min(2),
    example: text,
    check: text,
    exampleRun: z.object({
        agent: text, version: text, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        source: sourceUrl, sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
        messages: z.array(text).nonempty(), result: text,
    }).optional(),
    toolCheck: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        result: text,
    }).optional(),
    source: sourceUrl,
    upstream: sourceUrl.optional(),
    listing: z.object({
        version: text.optional(),
        updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        platforms: z.array(text).nonempty().optional(),
        level: text.optional(),
        author: text.optional(),
    }).optional(),
    related: z.array(text).default([]),
});

const files = import.meta.glob<unknown>('./claude-skills/*.json', { eager: true, import: 'default' });
const categories = [
    ['design', 'Design'],
    ['branding', 'Branding'],
    ['product', 'Product'],
    ['visual', 'Visual'],
    ['ai-automation', 'AI & automation'],
    ['development', 'Development & code'],
    ['content-marketing', 'Content & marketing'],
    ['office-data', 'Office & data'],
    ['collections-tools', 'Collections & tools'],
] as const;

function withAgentSupport(guide: z.infer<typeof entry>) {
    const hosts = new Map<string, Compatibility>();
    function add(agent: string, level: Compatibility['level'], source: string) {
        if (!hosts.has(agent)) hosts.set(agent, { agent, level, source: sourceUrl.parse(source) });
    }
    if (guide.exampleRun) add(guide.exampleRun.agent, 'verified', guide.exampleRun.source);
    for (const claim of publisherCompatibility[guide.slug] ?? []) {
        for (const agent of claim.agents) add(agent, 'publisher', claim.source);
    }
    for (const agent of guide.listing?.platforms ?? []) add(agent, 'directory', guide.source);
    if (formatSkills.has(guide.slug)) {
        for (const { agent, source } of portableSkillHosts) add(agent, 'format', source);
    }
    for (const { agent, source } of portableSkillHosts) {
        if (agent === 'Codex' || agent === 'Claude Code') add(agent, 'guide', source);
    }
    const priority = (host: Compatibility) => {
        if (host.agent === 'Codex') return 0;
        if (host.level === 'guide') return 3;
        return host.agent === 'Claude Code' ? 1 : 2;
    };
    const compatibility = [...hosts.values()].sort((a, b) =>
        priority(a) - priority(b) || a.agent.localeCompare(b.agent, 'en'));
    if (!delivery[guide.slug]) throw new Error('Missing publisher delivery information for ' + guide.slug);
    const headerHash = createHash('sha256').update(guideHeader(guide)).digest('hex');
    const discovery = checkedHeaders[adapterName(guide.slug)] === headerHash
        ? { date: discoveryReport.date, hosts: discoveryReport.hosts }
        : undefined;
    const formatFile = formatSkills.has(guide.slug) ? new URL('SKILL.md', guide.source).href : undefined;
    return { ...guide, compatibility, compatibilityNote: publisherCompatibilityNotes[guide.slug], delivery: delivery[guide.slug], discovery, formatFile };
}

export const skillGroups = categories.map(([id, name]) => ({
    id, name,
    guides: entry.array().nonempty().parse(files['./claude-skills/' + id + '.json']).map(withAgentSupport),
}));

export const skillGuides = skillGroups.flatMap(group =>
    group.guides.map(guide => ({ ...guide, category: group.name, categoryId: group.id }))
);
export const skillPath = (slug: string) => '/claude-code-skills/' + slug + '/';

const slugs = new Set(skillGuides.map(guide => guide.slug));
if (slugs.size !== skillGuides.length) throw new Error('Claude Code skill guides must have unique URLs.');
for (const slug of [...Object.keys(delivery), ...Object.keys(publisherCompatibility), ...Object.keys(publisherCompatibilityNotes), ...formatSkills]) {
    if (!slugs.has(slug)) throw new Error('Unknown skill in compatibility or delivery data: ' + slug);
}
for (const guide of skillGuides) {
    if (guide.related.some(slug => !slugs.has(slug))) throw new Error('Unknown related guide for ' + guide.slug);
}
