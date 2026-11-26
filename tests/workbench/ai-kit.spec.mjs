import { readFile, readdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('kind, category and search combine, recover from empty results and open direct links', async ({ page }) => {
    await page.goto('/ai-kit/#workflow-mcp-oauth-ops');
    const list = page.getByRole('navigation', { name: 'Toolkit entries' });
    await expect(page.locator('#workflow-mcp-oauth-ops')).toBeVisible();
    await expect(list.getByRole('link')).toHaveCount(11);
    await page.getByRole('button', { name: 'Coding Skills' }).click();
    await expect(list.getByRole('link')).toHaveCount(4);
    const selectedId = await page.locator('.kit-detail article:visible').getAttribute('id');
    await expect(page).toHaveURL(new RegExp('#' + selectedId + '$'));
    await page.getByRole('button', { name: 'Backend & SQL' }).click();
    await expect(list.getByRole('link')).toHaveCount(2);
    await page.getByRole('searchbox', { name: 'Search toolkit' }).fill('pooled GROUP_BY_MODE');
    await expect(list.getByRole('link')).toHaveCount(1);
    await list.getByRole('link').click();
    await expect(page).toHaveURL(/#skill-n1-pooled-sql-auditor$/);
    await page.getByRole('searchbox').fill('zzzzzz');
    await expect(page.getByRole('heading', { name: 'No matching prompts' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(list.getByRole('link')).toHaveCount(11);
    await expect(page.getByRole('searchbox')).toBeFocused();
    await page.goto('/ai-kit/#gem-schema-architect');
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('#gem-schema-architect')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('reopening the active prompt through global search retains typed variables', async ({ page }) => {
    await page.goto('/ai-kit/#gem-schema-architect');
    const input = page.locator('#gem-schema-architect .variable-fields textarea').first();
    await input.fill('Local equipment register example');
    await page.keyboard.press('Control+k');
    await page.locator('#ask-query').fill('First-principles database');
    await page.getByRole('option').filter({ hasText: 'First-principles database' }).click();
    await expect(page.locator('#gem-schema-architect')).toBeFocused();
    await expect(input).toHaveValue('Local equipment register example');
});

test('every starter compiles literal values, copies both forms, and downloads valid Markdown and JSON', async ({ page, context }) => {
    test.setTimeout(120000);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/ai-kit/');
    const list = page.getByRole('navigation', { name: 'Toolkit entries' });
    const directory = new URL('../../src/content/ai-kit/', import.meta.url);
    const files = (await readdir(directory)).filter(name => name.endsWith('.md'));
    expect(files).toHaveLength(11);
    const literal = '<em>Demo</em> $& \\ {{NEXT}} & "quotes"';
    for (const file of files) {
        const id = file.slice(0, -3);
        await list.locator('[href="#' + id + '"]').click();
        const card = page.locator('article#' + id);
        const labels = card.locator('fieldset textarea');
        const values = {};
        for (let index = 0; index < await labels.count(); index++) {
            const field = labels.nth(index);
            const key = (await field.getAttribute('id')).slice(id.length + 1);
            values[key] = literal + ' ' + key;
            await field.fill(values[key]);
        }
        const source = await readFile(new URL(file, directory), 'utf8');
        const raw = source.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trim().replaceAll('\r\n', '\n');
        const compiled = raw.replace(/\{\{([A-Z][A-Z0-9_]*)\}\}/g, (_, key) => values[key]);
        expect(await card.locator('pre code').textContent()).toBe(compiled);
        expect(await card.locator('mark').allTextContents()).toEqual(Array.from(raw.matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g), m => values[m[1]]));
        await expect(card.locator('mark em')).toHaveCount(0);
        for (const [button, expected] of [['Copy raw template', raw], ['Copy compiled prompt', compiled]]) {
            await card.getByRole('button', { name: button, exact: true }).click();
            await expect.poll(async () => (await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n','\n')).toBe(expected);
        }
        for (const extension of ['md','json']) {
            const transfer = page.waitForEvent('download');
            await card.getByRole('button', { name: 'Download .' + extension }).click();
            const download = await transfer;
            expect(download.suggestedFilename()).toBe(id + '.' + extension);
            const contents = await readFile(await download.path(), 'utf8');
            if (extension === 'md') expect(contents).toBe(compiled);
            else expect(JSON.parse(contents)).toMatchObject({ id, raw, compiled, variables: values });
        }
        const local = await card.getByRole('link', { name: 'View source file' }).getAttribute('href');
        const github = new URL(await card.getByRole('link', { name: 'View source on GitHub' }).getAttribute('href'));
        expect(github.origin).toBe('https://github.com');
        expect(github.pathname.split('/').slice(5)).toEqual(['src', 'content', 'ai-kit', file]);
        const response = await page.request.get(local);
        expect(response.ok()).toBe(true);
        expect((await response.text()).replaceAll('\r\n','\n')).toBe(source.replaceAll('\r\n','\n'));
    }
});
