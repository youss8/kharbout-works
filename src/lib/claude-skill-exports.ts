import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { siteName } from '../data/brand.ts';
import type { skillGuides } from '../data/claude-skills';

type Guide = (typeof skillGuides)[number];

export function adapterName(slug: string): string {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid catalogue slug');
    // Anthropic's skill-upload format reserves both vendor names. Keep the original slug in guide.json.
    const portableSlug = slug.replace(/^anthropic-/, '').replaceAll('anthropic', 'publisher').replaceAll('claude', 'assistant');
    const name = 'guide-' + portableSlug;
    if (name.length <= 64 && portableSlug === slug) return name;
    const suffix = createHash('sha256').update(slug).digest('hex').slice(0, 12);
    return name.slice(0, 51).replace(/-$/, '') + '-' + suffix;
}

export function guideHeader(guide: { slug: string; name: string; description: string }): string {
    const description = Array.from(('Use this guide for ' + guide.name + ' tasks. ' + guide.description).replace(/[<>]/g, ''))
        .slice(0, 1024).join('');
    return [
        '---',
        'name: ' + adapterName(guide.slug),
        'description: ' + JSON.stringify(description),
        'license: MIT',
        'metadata:',
        '  author: ' + JSON.stringify(siteName),
        '---',
    ].join('\n');
}

export function guideFiles(guide: Guide, licenseText: string) {
    const name = adapterName(guide.slug);
    const scope = 'This instruction-only adapter was written by ' + siteName +
        '. The original publisher supplies the implementation and any commands, plugins, connectors or accounts it requires.';
    const run = guide.exampleRun;
    const verification = run ? [
        'Verified in ' + run.agent + ' ' + run.version + ' on ' + run.date + '.',
        '',
        run.result,
        '',
        '[Source edition used](<' + run.source + '>)',
        '',
        'Source SHA-256 `' + run.sourceSha256 + '`',
        '',
        '### Recorded messages',
        '',
        run.messages.map(message => message.split(/\r?\n/).map(line => '> ' + line).join('\n')).join('\n\n'),
    ] : ['Planned. A complete run of the example prompt in its intended assistant is pending.'];
    const sources = [...new Set([guide.source, guide.upstream].filter(Boolean))];
    const support = {
        verified: 'The published example passed in this agent.',
        publisher: 'The publisher lists support.',
        directory: 'The directory lists support.',
        format: 'This host reads the standard skill-file format. Check the requirements below before using the original workflow.',
        guide: 'Use the workbench instructions in this host. The original workflow requires the environment identified below.',
    };
    const markdown = [
        guideHeader(guide),
        '',
        '# ' + guide.name,
        '',
        scope,
        '',
        guide.description,
        '',
        '## Agent compatibility',
        '',
        ...guide.compatibility.map(host => '- ' + host.agent + ' — ' + support[host.level] +
            (host.source ? ' <' + host.source + '>' : '')),
        ...(guide.formatFile ? ['', 'The standard-format assessment covers the [reviewed CollectiveBrain skill file](<' + guide.formatFile + '>).'] : []),
        ...(guide.compatibilityNote ? ['', guide.compatibilityNote] : []),
        '',
        '## What you need',
        '',
        guide.requirements,
        '',
        'Check that the required tools and inputs are available in the current host. If something is missing, identify the requirement and direct the reader to the publisher’s setup instructions.',
        '',
        '[' + guide.delivery.label + '](<' + guide.delivery.url + '>)',
        ...(guide.delivery.packageUrl ? ['', '[' + guide.delivery.packageLabel + '](<' + guide.delivery.packageUrl + '>)'] : []),
        ...(guide.delivery.repositoryZip ? ['', '[Download the complete publisher repository ZIP](<' + guide.delivery.repositoryZip + '>)'] : []),
        ...(guide.delivery.note ? ['', guide.delivery.note] : []),
        '',
        '## How to use it',
        '',
        ...guide.steps.map((step, index) => (index + 1) + '. ' + step),
        '',
        '## Example request',
        '',
        ...guide.example.split(/\r?\n/).map(line => '> ' + line),
        '',
        '## Check the result',
        '',
        guide.check,
        '',
        ...verification,
        ...(guide.toolCheck ? ['', 'Tool check (' + guide.toolCheck.date + ')', '', guide.toolCheck.result] : []),
        '',
        '## Sources',
        '',
        ...sources.map(url => '- <' + url + '>'),
        '',
        '## Adapter license',
        '',
        'This license applies to the workbench instructions. Each publisher provides the terms for its own implementation.',
        '',
        licenseText.trim().replace(/\r\n/g, '\n'),
        '',
    ].join('\n');
    const json = JSON.stringify({
        ...guide,
        adapter: { name, author: siteName, scope, exampleStatus: run ? 'verified' : 'planned', license: 'MIT', licenseText: licenseText.trim() },
    }, null, 2) + '\n';
    return { name, markdown, json };
}

export async function guideArchive(guides: Guide[], licenseText: string): Promise<ArrayBuffer> {
    const zip = new JSZip();
    // Fixed ZIP header dates make unchanged content byte-identical across builds.
    const options = { createFolders: false, date: new Date('1980-01-01T00:00:00Z') };
    for (const guide of guides) {
        const { name, markdown, json } = guideFiles(guide, licenseText);
        const skillFile = name + '/SKILL.md';
        if (zip.file(skillFile)) throw new Error('Duplicate adapter folder ' + name);
        zip.file(skillFile, markdown, options);
        zip.file(name + '/guide.json', json, options);
    }
    return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
}
