import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { load } from 'js-yaml';

const catalogue = new URL('../../src/data/claude-skills/', import.meta.url);
const guides = readdirSync(catalogue).filter(file => file.endsWith('.json'))
    .flatMap(file => JSON.parse(readFileSync(new URL(file, catalogue), 'utf8')));
const download = '/claude-code-skills/download/';

test('every public download agrees with the guide and the combined archive', async ({ request }) => {
    test.setTimeout(120_000);
    const response = await request.get(download + 'catalogue.zip');
    expect(response.status()).toBe(200);
    const all = await JSZip.loadAsync(await response.body(), { checkCRC32: true });
    const expectedFiles = [];
    for (const guide of guides) {
        await test.step(guide.slug, async () => {
            const base = download + guide.slug + '/';
            const [md, json, zip] = await Promise.all([
                request.get(base + 'SKILL.md'), request.get(base + 'guide.json'), request.get(base + guide.slug + '.zip'),
            ]);
            expect([md.status(), json.status(), zip.status()]).toEqual([200, 200, 200]);
            const markdown = await md.text();
            const jsonText = await json.text();
            const record = JSON.parse(jsonText);
            expect(record).toMatchObject(guide);
            expect(record.compatibility.length).toBeGreaterThan(0);
            expect(record.delivery.url).toMatch(/^https:\/\//);
            const [, yaml] = markdown.match(/^---\n(.*?)\n---\n/s);
            const header = load(yaml);
            expect(header.name).toBe(record.adapter.name);
            expect(header.name).toMatch(/^(?=.{1,64}$)guide-[a-z0-9]+(?:-[a-z0-9]+)*$/);
            expect(header.name).not.toMatch(/claude|anthropic/);
            expect(header.metadata.author).toBe('Kharbout Works');
            expect(header.description.length).toBeLessThanOrEqual(1024);
            for (const text of [guide.requirements, ...guide.steps, guide.check, guide.source, record.delivery.url]) {
                expect(markdown).toContain(text);
            }
            expect(markdown).toContain(guide.example.split(/\r?\n/).map(line => '> ' + line).join('\n'));
            for (const { agent, source } of record.compatibility) {
                expect(markdown).toContain('- ' + agent + ' — ');
                if (source) expect(markdown).toContain(source);
            }
            if (record.compatibilityNote) expect(markdown).toContain(record.compatibilityNote);
            if (record.formatFile) expect(markdown).toContain('[reviewed CollectiveBrain skill file](<' + record.formatFile + '>)');
            if (record.delivery.repositoryZip) {
                expect(markdown).toContain('[Download the complete publisher repository ZIP](<' + record.delivery.repositoryZip + '>)');
            }
            expect(markdown).toContain(record.adapter.licenseText.replace(/\r\n/g, '\n'));
            if (guide.exampleRun) {
                const run = guide.exampleRun;
                expect(record.adapter.exampleStatus).toBe('verified');
                expect(record.exampleRun).toEqual(run);
                expect(markdown).toContain('Verified in ' + run.agent + ' ' + run.version + ' on ' + run.date);
                for (const text of [run.result, run.source, run.sourceSha256]) expect(markdown).toContain(text);
                for (const message of run.messages) {
                    expect(markdown).toContain(message.split(/\r?\n/).map(line => '> ' + line).join('\n'));
                }
                expect(markdown).not.toContain('A complete run of the example prompt in its intended assistant is pending.');
            } else {
                expect(record.adapter.exampleStatus).toBe('planned');
                expect(markdown).toContain('Planned. A complete run of the example prompt');
            }
            if (guide.toolCheck) expect(markdown).toContain(guide.toolCheck.result);

            const individual = await JSZip.loadAsync(await zip.body(), { checkCRC32: true });
            const files = [[header.name + '/SKILL.md', markdown], [header.name + '/guide.json', jsonText]];
            expect(Object.keys(individual.files).sort()).toEqual(files.map(([name]) => name));
            for (const [name, content] of files) {
                for (const archive of [all, individual]) {
                    const entry = archive.file(name);
                    expect(entry?.unsafeOriginalName).toBe(name);
                    expect(await entry.async('string')).toBe(content);
                }
                expectedFiles.push(name);
            }
        });
    }
    expect(Object.keys(all.files).sort()).toEqual(expectedFiles.sort());
});
