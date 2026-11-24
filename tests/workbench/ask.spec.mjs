import { expect, test as base } from '@playwright/test';

const test = base.extend({
    diagnostics: [
        async ({ page }, use) => {
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            page.on('console', (message) => {
                if (['error', 'warning'].includes(message.type())) errors.push(message.text());
            });
            await use();
            expect(errors).toEqual([]);
        },
        { auto: true },
    ],
});
const answerGroup = 'Direct answers & quick actions';
const resultGroups = [answerGroup, 'Systems, sandboxes & pages', 'Vault, AI toolkit & templates'];
const search = (page) =>
    page.getByRole('combobox', { name: 'Search pages, assets and quick actions' });

test('command index covers each public collection and resolves internal anchors', async ({
    page,
    request,
}) => {
    const response = await request.get('/search-index.json');
    expect(response.ok()).toBe(true);
    const { entries, intents } = await response.json();
    const count = (kind) => entries.filter((entry) => entry.kind === kind).length;
    expect(count('Page')).toBe(7);
    expect(count('Sandbox')).toBe(6);
    expect(count('Prototype')).toBe(4);
    expect(count('Vault')).toBe(20);
    expect(count('gem') + count('skill') + count('workflow')).toBe(11);
    expect(count('Template')).toBe(5);
    expect(entries.filter((row) => /^SYS-0[123]$/.test(row.kind))).toHaveLength(3);
    const base = 'http://workbench.local';
    const targets = [
        ...new Set(
            [...entries, ...intents]
                .map((item) => item.href)
                .filter((href) => href?.startsWith('/')),
        ),
    ];
    const paths = [...new Set(targets.map((href) => new URL(href, base).pathname))];
    const docs = new Map(
        await Promise.all(
            paths.map(async (path) => {
                const result = await request.get(path);
                expect(result.status(), path).toBe(200);
                return [path, await result.text()];
            }),
        ),
    );
    for (const href of targets) {
        const { pathname, hash } = new URL(href, base);
        if (!hash) continue;
        const found = await page.evaluate(
            ({ html, id }) => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                return Boolean(doc.getElementById(id));
            },
            { html: docs.get(pathname), id: decodeURIComponent(hash.slice(1)) },
        );
        expect(found, 'Missing indexed target ' + href).toBe(true);
    }
});

test('command palette resolves every intent, navigates options and restores focus', async ({
    page,
}) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Open command search' });
    const dialog = page.getByRole('dialog', { name: 'Search Kharbout Works' });
    await trigger.focus();
    await page.keyboard.press('Control+k');
    await expect(dialog).toBeVisible();
    await expect(search(page)).toBeFocused();
    for (const name of resultGroups)
        await expect(dialog.getByRole('group', { name })).toBeVisible();
    const checks = [
        ['cv', 'Open the print-ready CV'],
        ['pdf', 'Open the print-ready CV'],
        ['germany', 'Germany relocation'],
        ['relocate', 'Germany relocation'],
        ['email', 'Email Youssef'],
        ['contact', 'Email Youssef'],
        ['solo', 'Which system was built solo?'],
        ['react', 'Explore the React service desk'],
        ['laravel', 'Explore the Laravel HR case study'],
        ['rls', 'How are IT records scoped?'],
        ['pooled', 'Inspect the pooled KPI ratio'],
        ['sankey', 'Trace funding through the Sankey'],
        ['rtl', 'Test right-to-left layouts'],
        ['dark', 'Switch to dark mode'],
        ['mit', 'Read the MIT license'],
    ];
    for (const [query, answer] of checks) {
        await search(page).fill(query);
        await expect(
            dialog.getByRole('group', { name: answerGroup }).getByRole('option').first(),
        ).toContainText(answer);
    }
    await search(page).fill('zzqqxxww');
    await expect(dialog.getByRole('status').filter({ hasText: 'No results' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await search(page).fill('cv');
    await expect(search(page)).toHaveAttribute('aria-activedescendant', 'ask-option-0');
    await page.keyboard.press('ArrowDown');
    await expect(search(page)).toHaveAttribute('aria-activedescendant', 'ask-option-1');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/cv\/?$/);
    await expect(page.getByRole('button', { name: 'Print / Save PDF' })).toBeVisible();
    const employer = page.getByLabel('Employer for private PDF');
    await employer.focus();
    await page.keyboard.type('k');
    await expect(dialog).not.toBeVisible();
    await page.keyboard.press('Meta+k');
    await expect(dialog).toBeVisible();
    await page.mouse.click(1, 1);
    await expect(dialog).not.toBeVisible();
    await expect(employer).toBeFocused();
});

test('command actions persist the theme and navigate to live indexed assets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 820 });
    await page.goto('/systems/');
    const dialog = page.getByRole('dialog', { name: 'Search Kharbout Works' });
    await page.getByRole('button', { name: 'Open command search' }).click();
    await search(page).fill('dark');
    await dialog.getByRole('option').filter({ hasText: 'Switch to dark mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Dark mode' })).toHaveAttribute(
        'aria-pressed',
        'true',
    );
    await page.reload();
    await page.keyboard.press('Control+k');
    await search(page).fill('dark');
    await expect(dialog.getByRole('option').first()).toContainText('Switch to light mode');
    await search(page).fill('config driven register');
    const asset = dialog
        .getByRole('option')
        .filter({ hasText: 'CSV Importer & Config-Driven Register' });
    await expect(asset).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
    await asset.click();
    await expect(page).toHaveURL(/\/vault\/#spreadsheet-importer-register$/);
    await expect(page.locator('article#spreadsheet-importer-register')).toBeVisible();
});

test('Arabic, keyboard layout and typo matches lead to the same indexed destination and update frecency', async ({
    page,
}) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Search Kharbout Works' });
    const assets = dialog.getByRole('group', { name: resultGroups[2] });
    await search(page).fill('السِّيرَة الذَّاتِيَّة');
    await expect(
        dialog.getByRole('group', { name: answerGroup }).getByRole('option').first(),
    ).toContainText('Open the print-ready CV');
    for (const query of ['الْعَائِـدَات', 'hguhz]hj', 'retrns']) {
        await search(page).fill(query);
        const first = assets.getByRole('option').first();
        await expect(first).toContainText('Bilingual Ask Palette');
        if (query !== 'retrns')
            await expect(first.locator('bdi[lang=ar] .ask-match').first()).toBeVisible();
    }
    await assets.getByRole('option').first().click();
    await expect(page).toHaveURL(/\/vault\/#bilingual-ask-palette$/);
    await page.keyboard.press('Control+k');
    await expect(assets.getByRole('option').first()).toContainText('Bilingual Ask Palette');
});

test('unreadable search index offers a retry and restores results for the pending query', async ({
    page,
}) => {
    let attempts = 0;
    await page.route('**/search-index.json', (route) => {
        if (++attempts === 1) return route.fulfill({ contentType: 'application/json', body: '{' });
        return route.continue();
    });
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Search Kharbout Works' });
    await expect(dialog.getByRole('alert')).toContainText('could not be loaded');
    await search(page).fill('cv');
    await dialog.getByRole('button', { name: 'Retry search' }).click();
    await expect(dialog.getByRole('alert')).not.toBeVisible();
    await expect(dialog.getByRole('option').first()).toContainText('Open the print-ready CV');
    expect(attempts).toBe(2);
});
