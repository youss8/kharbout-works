import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { build, preview } from 'vite';

test('a visitor discovers the dialog, downloads it and uses the extracted reading list', async ({
    page,
}, testInfo) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/entries/copy-code');
    await expect(page.getByRole('button', { name: 'Search catalogue', exact: true })).toBeVisible();
    await page.keyboard.press('Control+k');
    const input = page.getByRole('combobox', { name: 'Search entries' });
    await expect(input).toBeFocused();
    await input.fill('Keyboard search dialog');
    await expect(page.getByRole('dialog').getByRole('option', { selected: true })).toContainText(
        'Keyboard search dialog',
    );
    await input.press('Enter');
    await expect(page).toHaveURL(/\/entries\/search-dialog$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Keyboard search dialog');

    const trigger = page.getByRole('button', { name: 'Search reading list' });
    await trigger.click();
    const books = page.getByRole('combobox', { name: 'Search books' });
    await books.fill('harbour');
    await books.press('Enter');
    await expect(page.getByRole('status', { name: 'Selected book' })).toHaveText(
        'The Lantern Atlas',
    );
    await expect(trigger).toBeFocused();

    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download source (.zip)', exact: true }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('search-dialog.zip');
    const zip = testInfo.outputPath('search-dialog.zip');
    const directory = testInfo.outputPath('reading-list');
    await download.saveAs(zip);
    await mkdir(directory);
    execFileSync('php', ['-r', '(new PharData($argv[1]))->extractTo($argv[2]);', zip, directory]);

    // Compile the downloaded host with CI's installed dependencies and Vite's standalone defaults.
    const config = { root: directory, configFile: false, logLevel: 'error' } as const;
    await build(config);
    const standalone = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } });
    try {
        const url = standalone.resolvedUrls?.local[0];
        if (!url) throw new Error('Vite did not report a local URL for the extracted example.');
        await page.goto(url);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Reading list');
        const opener = page.getByRole('button', { name: 'Search reading list' });
        await opener.focus();
        await page.keyboard.press('Meta+k');
        const search = page.getByRole('combobox', { name: 'Search entries' });
        await expect(search).toBeFocused();
        await search.fill('harbour');
        await search.press('Enter');
        await expect(page.getByRole('status', { name: 'Selected book' })).toHaveText(
            'The Lantern Atlas',
        );
        await expect(opener).toBeFocused();
        await page.keyboard.press('Control+k');
        await search.fill('zzz');
        await expect(page.getByRole('dialog').getByRole('status')).toContainText('No results');
        await search.press('Escape');
        await expect(opener).toBeFocused();
        expect(pageErrors).toEqual([]);
    } finally {
        await standalone.close();
    }
});

test('search preserves the shared Browse URL and restores focus to each opener', async ({
    page,
}) => {
    await page.goto('/?q=url&category=utilities');
    const browseInput = page.getByRole('searchbox', { name: 'Search catalogue' });
    await browseInput.focus();
    await page.keyboard.press('Meta+k');
    const dialog = page.getByRole('dialog', { name: 'Search catalogue' });
    const search = dialog.getByRole('combobox');
    await expect(search).toBeFocused();
    const active = dialog.getByRole('option', { selected: true });
    const first = await active.innerText();
    await search.press('ArrowDown');
    await expect(active).not.toHaveText(first, { useInnerText: true });
    await search.press('ArrowUp');
    await expect(active).toHaveText(first, { useInnerText: true });
    await search.fill('no-book-with-this-title');
    await expect(dialog.getByRole('option')).toHaveCount(0);
    await expect(dialog.getByRole('status')).toContainText('No results');
    await search.press('Enter');
    await expect(dialog).toBeVisible();
    await search.press('Escape');
    await expect(browseInput).toBeFocused();
    await expect(browseInput).toHaveValue('url');
    await expect(page).toHaveURL(
        (url) =>
            url.pathname === '/' &&
            url.searchParams.get('q') === 'url' &&
            url.searchParams.get('category') === 'utilities',
    );

    const trigger = page.getByRole('button', { name: 'Search catalogue', exact: true });
    await trigger.click();
    await expect(search).toHaveValue('');
    await search.press('Shift+Tab');
    const close = dialog.getByRole('button', { name: 'Close' });
    await expect(close).toBeFocused();
    await close.press('Enter');
    await expect(trigger).toBeFocused();
});

test('a missing entry has no downloadable archive', async ({ page }) => {
    const response = await page.goto('/entries/missing-reading-list/download');
    expect(response?.status()).toBe(404);
});

for (const [language, term, entry, direction] of [
    ['de', 'Tastatursteuerung', 'Suchdialog mit Tastatursteuerung', 'ltr'],
    ['ar', 'مربع البحث', 'مربع البحث بلوحة المفاتيح', 'rtl'],
] as const) {
    test(`the ${language} dialog fits a phone and opens a translated entry`, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto('/entries/keyboard-shortcut-label');
        await page.getByRole('combobox', { name: 'Language' }).selectOption(language);
        await expect(page.locator('html')).toHaveAttribute('dir', direction);
        await page.keyboard.press('Control+k');
        const dialog = page.getByRole('dialog');
        await expect(dialog).toHaveCSS('direction', direction);
        const search = dialog.getByRole('combobox');
        await search.fill(term);
        const result = dialog.getByRole('option').filter({ hasText: entry });
        await expect(result).toBeVisible();
        expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
            true,
        );
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
            true,
        );
        await result.click();
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry);
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await page.getByText('SearchDialog.tsx', { exact: true }).first().click();
        const source = page.locator('pre').filter({ hasText: 'function SearchDialog(' });
        await expect(source).toBeVisible();
        await expect(source).toHaveCSS('direction', 'ltr');
    });
}
