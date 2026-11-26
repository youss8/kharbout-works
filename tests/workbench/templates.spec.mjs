import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const fixtures = [
    ['01-system-architecture-spec', 'Architecture'],
    ['02-pre-code-readiness-checklist', 'Planning'],
    ['03-state-machine-permission-matrix', 'Operations'],
    ['04-scope-tradeoff-alignment', 'Planning'],
    ['05-technical-handover-guide', 'Handover'],
];

async function download(page, button) {
    const pending = page.waitForEvent('download');
    await button.click();
    const file = await pending;
    return { text: await readFile(await file.path(), 'utf8'), filename: file.suggestedFilename() };
}

test('all five entries filter by category, resolve their deep link, and export the displayed Markdown', async ({ page, context, request }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize({ width: 375, height: 812 });
    for (const [id, category] of fixtures) {
        await page.goto('/templates/#' + id);
        const article = page.getByRole('article');
        await expect(article).toHaveAttribute('id', id);
        await page.getByRole('button', { name: category, exact: true }).click();
        const directory = page.getByRole('navigation', { name: 'Template directory' });
        await expect(directory.getByRole('link')).toHaveCount(fixtures.filter(row => row[1] === category).length);
        await expect(article.getByText('Starter blueprint', { exact: true })).toBeVisible();
        await article.getByRole('tab', { name: 'Raw Markdown' }).click();
        const rawPanel = article.getByRole('tabpanel', { name: 'Raw Markdown', exact: true });
        const raw = await rawPanel.locator('pre code').textContent();
        const exportStatus = article.getByRole('status');
        await article.getByRole('button', { name: 'Copy raw Markdown' }).click();
        await expect(exportStatus).toHaveText('Copied to clipboard.');
        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboard.replaceAll('\r\n', '\n')).toBe(raw);
        const exported = await download(page, article.getByRole('button', { name: 'Download .md', exact: true }));
        expect(exported).toEqual({ text: raw, filename: id + '.md' });
        await article.getByRole('tab', { name: 'Rendered preview' }).click();
        await article.getByRole('button', { name: 'Copy preview text' }).click();
        await expect(exportStatus).toHaveText('Copied to clipboard.');
        const renderedText = await page.evaluate(() => navigator.clipboard.readText());
        expect(renderedText.length).toBeGreaterThan(150);
        expect(renderedText).not.toContain('## ');
        if (id === '03-state-machine-permission-matrix') expect(renderedText).toContain('"initial": "draft"');
        const sourceLink = await article.getByRole('link', { name: 'View source file' }).getAttribute('href');
        const github = new URL(await article.getByRole('link', { name: 'View source on GitHub' }).getAttribute('href'));
        expect(github.origin).toBe('https://github.com');
        expect(github.pathname.split('/').slice(5)).toEqual(['src', 'content', 'templates', id + '.md']);
        const response = await request.get(sourceLink);
        expect(response.ok()).toBeTruthy();
        const original = await readFile(path.join('src/content/templates', id + '.md'), 'utf8');
        expect(await response.text()).toBe(original);
        const size = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        expect(size).toEqual([375, 375]);
    }
    expect(errors).toEqual([]);
});

test('Back restores the first template when returning to the unfragmented directory', async ({ page }) => {
    await page.goto('/templates/');
    await page.getByRole('navigation', { name: 'Template directory' }).getByRole('link').nth(2).click();
    await expect(page.locator('article:visible')).toHaveAttribute('id', '03-state-machine-permission-matrix');
    await page.goBack();
    await expect(page.locator('article:visible')).toHaveAttribute('id', '01-system-architecture-spec');
});

test.describe('static readers', () => {
    test.use({ javaScriptEnabled: false });
    for (const [route, label, count] of [['templates', 'Template directory', 5], ['ai-kit', 'Toolkit entries', 11]]) {
        test(route + ' opens every entry and source without client scripts', async ({ page }) => {
            await page.goto('/' + route + '/');
            const links = page.getByRole('navigation', { name: label }).getByRole('link');
            await expect(links).toHaveCount(count);
            for (const link of await links.all()) {
                const id = (await link.getAttribute('href')).slice(1);
                const target = page.locator(`article[id="${id}"]`);
                await link.click();
                await expect(target.getByRole('heading', { level: 2 }).first()).toBeVisible();
                await expect(target.getByRole('link', { name: 'View source file' })).toBeVisible();
            }
        });
    }
});

test('permission matrix JSON download matches the schema tab and the example references declared states', async ({ page }) => {
    const id = '03-state-machine-permission-matrix';
    await page.goto('/templates/#' + id);
    const article = page.getByRole('article');
    const example = JSON.parse(await article.getByRole('tabpanel').locator('pre code').innerText());
    await article.getByRole('tab', { name: 'Raw Markdown' }).focus();
    await page.keyboard.press('End');
    await expect(article.getByRole('tab', { name: 'JSON Schema' })).toBeFocused();
    const displayed = JSON.parse(await article.getByRole('tabpanel').innerText());
    const file = await download(page, article.getByRole('button', { name: 'Download .json' }));
    expect(file.filename).toBe(id + '.json');
    expect(JSON.parse(file.text)).toEqual(displayed);
    expect(displayed.$schema).toContain('2020-12');
    for (const key of displayed.required) expect(example).toHaveProperty(key);
    for (const edge of example.transitions) {
        expect(example.states).toContain(edge.from);
        expect(example.states).toContain(edge.to);
        for (const role of edge.roles) expect(example.roles).toContain(role);
    }
    await page.getByRole('button', { name: 'Handover', exact: true }).click();
    await expect(page.getByRole('article')).toHaveAttribute('id','05-technical-handover-guide');
    await expect(page.getByRole('button', { name: 'Download .json' })).toHaveCount(0);
});
