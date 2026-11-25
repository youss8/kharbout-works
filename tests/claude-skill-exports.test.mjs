import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import JSZip from 'jszip';
import { load } from 'js-yaml';
import { adapterName, guideArchive, guideFiles, guideHeader } from '../src/lib/claude-skill-exports.ts';

const source = JSON.parse(readFileSync('src/data/claude-skills/collections-tools.json', 'utf8'))
    .find(entry => entry.slug === 'webapp-testing');
delete source.exampleRun;
const license = readFileSync('LICENSE', 'utf8');
const guide = {
    ...source,
    compatibility: [{ agent: 'Claude Code', level: 'publisher', source: source.source }],
    delivery: { method: 'skill-file', url: source.source, label: 'Publisher setup' },
    description: 'Review a "quoted" value: #2.\n---\nFocus on the example.',
};

test('portable names are stable, bounded and safe as archive directories', () => {
    assert.equal(adapterName('mcp-builder'), 'guide-mcp-builder');
    const long = 'separate-word-'.repeat(5) + 'end';
    assert.match(adapterName(long), /^(?=.{1,64}$)[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(adapterName(long), adapterName(long));
    assert.notEqual(adapterName(long), adapterName(long + '-two'));
    assert.doesNotMatch(adapterName('anthropic-claude-api'), /anthropic|claude/);
    assert.notEqual(adapterName('anthropic-pdf'), adapterName('pdf'));
    for (const invalid of ['../up', 'a/b', 'a\\b', 'x--x', '.', 'CON', '', 'has space']) {
        assert.throws(() => adapterName(invalid), /Invalid catalogue slug/);
    }
});

test('Markdown frontmatter round-trips punctuation and newlines and JSON preserves the source record', () => {
    const { name, markdown, json } = guideFiles(guide, license);
    const [, header] = markdown.match(/^---\n(.*?)\n---\n/s);
    assert.equal(guideHeader(guide), '---\n' + header + '\n---');
    const frontmatter = load(header);
    assert.equal(frontmatter.name, name);
    assert.equal(frontmatter.metadata.author, 'Kharbout Works');
    assert.equal(frontmatter.description, 'Use this guide for ' + guide.name + ' tasks. ' + guide.description);
    assert.equal(frontmatter.license, 'MIT');
    assert.ok(markdown.includes(license.trim().replace(/\r\n/g, '\n')));
    for (const value of [guide.requirements, ...guide.steps, guide.example, guide.check, guide.source, guide.toolCheck.result]) {
        assert.ok(markdown.includes(value), value);
    }
    const { adapter, ...record } = JSON.parse(json);
    assert.deepEqual(record, guide);
    assert.equal(adapter.name, name);
    assert.equal(adapter.exampleStatus, 'planned');
    assert.ok(markdown.includes('Planned. A complete run of the example prompt'));
    assert.ok(!markdown.includes('### Recorded messages'));
    assert.equal(adapter.licenseText, license.trim());
});

test('a completed native example exports its host, edition, messages and result', () => {
    const exampleRun = {
        agent: 'Fixture host', version: '1.2.3', date: '2026-11-25',
        source: 'https://example.org/fixtures/edition.md', sourceSha256: 'ab'.repeat(32),
        messages: ['A visible status changed.', 'First line\nSecond line'],
        result: 'The named control restored focus to the search field.',
    };
    const compatibility = [{ agent: exampleRun.agent, level: 'verified', source: exampleRun.source }];
    const { markdown, json } = guideFiles({ ...guide, compatibility, exampleRun }, license);
    const record = JSON.parse(json);
    assert.deepEqual(record.exampleRun, exampleRun);
    assert.equal(record.adapter.exampleStatus, 'verified');
    assert.ok(markdown.includes('Fixture host — The published example passed in this agent.'));
    for (const value of ['Verified in Fixture host 1.2.3 on 2026-11-25.', exampleRun.source, exampleRun.sourceSha256,
        exampleRun.result, '> A visible status changed.', '> First line\n> Second line']) {
        assert.ok(markdown.includes(value), value);
    }
    assert.ok(!markdown.includes('A complete run of the example prompt in its intended assistant is pending.'));
    assert.equal(guideHeader(guide), guideHeader({ ...guide, exampleRun }));
});

test('the reviewed skill edition and complete publisher ZIP retain their distinct purposes', () => {
    const formatFile = 'https://example.org/skill/SKILL.md';
    const repositoryZip = 'https://example.org/fixture/repository.zip';
    const { markdown, json } = guideFiles({ ...guide, formatFile, delivery: { ...guide.delivery, repositoryZip } }, license);
    const record = JSON.parse(json);
    assert.equal(record.formatFile, formatFile);
    assert.equal(record.delivery.repositoryZip, repositoryZip);
    assert.ok(markdown.includes('[reviewed CollectiveBrain skill file](<' + formatFile + '>)'));
    assert.ok(markdown.includes('[Download the complete publisher repository ZIP](<' + repositoryZip + '>)'));
});

test('archives contain only the two portable text files and reject duplicate destinations', async () => {
    const files = guideFiles(guide, license);
    const bytes = await guideArchive([guide], license);
    const decoded = await JSZip.loadAsync(bytes, { checkCRC32: true });
    const folder = files.name + '/';
    assert.deepEqual(Object.keys(decoded.files).sort(), [folder + 'SKILL.md', folder + 'guide.json']);
    assert.equal(await decoded.file(folder + 'SKILL.md').async('string'), files.markdown);
    assert.equal(await decoded.file(folder + 'guide.json').async('string'), files.json);
    assert.deepEqual(await guideArchive([guide], license), bytes);
    await assert.rejects(guideArchive([guide, guide], license), /Duplicate adapter folder/);
});
