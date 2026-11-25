import { z } from 'astro:content';

const text = z.string().trim().min(1);
const sourceUrl = z.string().url().startsWith('https://');
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

export const skillGroups = categories.map(([id, name]) => ({
    id, name,
    guides: entry.array().nonempty().parse(files['./claude-skills/' + id + '.json']),
}));

export const skillGuides = skillGroups.flatMap(group =>
    group.guides.map(guide => ({ ...guide, category: group.name, categoryId: group.id }))
);
export const skillPath = (slug: string) => '/claude-code-skills/' + slug + '/';

const slugs = new Set(skillGuides.map(guide => guide.slug));
if (slugs.size !== skillGuides.length) throw new Error('Claude Code skill guides must have unique URLs.');
for (const guide of skillGuides) {
    if (guide.related.some(slug => !slugs.has(slug))) throw new Error('Unknown related guide for ' + guide.slug);
}
