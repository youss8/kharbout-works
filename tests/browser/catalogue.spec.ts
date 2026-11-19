import { expect, test } from '@playwright/test';

test('language selection survives navigation and reload and sets the correct reading direction', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Language' }).selectOption('ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await page.locator('a[href="/entries/copy-code"]').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('نسخ الشيفرة');
    await page.reload();
    await expect(page.getByRole('button', { name: 'نسخ JavaScript', exact: true })).toBeVisible();
    await page.getByRole('combobox').selectOption('de');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Code kopieren');
});

test('a category can be shared, refined and cleared', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Utilities', exact: true }).click();
    await expect(page).toHaveURL(/category=utilities/);
    await page.reload();
    await expect(
        page.getByRole('link', { name: 'Shareable URL filters', exact: true }),
    ).toBeVisible();
    const query = page.getByRole('searchbox', { name: 'Search catalogue' });
    await query.fill('no-such-example');
    await query.press('Enter');
    await expect(page.getByRole('heading', { name: 'No matching entries' })).toBeVisible();
    await page.goBack();
    await expect(query).toHaveValue('');
    await expect(
        page.getByRole('link', { name: 'Shareable URL filters', exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Clear filters' }).click();
    await expect(page.getByRole('status')).toHaveText('7 entries');
});

test('a visitor can open every recipe on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    const links = page.locator('a[href^="/entries/"]');
    await expect(links.first()).toBeVisible();
    const paths = new Set(
        await links.evaluateAll((items) => items.map((item) => item.getAttribute('href')!)),
    );
    expect(paths.size).toBe(7);
    for (const path of paths) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
            true,
        );
        await page.getByRole('combobox').selectOption('ar');
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
            true,
        );
        await page.getByRole('combobox').selectOption('en');
    }
    expect(errors).toEqual([]);
});
