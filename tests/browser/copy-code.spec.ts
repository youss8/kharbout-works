import { expect, test } from '@playwright/test';

declare global {
    interface Window {
        clipboardWrites?: string[];
    }
}

const shortcutEntry = '/entries/keyboard-shortcut-label';

test('localizes the downloadable shortcut preview and keeps the original source', async ({
    page,
}) => {
    await page.goto(shortcutEntry);
    const preview = page.getByRole('figure').locator('.command');
    const source = page.locator('pre').filter({ hasText: '<!doctype html>' });
    for (const [locale, label, modifier] of [
        ['en', 'Open search', 'Ctrl'],
        ['de', 'Suche öffnen', 'Strg'],
        ['ar', 'افتح البحث', 'Ctrl'],
    ] as const) {
        await page.locator('.language-select').selectOption(locale);
        await expect(preview.locator('.command-label')).toHaveText(label);
        await expect(preview.locator('kbd').first()).toHaveText(modifier);
        await expect(preview.locator('.keys')).toHaveAttribute('dir', 'ltr');
        await expect(source).toHaveAttribute('dir', 'ltr');
        await expect(source).toContainText('Open search');
    }
});

test('copies the selected example exactly and waits for the browser to confirm', async ({
    page,
}) => {
    await page.addInitScript(() => {
        const writes: string[] = [];
        Object.assign(window, { clipboardWrites: writes });
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText(text: string) {
                    writes.push(text);
                    return new Promise<void>((resolve) => {
                        window.addEventListener('confirm-clipboard', () => resolve(), {
                            once: true,
                        });
                    });
                },
            },
        });
    });
    await page.goto(shortcutEntry);
    const html = page.getByRole('button', { name: 'Copy HTML', exact: true });
    const css = page.getByRole('button', { name: 'Copy CSS', exact: true });
    const expectedWrites: string[] = [];

    for (const [label, button] of [
        ['HTML', html],
        ['CSS', css],
    ] as const) {
        const source = await page
            .getByLabel(`${label} example`, { exact: true })
            .locator('code')
            .textContent();
        if (source === null) throw new Error(`Missing ${label} source`);
        expect(source).toContain('\n');
        await button.focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('status').filter({ hasText: 'Copying…' })).toHaveCount(1);
        await expect(button).toBeDisabled();
        await expect(label === 'HTML' ? css : html).toBeEnabled();
        await expect(page.getByText(`Copied ${label}.`, { exact: true })).toHaveCount(0);
        await button.dispatchEvent('click');
        expectedWrites.push(source);
        const writes = await page.evaluate(() => window.clipboardWrites);
        expect(writes).toEqual(expectedWrites);
        await page.evaluate(() => window.dispatchEvent(new Event('confirm-clipboard')));
        await expect(page.getByRole('status').filter({ hasText: `Copied ${label}.` })).toHaveCount(
            1,
        );
        await expect(button).toBeFocused();
        await expect(button).toBeEnabled();
    }
    await expect(page.getByText('Copied HTML.', { exact: true })).toBeVisible();
});

for (const mode of ['unavailable', 'denied'] as const) {
    test(`keeps code available for manual copy when the clipboard is ${mode}`, async ({ page }) => {
        await page.addInitScript((mode) => {
            Object.defineProperty(navigator, 'clipboard', {
                value:
                    mode === 'unavailable'
                        ? undefined
                        : {
                              writeText: () =>
                                  Promise.reject(new DOMException('Blocked', 'NotAllowedError')),
                          },
            });
        }, mode);
        await page.goto(shortcutEntry);
        const button = page.getByRole('button', { name: 'Copy HTML', exact: true });
        await button.click();
        await expect(
            page.getByRole('status').filter({ hasText: 'Couldn’t copy HTML.' }),
        ).toContainText('Select the code');
        await expect(page.getByLabel('HTML example', { exact: true })).toBeVisible();
        await expect(button).toBeEnabled();
        await expect(page.getByText('Copied HTML.', { exact: true })).toHaveCount(0);
    });
}

test('publishes the component source and stylesheet with the working preview', async ({ page }) => {
    await page.goto('/entries/copy-code');
    await expect(page.getByRole('button', { name: 'Copy JavaScript', exact: true })).toBeVisible();
    await page.getByText('View component source', { exact: true }).click();
    await expect(page.getByLabel('CopyCodeButton.tsx example')).toContainText(
        'navigator.clipboard.writeText(code)',
    );
    await page.getByText('View stylesheet', { exact: true }).click();
    await expect(page.getByLabel('copy-code.css example')).toContainText('.copy-code button');
});
