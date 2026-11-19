import { expect, test } from '@playwright/test';

declare global {
    interface Window {
        vaultClipboardWrites: string[];
    }
}

const title = 'AI Skills, Gems & Command Vault';
const claudeWorkflow = 'Behavior-preserving refactor';
const geminiWorkflow = 'UI state specification';

test('filters with slash and opens the same drawer from the grid and palette', async ({ page }) => {
    await page.goto('/?q=url&category=utilities');
    const vault = page.getByRole('region', { name: title });
    const search = vault.getByRole('searchbox', { name: 'Search the Vault' });
    await expect(vault).toBeVisible();
    const initialCount = await vault.getByRole('article').count();
    await expect(vault.getByText(`${initialCount} workflows`, { exact: true })).toBeVisible();
    const decisionCard = vault
        .getByRole('article')
        .filter({ has: page.getByRole('button', { name: 'Architecture decision panel' }) });
    await expect(decisionCard.getByText(/Example tested$/)).toBeVisible();

    const catalogueSearch = page.getByRole('searchbox', { name: 'Search catalogue' });
    await catalogueSearch.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('/');
    await expect(catalogueSearch).toBeFocused();
    await expect(catalogueSearch).toHaveValue('url/');

    await page.locator('main').focus();
    await page.keyboard.press('/');
    await expect(search).toBeFocused();
    await search.fill('Claude #Réfact behavior-preserving');
    const match = vault.getByRole('button', { name: claudeWorkflow });
    await expect(vault.getByText('1 workflow', { exact: true })).toBeVisible();
    await search.press('ArrowDown');
    await expect(match).toBeFocused();
    await match.press('ArrowUp');
    await expect(search).toBeFocused();
    await search.press('Enter');

    const drawer = page.getByRole('dialog', { name: claudeWorkflow });
    await expect(drawer.getByRole('button', { name: 'Close' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(search).toBeFocused();

    await vault.getByRole('button', { name: 'Gemini Gems & Skills' }).click();
    await expect(vault.getByText('No matching workflows')).toBeVisible();
    await vault.getByRole('button', { name: 'Clear Vault filters' }).click();
    await expect(search).toHaveValue('');
    await expect(vault.getByText(`${initialCount} workflows`, { exact: true })).toBeVisible();

    await page.keyboard.press('Meta+k');
    const palette = page.getByRole('dialog', { name: 'Search catalogue' });
    const paletteSearch = palette.getByRole('combobox');
    await paletteSearch.fill('Claude #refactor');
    await expect(palette.getByRole('option', { selected: true })).toContainText(claudeWorkflow);
    await paletteSearch.press('Enter');
    await expect(palette).toHaveCount(0);
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(search).toBeFocused();
    await expect(page).toHaveURL(
        (url) =>
            url.pathname === '/' &&
            url.searchParams.get('q') === 'url' &&
            url.searchParams.get('category') === 'utilities',
    );
    await match.click();
    await expect(drawer).toBeVisible();
    await page.mouse.click(5, 10);
    await expect(drawer).toHaveCount(0);
    await expect(match).toBeFocused();
});

test('highlights literal substitutions and copies the compiled prompt from either view', async ({
    page,
}) => {
    await page.addInitScript(() => {
        window.vaultClipboardWrites = [];
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText(text: string) {
                    window.vaultClipboardWrites.push(text);
                    return new Promise<void>((resolve) => {
                        window.addEventListener('vault-clipboard-confirm', () => resolve(), {
                            once: true,
                        });
                    });
                },
            },
        });
    });
    await page.goto('/');
    const opener = page.getByRole('button', { name: claudeWorkflow });
    await opener.click();
    const drawer = page.getByRole('dialog', { name: claudeWorkflow });
    await drawer.getByRole('button', { name: 'Fill with examples' }).click();
    const stack = drawer.getByRole('textbox', { name: 'Target stack' });
    const targetCode = drawer.getByRole('textbox', { name: 'Target code or paths' });
    const literal = 'Laravel $& {{TARGET_CODE}} <b>literal</b>';
    const multiline = '  first line\nsecond line  ';
    await stack.fill(literal);
    await targetCode.fill(multiline);

    const instructions = drawer.getByRole('tab', { name: 'Prompt Instructions' });
    const preview = drawer.getByRole('tab', { name: 'Sample Output Preview' });
    const source = drawer.getByRole('tabpanel', { name: 'Prompt Instructions' }).locator('pre');
    await expect(source.locator('mark').first()).toHaveText(literal);
    const compiled = await source.textContent();
    expect(compiled).toContain(multiline);
    expect(compiled).toContain(literal);

    await instructions.focus();
    await instructions.press('ArrowRight');
    await expect(preview).toBeFocused();
    await expect(preview).toHaveAttribute('aria-selected', 'true');
    const sample = drawer.getByRole('tabpanel', { name: 'Sample Output Preview' });
    await expect(sample).toContainText(/simulated/i);
    await expect(sample).toContainText('Extract validation and event dispatch');
    await expect(sample).toContainText('Repeat IDs return the original reservation');

    const copy = drawer.locator('.vault-primary');
    await copy.click();
    await expect(copy).toBeDisabled();
    await expect(copy).toBeFocused();
    expect(await page.evaluate(() => window.vaultClipboardWrites)).toEqual([compiled]);
    await page.evaluate(() => window.dispatchEvent(new Event('vault-clipboard-confirm')));
    await expect(copy).toHaveText(/Copied to clipboard/);
    await expect(copy).toBeFocused();

    await instructions.click();
    await copy.click();
    await expect(copy).toBeDisabled();
    await stack.fill('Updated stack');
    await page.evaluate(() => window.dispatchEvent(new Event('vault-clipboard-confirm')));
    await expect(copy).toHaveText('Copy compiled prompt');
    await expect(copy).toBeEnabled();
    await expect(stack).toBeFocused();
    await drawer.getByText('How to install this', { exact: true }).click();
    await expect(drawer.getByText(/Create .claude\/skills/)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
});

for (const [workflow, provider, url] of [
    [claudeWorkflow, 'Claude', 'https://claude.ai/new'],
    [geminiWorkflow, 'Gemini', 'https://gemini.google.com/app'],
] as const) {
    test(`copies and opens ${provider} in a new tab`, async ({ page, context }) => {
        await page.addInitScript(() => {
            window.vaultClipboardWrites = [];
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    async writeText(text: string) {
                        window.vaultClipboardWrites.push(text);
                    },
                },
            });
        });
        await context.route(url, (route) => route.fulfill({ body: 'Provider launch target' }));
        await page.goto('/');
        await page.getByRole('button', { name: workflow }).click();
        const drawer = page.getByRole('dialog', { name: workflow });
        const compiled = await drawer
            .getByRole('tabpanel', { name: 'Prompt Instructions' })
            .locator('pre')
            .textContent();
        const popup = context.waitForEvent('page');
        await drawer.getByRole('link', { name: `Open in ${provider}` }).click();
        const destination = await popup;
        await expect(destination).toHaveURL(url);
        expect(await page.evaluate(() => window.vaultClipboardWrites)).toEqual([compiled]);
    });
}

test('keeps the compiled instructions accessible when clipboard access is denied', async ({
    page,
}) => {
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: () => Promise.reject(new DOMException('Blocked', 'NotAllowedError')),
            },
        });
    });
    await page.goto('/');
    await page.getByRole('button', { name: geminiWorkflow }).click();
    const drawer = page.getByRole('dialog', { name: geminiWorkflow });
    await drawer.getByRole('tab', { name: 'Sample Output Preview' }).click();
    const copy = drawer.getByRole('button', { name: 'Copy compiled prompt' });
    await copy.click();
    await expect(drawer.getByRole('status')).toContainText(/manually|select/i);
    await expect(copy).toBeFocused();
    await expect(copy).toBeEnabled();
    await expect(drawer.getByRole('tabpanel', { name: 'Prompt Instructions' })).toBeVisible();
});

test('fits the Arabic vault at 320px and preserves source direction', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: 320, height: 640 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Language' }).selectOption('ar');
    const vault = page.locator('#ai-vault');
    const opener = vault.getByRole('button', { name: geminiWorkflow });
    await expect(vault).toHaveCSS('direction', 'rtl');
    await expect(opener).toBeVisible();
    await opener.click();

    const drawer = page.getByRole('dialog', { name: geminiWorkflow });
    await expect(drawer).toHaveCSS('direction', 'rtl');
    await expect(drawer.locator('pre:visible')).toHaveCSS('direction', 'ltr');
    const bounds = await drawer.boundingBox();
    expect(bounds?.width).toBe(320);
    expect(bounds?.x).toBe(0);
    expect(await drawer.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(
        await drawer
            .locator('.vault-drawer-body')
            .evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    await expect(drawer.locator('.vault-primary')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
    );
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    expect(errors).toEqual([]);
});

test('allows the entire German drawer to scroll in a short viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
    const opener = page.getByRole('button', { name: geminiWorkflow });
    await opener.click();
    const drawer = page.getByRole('dialog', { name: geminiWorkflow });
    await expect(drawer).toHaveCSS('overflow-y', 'auto');
    await expect(drawer.getByRole('tab', { name: 'Beispielausgabe' })).toBeVisible();

    const setup = drawer.getByText('So richtest du es ein', { exact: true });
    await setup.click();
    await expect(drawer.locator('.vault-setup li').first()).toBeVisible();
    await expect(drawer.locator('.vault-primary')).toBeEnabled();
    expect(await drawer.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
});
