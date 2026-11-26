import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { adapterName, guideHeader } from '../../src/lib/claude-skill-exports.ts';

const directory = '/claude-code-skills/';
const dataDirectory = new URL('../../src/data/claude-skills/', import.meta.url);
const files = (await readdir(dataDirectory)).filter(file => file.endsWith('.json')).sort();
const categories = await Promise.all(files.map(async file => ({
    id: file.slice(0, -'.json'.length),
    guides: JSON.parse(await readFile(new URL(file, dataDirectory), 'utf8')),
})));
const guides = categories.flatMap(category => category.guides);
const discovery = JSON.parse(await readFile(new URL('../claude-skill-discovery.json', dataDirectory), 'utf8'));
const pathFor = slug => directory + slug + '/';

test('directory cards and shared search index include every catalogue record', async ({ page, request }) => {
    const response = await request.get('/search-index.json');
    expect(response.ok()).toBe(true);
    const { entries } = await response.json();
    const indexed = entries.filter(entry => entry.kind === 'Skill guide');
    expect(indexed.map(entry => entry.href).sort()).toEqual(guides.map(guide => pathFor(guide.slug)).sort());

    await page.goto(directory);
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(guides.length);
    await expect(page.locator('[data-group] li').filter({ has: page.locator('.agent-tag', { hasText: /^Codex · / }) })).toHaveCount(guides.length);
    for (const { id, guides: group } of categories) {
        const section = page.locator('[data-group="' + id + '"]');
        const category = await section.getByRole('heading', { level: 2 }).innerText();
        const cards = await section.locator('li > a').evaluateAll(links => links.map(link => ({
            href: link.getAttribute('href'),
            title: link.querySelector('h3')?.textContent,
            description: link.querySelector('p')?.textContent,
        })));
        expect(cards, category).toEqual(group.map(guide => ({
            href: pathFor(guide.slug), title: guide.name, description: guide.description,
        })));
        for (const guide of group) {
            const entry = indexed.find(item => item.href === pathFor(guide.slug));
            expect(entry, guide.slug).toMatchObject({
                title: guide.name, summary: guide.description, group: 'assets',
                keywords: expect.arrayContaining([guide.slug, guide.kind, category, ...guide.aliases]),
            });
        }
    }
});

for (const { id, guides: group } of categories) {
    test(id + ' category and aliases reveal the right guide', async ({ page }) => {
        await page.goto(directory);
        const search = page.getByRole('searchbox', { name: 'Search guides' });
        await expect(search).toBeVisible();
        const topic = page.getByRole('navigation', { name: 'Skill categories' }).locator('[data-topic="' + id + '"]');
        await topic.click();
        await expect(topic).toHaveAttribute('aria-current', 'true');
        await expect(page.locator('#count')).toHaveText(group.length + (group.length === 1 ? ' guide' : ' guides'));
        const cards = page.locator('[data-group] li > a:visible');
        expect(await cards.evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(
            group.map(guide => pathFor(guide.slug))
        );
        for (const guide of group) {
            for (const alias of new Set([guide.slug, ...guide.aliases])) {
                await search.fill(alias);
                await expect(cards.filter({ has: page.getByRole('heading', { name: guide.name, exact: true }) }),
                    guide.slug + ' should be visible for ' + alias).toHaveAttribute('href', pathFor(guide.slug));
            }
        }
    });

    test(id + ' detail pages render the source record and copy its example', async ({ page, context }) => {
        test.setTimeout(120000);
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        for (const guide of group) {
            await test.step(guide.name, async () => {
                const response = await page.goto(pathFor(guide.slug));
                expect(response.status()).toBe(200);
                await expect(page.getByRole('heading', { level: 1 })).toHaveText(guide.name);
                await expect(page.locator('header.page-heading')).toContainText(guide.description);
                await expect(page.locator('header.page-heading')).toContainText(guide.kind);
                const article = page.getByRole('article', { name: 'Using ' + guide.name });
                const section = title => article.locator('section').filter({
                    has: page.getByRole('heading', { name: title, exact: true }),
                });
                await expect(section('What you need').locator('p')).toHaveText(guide.requirements);
                await expect(section('How to use it').getByRole('listitem')).toHaveText(guide.steps);
                await expect(section('Check the result').locator('p')).toHaveText(guide.check);
                await expect(section('Example prompt').getByRole('blockquote')).toHaveText(guide.example);
                const compatibility = section('Agent compatibility');
                await expect(compatibility).toContainText('Codex');
                const exportRoot = directory + 'download/' + guide.slug + '/';
                const downloads = section('Download this guide');
                const headerHash = createHash('sha256').update(guideHeader(guide)).digest('hex');
                if (discovery.headers[adapterName(guide.slug)] === headerHash) {
                    await expect(downloads.locator('.discovery')).toContainText('Codex ' + discovery.hosts.Codex);
                } else {
                    await expect(downloads.locator('.discovery')).toHaveCount(0);
                }
                for (const file of ['SKILL.md', 'guide.json', guide.slug + '.zip']) {
                    await expect(downloads.locator('a[download][href="' + exportRoot + file + '"]')).toBeVisible();
                }
                await expect(downloads.locator('.publisher-links a').first()).toHaveAttribute('href', /^https:\/\//);

                const details = page.getByRole('complementary', { name: 'Guide details' });
                const links = details.locator('#guide-sources + ul a');
                expect(await links.evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')))).toEqual(
                    [...new Set([guide.source, guide.upstream].filter(Boolean))]
                );
                if (guide.exampleRun) {
                    await expect(details).toContainText('Passed in ' + guide.exampleRun.agent + ' ' + guide.exampleRun.version);
                    await details.getByText('See the actual output').click();
                    await expect(details.locator('.observed li')).toHaveText(guide.exampleRun.messages);
                } else {
                    await expect(details).toContainText('Planned.');
                }
                const toolCheck = details.getByRole('region', { name: 'Tool verification' });
                if (guide.toolCheck) {
                    await expect(toolCheck).toContainText(guide.toolCheck.result);
                    await expect(toolCheck.locator('time')).toHaveAttribute('datetime', guide.toolCheck.date);
                } else {
                    await expect(toolCheck).toHaveCount(0);
                }
                for (const alias of guide.aliases.filter(alias => alias.toLowerCase() !== guide.name.toLowerCase())) {
                    await expect(details).toContainText(alias);
                }
                for (const slug of guide.related ?? []) {
                    await expect(details.locator('a[href="' + pathFor(slug) + '"]')).toBeVisible();
                }
                if (guide.listing) {
                    const listing = guide.listing;
                    const values = [listing.author, listing.platforms?.join(' · '), listing.level, listing.version, listing.updated];
                    await expect(details.locator('dd')).toHaveText(values.filter(Boolean));
                }
                await page.getByRole('button', { name: 'Copy example' }).click();
                await expect(page.locator('#copy-status')).toHaveText('Example copied.');
                expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(guide.example);
            });
        }
    });
}

test('command search opens an aliased guide and clipboard denial selects its example', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); } },
        });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open command search' }).click();
    await page.getByRole('combobox', { name: 'Search pages, assets and quick actions' }).fill('docx');
    await page.getByRole('option').filter({ hasText: 'Word Document Creation' }).click();
    await expect(page).toHaveURL(pathFor('anthropic-docx'));
    await page.getByRole('button', { name: 'Copy example' }).press('Enter');
    await expect(page.locator('#copy-status')).toContainText('Example selected.');
    await expect(page.locator('#prompt')).toBeFocused();
    expect(await page.evaluate(() => window.getSelection().toString())).toBe(
        guides.find(guide => guide.slug === 'anthropic-docx').example
    );
});

test('category, alias search and history lead to a copyable guide', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/ai-kit/');
    await page.getByRole('link', { name: 'Browse Claude Code skills' }).click();
    const search = page.getByRole('searchbox', { name: 'Search guides' });
    const categories = page.getByRole('navigation', { name: 'Skill categories' });
    await categories.getByRole('link', { name: 'Office & data 10' }).press('Enter');
    await expect(page.locator('#count')).toHaveText('10 guides');
    await search.fill('docx');
    await expect(page.locator('#count')).toHaveText('1 guide');
    await page.reload();
    await expect(search).toHaveValue('docx');
    await page.getByRole('checkbox', { name: 'Compact list' }).check();
    await expect(page.locator('[data-group] li:visible .agents')).toBeHidden();
    await page.getByRole('link', { name: /Word Document Creation/ }).press('Enter');
    await expect(page).toHaveURL(directory + 'anthropic-docx/');
    const filtered = page.getByRole('link', { name: 'Back to filtered guides' });
    await expect(filtered).toHaveAttribute('href', /q=docx/);
    await expect(page.getByRole('heading', { name: 'What you need' })).toBeVisible();
    const prompt = await page.locator('#prompt').innerText();
    await page.getByRole('button', { name: 'Copy example' }).press('Enter');
    await expect(page.locator('#copy-status')).toHaveText('Example copied.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(prompt);
    await page.goBack();
    await expect(search).toHaveValue('docx');
    await search.fill('unmatched-xxxx');
    await expect(page.locator('#empty')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).press('Enter');
    await expect(search).toBeFocused();
    await expect(page.locator('#count')).toHaveText(guides.length + ' guides');
});

test('mobile RTL layout and keyboard search open both halves of Grill Me & Handoff', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(directory);
    await page.evaluate(() => document.documentElement.dir = 'rtl');
    await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('collections-tools');
    await expect(page.locator('#count')).toHaveText('11 guides');
    const search = page.getByRole('searchbox', { name: 'Search guides' });
    await search.fill('Grill Me & Handoff');
    await expect(page.locator('#count')).toHaveText('1 guide');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
    await page.getByRole('link', { name: /Grill Me/ }).press('Enter');
    await page.getByRole('link', { name: 'Handoff', exact: true }).press('Enter');
    await expect(page.getByRole('heading', { name: 'Handoff', exact: true })).toBeVisible();
    await page.evaluate(() => document.documentElement.dir = 'rtl');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('Codex filter shows original skills and restores the selection from the URL', async ({ page }) => {
    await page.goto(directory);
    const agents = page.getByRole('combobox', { name: 'Agent for the original skill' });
    await agents.selectOption('Codex');
    await expect(page).toHaveURL(/agent=Codex/);
    const visible = page.locator('[data-group] li:visible');
    const count = await visible.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(guides.length);
    await expect(visible.filter({ hasText: 'Superpowers' }).first()).toBeVisible();
    await expect(visible.locator('.agent-tag').filter({ hasText: 'Codex · Guide only' })).toHaveCount(0);
    await page.reload();
    await expect(agents).toHaveValue('Codex');
    await expect(page.locator('#count')).toHaveText(count + ' guides');
    const tested = page.getByRole('checkbox', { name: 'Tested examples only' });
    await tested.check();
    await expect(visible).toHaveCount(guides.filter(guide => guide.exampleRun?.agent === 'Codex').length);
    await expect(visible.filter({ hasText: 'UX Copy' })).toContainText('Codex · Example passed');
    await agents.selectOption('Claude Code');
    await expect(visible).toHaveCount(guides.filter(guide => guide.exampleRun?.agent === 'Claude Code').length);
    await page.goBack();
    await expect(tested).toBeChecked();
    await expect(agents).toHaveValue('Codex');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(agents).toHaveValue('');
    await expect(tested).not.toBeChecked();
    await expect(visible).toHaveCount(guides.length);
});

test.describe('static guides', () => {
    test.use({ javaScriptEnabled: false });
    test('homepage and category links work without JavaScript', async ({ page }) => {
        await page.goto('/');
        await page.locator('#directory-claude-code-skills').click();
        await page.getByRole('link', { name: 'Design 18' }).click();
        await page.getByRole('link', { name: /Design Critique/ }).click();
        await expect(page.getByRole('heading', { name: 'Design Critique', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Example prompt' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'CollectiveBrain · English' })).toHaveAttribute(
            'href', 'https://collectivebrain.de/en/skills/design-design-critique/'
        );
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('link', { name: 'Guide ZIP', exact: true }).click(),
        ]);
        expect(download.suggestedFilename()).toBe('guide-design-design-critique.zip');
    });
});
