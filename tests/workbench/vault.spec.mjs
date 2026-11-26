import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const items = readdirSync('src/content/vault',{withFileTypes:true}).filter(file => file.isDirectory()).map(file =>
    JSON.parse(readFileSync('src/content/vault/' + file.name + '/kit.json', 'utf8')),
).sort((a,b)=>a.order-b.order);

test.describe('vault without client scripts', () => {
    test.use({ javaScriptEnabled: false });
    test('all twenty register links reach visible descriptions and source', async ({ page }) => {
        await page.goto('/vault/');
        const links = page.getByRole('navigation', { name: 'Component patterns' }).getByRole('link');
        await expect(links).toHaveCount(items.length);
        for (const item of items) {
            await page.locator('.kit-gallery [href="#' + item.id + '"]').click();
            await expect(page).toHaveURL(new RegExp('#' + item.id + '$'));
            const article = page.locator('#' + item.id);
            await expect(article.getByRole('heading', { name: item.title })).toBeVisible();
            await expect(article.getByRole('link', { name: 'React source' })).toHaveAttribute('href', '/vault/source/' + item.id + '/react/');
        }
    });
});

test('standalone kit source has a title and copies one complete file', async ({ context, page }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/vault/source/status-tone-vocabulary/alpine/');
    await expect(page).toHaveTitle(/Alpine source/);
    const file = page.locator('.source-file').first();
    const original = await file.locator('pre code').textContent();
    await file.getByRole('button', { name: 'Copy file' }).press('Enter');
    await expect(page.locator('[data-source-reader] .feedback')).toHaveText('Source copied.');
    expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n')).toBe(original);
    const outline = page.getByRole('navigation', { name: 'Files in this implementation' });
    const secondFile = outline.getByRole('link').nth(1);
    const sectionId = await secondFile.getAttribute('href');
    await secondFile.press('Enter');
    await expect(page.locator(sectionId + ' .file-label')).toBeInViewport();
    await page.getByRole('link', { name: 'React source', exact: true }).click();
    await page.getByRole('link', { name: 'Live preview', exact: true }).click();
    await expect(page.getByRole('link', { name: 'View source' })).toHaveAttribute('href', /status-tone-vocabulary\/react\/$/);
});

test('a filtered kit URL opens the active kit and back restores the previous selection', async ({ browser, page }) => {
    await page.goto('/vault/#spreadsheet-importer-register');
    await expect(page.locator('#spreadsheet-importer-register')).toBeVisible();
    await page.getByRole('link', { name: 'Back to kit gallery' }).press('Enter');
    await page.getByRole('button', { name: 'T1 Primitives' }).click();
    const gallery = page.getByRole('navigation', { name: 'Component patterns' });
    await expect(gallery.getByRole('link')).toHaveCount(5);
    await gallery.locator('[href="#status-tone-vocabulary"]').press('Enter');
    await expect(page).toHaveURL(/#status-tone-vocabulary$/);
    await expect(page.locator('#status-tone-vocabulary')).toBeFocused();
    const fresh = await browser.newPage();
    await fresh.goto(page.url());
    await expect(fresh.locator('#status-tone-vocabulary')).toBeVisible();
    await fresh.close();
    await page.reload();
    await expect(page.locator('#status-tone-vocabulary')).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('button', { name: 'T1 Primitives' })).toHaveAttribute('aria-pressed', 'true');
    await expect(gallery.getByRole('link')).toHaveCount(5);
    await page.goBack();
    await expect(page.getByRole('button', { name: 'T1 Primitives' })).toHaveAttribute('aria-pressed', 'false');
    await page.goBack();
    await expect(page.locator('#spreadsheet-importer-register')).toBeVisible();
    await page.goForward();
    await page.goForward();
    await expect(page.getByRole('button', { name: 'T1 Primitives' })).toHaveAttribute('aria-pressed', 'true');
    await page.goForward();
    await expect(page.locator('#status-tone-vocabulary')).toBeVisible();
});

for (const engine of ['alpine', 'react']) {
    test(engine + ' legacy previews expose spaced buttons and a keyboard-scrolling quote', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 740 });
        await page.goto('/vault/preview/config-driven-register/?engine=' + engine);
        const edit = page.getByRole('button', { name: 'Edit NH-WS-014' });
        const history = page.getByRole('button', { name: 'History for NH-WS-014' });
        for (const button of [edit, history]) {
            await expect(button).toBeVisible();
            const bounds = await button.boundingBox();
            expect(bounds?.width).toBeGreaterThanOrEqual(24);
            expect(bounds?.height).toBeGreaterThanOrEqual(24);
            await button.click();
            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
        }
        await page.goto('/vault/preview/live-quoting-composer/?engine=' + engine);
        await page.getByLabel('Through').fill('2027-01-31');
        const quote = page.getByRole('region', { name: 'Quote breakdown' });
        await expect(quote).toHaveAttribute('tabindex', '0');
        await expect.poll(() => quote.evaluate(el => el.scrollHeight - el.clientHeight)).toBeGreaterThan(0);
        await quote.press('End');
        await expect.poll(() => quote.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    });
}
test('an original extraction ID opens its curated example in either implementation', async ({page}) => {
    await page.goto('/vault/');
    await page.getByRole('searchbox').fill('PT-25');
    const nav = page.getByRole('navigation', {name:'Component patterns'});
    await expect(nav.getByRole('link')).toHaveCount(1);
    await nav.getByRole('link').click();
    const card = page.locator('#office-pdf-preview');
    await expect(card.getByText('Source entries · PT-25')).toBeVisible();
    await card.getByRole('button', {name:'Dark',exact:true}).click();
    await card.getByRole('button', {name:'RTL',exact:true}).click();
    for (const engine of ['react','alpine']) {
        await card.getByLabel('Preview implementation').selectOption(engine);
        const frame = card.frameLocator('iframe');
        await expect(frame.locator('html')).toHaveAttribute('data-engine',engine);
        await expect(frame.locator('html')).toHaveAttribute('data-theme','dark');
        await expect(frame.locator('html')).toHaveAttribute('dir','rtl');
        await expect(frame.getByRole('button', {name:'Open file preview'})).toBeVisible();
    }
});

test('each preview fetches only the chosen engine', async ({ page }) => {
    const scripts = new Set();
    page.on('request', (request) => {
        if (request.resourceType() === 'script') scripts.add(new URL(request.url()).pathname);
    });
    const path = '/vault/preview/status-tone-vocabulary/';
    await page.goto(path + '?engine=alpine');
    await expect(page.getByLabel('Place in-progress work on hold')).toBeVisible();
    expect([...scripts].some((file) => /ReactExample|react-dom|jsx-runtime/.test(file))).toBe(false);
    scripts.clear();
    await page.goto(path + '?engine=react');
    await expect(page.getByLabel('Place in-progress work on hold')).toBeVisible();
    expect([...scripts].some((file) => /ReactExample/.test(file))).toBe(true);
    expect([...scripts].some((file) => /alpine/i.test(file))).toBe(false);
});

test('embedded preview isolates browser storage and keeps its own saved layout', async ({ page }) => {
    await page.goto('/vault/#flush-row-desk-grid');
    const kit = page.locator('#flush-row-desk-grid');
    const preview = kit.frameLocator('iframe');
    await expect(kit.locator('iframe')).toHaveAttribute('sandbox', /allow-scripts/);
    await expect(kit.locator('iframe')).not.toHaveAttribute('sandbox', /allow-same-origin/);
    await expect(preview.getByRole('button', { name: 'Customize grid' })).toBeVisible();
    expect(await preview.locator('html').evaluate(() => {
        try {
            localStorage.getItem('qa-example-preference');
            return false;
        } catch (error) {
            return error instanceof DOMException && error.name === 'SecurityError';
        }
    })).toBe(true);
    await preview.getByRole('button', { name: 'Customize grid' }).click();
    await preview.getByRole('button', { name: 'Grow Monthly returns' }).click();
    await preview.getByRole('button', { name: 'Done' }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('vault.operations-desk.v1'))).toContain('8');
    await page.reload();
    await expect(preview.locator('[data-grid-panel]').first()).toContainText('8/12');
    await kit.getByRole('button', { name: 'Dark', exact: true }).click();
    await kit.getByRole('button', { name: 'RTL', exact: true }).click();
    await expect(preview.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(preview.locator('html')).toHaveAttribute('dir', 'rtl');
});
test('vault filters and empty state work at 375 pixels', async ({ page }) => {
    expect(items.map(item=>item.order)).toEqual(Array.from({length:20},(_,i)=>i+1));
    expect([1,2,3,4].map(t=>items.filter(item=>item.tier===t).length)).toEqual([5,6,5,4]);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/vault/');
    const nav = page.getByRole('navigation', { name: 'Component patterns' });
    await expect(nav.getByRole('link')).toHaveCount(20);
    await page.getByRole('button',{name:'T2 Controls & Guards'}).click();
    await expect(nav.getByRole('link')).toHaveCount(6);
    await page.getByRole('button', { name: 'Filters', exact: true }).press('Enter');
    await page.getByLabel('Source system').selectOption('SYS-03');
    await expect(nav.getByRole('link')).toHaveCount(items.filter(item=>item.tier===2 && item.sourceSystems.includes('SYS-03')).length);
    await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('Tables & Queues');
    await expect(nav.getByRole('link')).toHaveCount(items.filter(item => item.tier === 2 && item.sourceSystems.includes('SYS-03') && item.category === 'Tables & Queues').length);
    await page.getByRole('searchbox').fill('assignee');
    await expect(nav.getByRole('link')).toHaveCount(1);
    await page.getByRole('searchbox').fill('no matching kit');
    await page.getByRole('button',{name:'Clear filters'}).click();
    await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption('Forms & Guards');
    await expect(nav.getByRole('link')).toHaveCount(items.filter(item => item.category === 'Forms & Guards').length);
    await page.getByRole('searchbox').fill('qqzzzz');
    await expect(nav.getByRole('link')).toHaveCount(0);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(nav.getByRole('link')).toHaveCount(20);
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
        await card.getByRole('button',{name:'Grayscale'}).click();
        await expect(card.locator('iframe')).toHaveCSS('filter','grayscale(1)');
        await expect(card.getByText(item.provenance === 'observed' ? 'Observed in Codebase' : 'Observed + Clean-Room [spec]',{exact:true})).toBeVisible();
        const tabs = card.getByRole('tab');
        for (let index = 0; index < 4; index++) {
            await tabs.nth(index).click();
            await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
            await card.getByRole('button', { name: 'Copy source' }).click();
            await expect(card.getByRole('status')).toHaveText('Source copied.');
            const sourcePanel = card.locator('[data-source]').nth((index || (item.previewEngine === 'react' ? 2 : 1))-1);
            const paths = await sourcePanel.locator('.file-label').allTextContents();
            expect(paths.length).toBeGreaterThan(0);
            const files = paths.map(path=>readFileSync(path,'utf8').replaceAll('\r\n','\n').trimEnd());
            expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n','\n')).toBe(files.join('\n\n'));
        }
        await page.getByRole('button', { name: 'Dark mode' }).click();
        const token = card.getByRole('tabpanel').locator('pre.astro-code span[style]').first();
        await expect(token).toBeVisible();
        expect(await token.evaluate(el => getComputedStyle(el).color)).not.toBe('rgba(0, 0, 0, 0)');
        expect(errors).toEqual([]);
    });
}
