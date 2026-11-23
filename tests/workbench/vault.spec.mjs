import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const items = readdirSync('src/content/vault').filter(file => file.endsWith('.json')).map(file =>
    JSON.parse(readFileSync('src/content/vault/' + file, 'utf8')),
);
test('vault filters and empty state work at 375 pixels', async ({ page }) => {
    expect(items).toHaveLength(10);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/vault/');
    const nav = page.getByRole('navigation', { name: 'Component patterns' });
    await expect(nav.getByRole('link')).toHaveCount(10);
    await page.getByRole('button', { name: 'Forms & Guards' }).click();
    await expect(nav.getByRole('link')).toHaveCount(items.filter(item => item.category === 'Forms & Guards').length);
    await page.getByRole('searchbox').fill('qqzzzz');
    await expect(nav.getByRole('link')).toHaveCount(0);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(nav.getByRole('link')).toHaveCount(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

for (const item of items) {
    test(item.id + ' supports isolated widths, themes, directions and exact source copy', async ({ page, context }, info) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: info.project.use.baseURL });
        await page.setViewportSize({ width: 1536, height: 960 });
        await page.goto('/vault/#' + item.id);
        const card = page.locator('article#' + item.id);
        const frame = card.frameLocator('iframe');
        const view = frame.locator('html');
        await expect(view).toHaveAttribute('data-engine', item.previewEngine);
        await card.getByRole('button', { name: 'Tablet' }).click();
        await expect.poll(() => view.evaluate(el => el.clientWidth)).toBe(768);
        await card.getByRole('button', { name: 'Mobile' }).click();
        await expect.poll(() => view.evaluate(el => el.clientWidth)).toBe(375);
        for (const dir of ['RTL','LTR']) {
            await card.getByRole('button', { name: dir, exact: true }).click();
            await expect(view).toHaveAttribute('dir', dir.toLowerCase());
            expect(await view.evaluate(el => el.scrollWidth)).toBe(375);
        }
        await card.getByRole('button', { name: 'Dark', exact: true }).click();
        await expect(view).toHaveAttribute('data-theme', 'dark');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
        await card.getByRole('button', { name: 'Light', exact: true }).click();
        await card.getByRole('button', { name: 'Desktop' }).click();
        const snippets = [item.previewEngine === 'react' ? item.codeReact : item.codeAlpine,
            item.codeAlpine, item.codeReact, item.codeLivewirePhp + '\n\n' + item.codeLivewireBlade];
        const tabs = card.getByRole('tab');
        for (let index = 0; index < snippets.length; index++) {
            await tabs.nth(index).click();
            await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
            await card.getByRole('button', { name: 'Copy source' }).click();
            await expect(card.getByRole('status')).toHaveText('Source copied.');
            expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n','\n')).toBe(snippets[index]);
        }
        await page.getByRole('button', { name: 'Dark mode' }).click();
        const token = card.getByRole('tabpanel').locator('pre.astro-code span[style]').first();
        await expect(token).toBeVisible();
        expect(await token.evaluate(el => getComputedStyle(el).color)).not.toBe('rgba(0, 0, 0, 0)');
        expect(errors).toEqual([]);
    });
}
