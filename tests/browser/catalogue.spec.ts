import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

function topWithinCard(locator: Locator) {
    return locator.evaluate(
        (element) =>
            element.getBoundingClientRect().top -
            element.closest('article')!.getBoundingClientRect().top,
    );
}

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

test('the gallery lifts the preview on hover and keyboard focus while its title stays in place', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const catalogue = page.getByRole('region', { name: 'Catalogue', exact: true });
    const card = catalogue.getByRole('article').filter({
        has: page.getByRole('link', { name: 'Copy code', exact: true }),
    });
    const title = card.getByRole('heading');
    const preview = card.locator('.browse-preview');
    const sample = preview.locator(':scope > :first-child');
    await card.evaluate((element) =>
        element.scrollIntoView({ block: 'start', behavior: 'instant' }),
    );
    const mastheadBottom = await page
        .getByRole('banner')
        .evaluate((element) => element.getBoundingClientRect().bottom);
    await expect
        .poll(() =>
            catalogue.getByRole('navigation').evaluate((row) => row.getBoundingClientRect().top),
        )
        .toBeCloseTo(mastheadBottom, 0);
    const restingSample = await topWithinCard(sample);
    const restingTitle = await topWithinCard(title);

    const center = await preview.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    await page.mouse.move(center.x, center.y);
    await expect.poll(() => topWithinCard(sample)).toBeLessThan(restingSample - 2);
    expect(await topWithinCard(title)).toBeCloseTo(restingTitle, 1);
    await page.mouse.move(0, 0);
    await expect.poll(() => topWithinCard(sample)).toBeCloseTo(restingSample, 1);

    await catalogue.getByRole('navigation').getByRole('link').last().focus();
    await page.keyboard.press('Tab');
    await expect(card.getByRole('link')).toBeFocused();
    await expect.poll(() => topWithinCard(sample)).toBeLessThan(restingSample - 2);
    expect(await topWithinCard(title)).toBeCloseTo(restingTitle, 1);

    // The accessibility-hidden illustration shares the real title link's pointer target.
    await preview.click({ force: true });
    await expect(page).toHaveURL(/\/entries\/copy-code$/);
});

test.describe('narrow touch gallery with reduced motion', () => {
    test.use({ viewport: { width: 320, height: 640 }, hasTouch: true, reducedMotion: 'reduce' });

    test('Arabic keyboard navigation reveals the last filter and its preview opens by touch', async ({
        page,
    }) => {
        await page.goto('/');
        await page.getByRole('combobox', { name: 'Language' }).selectOption('ar');
        const catalogue = page.getByRole('region', { name: 'الفهرس', exact: true });
        const shelf = catalogue.getByRole('navigation', { name: 'تصفية حسب الفئة' });
        const filters = shelf.getByRole('link');
        const last = shelf.getByRole('link', { name: 'أدوات الذكاء الاصطناعي' });
        await filters.first().focus();
        await expect(filters.first()).toBeInViewport({ ratio: 0.95 });
        await expect(last).not.toBeInViewport({ ratio: 0.95 });
        const filterCount = await filters.count();
        for (let index = 1; index < filterCount; index++) await page.keyboard.press('Tab');
        await expect(last).toBeFocused();
        await expect(last).toBeInViewport({ ratio: 0.95 });
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/category=ai-tools/);
        await expect(last).toHaveAttribute('aria-current', 'true');

        const card = catalogue.getByRole('article');
        await expect(card).toHaveCount(1);
        await card.scrollIntoViewIfNeeded();
        const preview = card.locator('.browse-preview');
        const sample = preview.locator(':scope > :first-child');
        const restingSample = await topWithinCard(sample);
        await card.getByRole('link').focus();
        expect(await sample.evaluate((element) => element.getAnimations().length)).toBe(0);
        expect(await topWithinCard(sample)).toBeCloseTo(restingSample, 1);
        await preview.tap({ force: true });
        await expect(page).toHaveURL(/\/entries\/accessible-ui-review$/);
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    });
});
