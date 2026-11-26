import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const cases = ['01-it-ops-helpdesk', '02-hr-lifecycle-crm', '03-portfolio-kpi-engine'];
test('fixtures and ER sources match the handoff verbatim', () => {
    const read = file => readFileSync(file, 'utf8').replaceAll('\r\n', '\n').trimEnd();
    const spec = read('HANDOFF_MASTER_SPEC.md');
    const fixtures = [...spec.matchAll(/Verbatim Synthetic Dataset \(`([^\x60]+)`\):\*\*\s*```json\n([\s\S]*?)\n```/g)];
    expect(fixtures).toHaveLength(6);
    for (const [, path, content] of fixtures) {
        expect(read(path)).toBe(content);
        expect(JSON.parse(content)).toBeTruthy();
    }
    const diagrams = [...spec.matchAll(/```mermaid\n([\s\S]*?)\n```/g)];
    expect(diagrams).toHaveLength(cases.length);
    diagrams.forEach(([, content], i) => expect(read('src/data/diagrams/sys0' + (i + 1) + '.mmd')).toBe(content));
});

test('synthetic branch allocations reconcile with the original estate fixture', () => {
    const read = name => JSON.parse(readFileSync(`src/data/demos/${name}.json`, 'utf8'));
    const estate = read('it-estate-ops');
    const allocations = read('it-estate-branches');
    const branches = Object.values(allocations);
    expect(Object.keys(allocations).sort()).toEqual(estate.branches.map(branch => branch.id).sort());
    expect(branches.reduce((sum, branch) => sum + branch.assets, 0)).toBe(estate.assets.total);
    expect(branches.reduce((sum, branch) => sum + branch.failedCommands, 0)).toBe(estate.commands.failed_last_24h);
    expect(branches.flatMap(branch => branch.loanIds).sort()).toEqual(estate.loans.map(loan => loan.id).sort());
    expect(branches.flatMap(branch => branch.licenseIds).sort()).toEqual(estate.licenses.map(license => license.id).sort());
    expect(branches.flatMap(branch => branch.backupNames).sort()).toEqual(estate.backups.map(backup => backup.name).sort());
    for (const branch of branches) expect(branch.ticketFlow.map(row => row.day)).toEqual(estate.ticketFlow.map(row => row.day));
    for (const [index, day] of estate.ticketFlow.entries()) {
        expect(branches.reduce((sum, branch) => sum + branch.ticketFlow[index].opened, 0)).toBe(day.opened);
        expect(branches.reduce((sum, branch) => sum + branch.ticketFlow[index].resolved, 0)).toBe(day.resolved);
    }
});

test('matrix links reach all six sandboxes', async ({ page }) => {
    await page.goto('/systems/');
    const links = await page.locator('a.table-link').evaluateAll(items => items.map(item => item.href));
    expect(new Set(links).size).toBe(6);
    for (const href of links) {
        const response = await page.goto(href);
        if (response) expect(response.status()).toBe(200);
        await expect(page.locator(new URL(href).hash)).toBeVisible();
    }
});

test('a problem selection exposes its two workflows and follows browser history', async ({ page }) => {
    await page.goto('/systems/');
    const picker = page.getByRole('navigation', { name: 'Choose a problem' });
    const choice = picker.getByRole('link', { name: /Manage leave and attendance/ });
    await choice.press('Enter');
    const hr = page.locator('[id="02-hr-lifecycle-crm"]');
    await expect(hr).toBeVisible();
    await expect(hr.getByRole('navigation').getByRole('link')).toHaveCount(2);
    await expect(choice).toHaveAttribute('aria-current', 'location');
    await picker.getByRole('link', { name: /Run an IT service desk/ }).click();
    await expect(hr).toBeHidden();
    await page.goBack();
    await expect(hr).toBeVisible();
    await page.reload();
    await expect(hr).toBeVisible();
});

test('expanded demo retains the edited leave quote and returns to its launch control', async ({ page }) => {
    await page.goto('/systems/02-hr-lifecycle-crm/#leave-engine');
    const demo = page.locator('#leave-engine');
    const expand = demo.getByRole('button', { name: 'Expand demo' });
    await expand.focus();
    const start = await page.evaluate(() => scrollY);
    await expand.press('Enter');
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('leave-engine');
    await expect(page.locator('.section-rail')).toHaveJSProperty('inert', true);
    await demo.getByLabel('Part of day').selectOption('am');
    await expect(demo.getByText('Quoted hours · 8h')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(expand).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(start, 0);
    await expect(demo.getByLabel('Part of day')).toHaveValue('am');
    await expand.click();
    await demo.getByRole('button', { name: 'Exit expanded view' }).click();
    await expect(expand).toBeFocused();
    await expect(page.locator('.section-rail')).toHaveJSProperty('inert', false);
    await expect(page.getByRole('navigation', { name: 'Case study contents' })).toBeVisible();
});

for (const slug of cases) {
    test(slug + ' displays both static ER diagram themes and zooms without loading Mermaid', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        const requests = [];
        page.on('request', request => requests.push(new URL(request.url()).pathname));
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/systems/' + slug + '/#diagram');
        const figure = page.locator('entity-diagram');
        await figure.scrollIntoViewIfNeeded();
        const light = figure.locator('img[data-diagram-theme="light"]');
        const dark = figure.locator('img[data-diagram-theme="dark"]');
        await expect(light).toBeVisible();
        await expect.poll(() => light.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
        await figure.getByRole('combobox').selectOption('175');
        await expect(figure.locator('.drawing')).toHaveAttribute('style', /width: 175%/);
        await page.getByRole('button', { name: 'Dark mode' }).click();
        await expect(dark).toBeVisible();
        await expect.poll(() => dark.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
        await expect(light).toBeHidden();
        expect(requests.some(path => /mermaid.*\.js/i.test(path))).toBe(false);
        const contents = page.getByRole('navigation', { name: 'Case study contents' });
        await expect(contents.getByRole('link')).toHaveCount(slug === cases[0] ? 7 : 4);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
        expect(errors).toEqual([]);
    });
}

for (const [slug, first, second] of [
    [cases[1], 'leave-engine', 'attendance-amend'],
    [cases[2], 'kpi-cockpit', 'funding-flow'],
]) {
    test(slug + ' leads with working demos followed by contribution and design decisions on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 740 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/systems/' + slug + '/');
        await page.locator('html').evaluate(html => { html.dir = 'rtl'; });
        await page.evaluate(() => document.fonts.ready);

        const picker = page.getByRole('navigation', { name: 'Open a workflow' });
        const links = picker.getByRole('link');
        await expect(links).toHaveCount(2);
        await expect(links.nth(0)).toHaveAttribute('href', '#' + first);
        await expect(links.nth(1)).toHaveAttribute('href', '#' + second);
        const tapTarget = await links.nth(1).boundingBox();
        expect(tapTarget.height).toBeGreaterThanOrEqual(44);
        expect(tapTarget.y + tapTarget.height).toBeLessThanOrEqual(740);
        await links.nth(1).press('Enter');
        await expect(page).toHaveURL(new RegExp('#' + second + '$'));
        await expect(page.locator('#' + second)).toBeInViewport();

        const sections = await page.locator('section:is(#sandboxes, #scope, #decisions, #technical-reference)').evaluateAll(elements => elements.map(element => element.id));
        expect(sections).toEqual(['sandboxes', 'scope', 'decisions', 'technical-reference']);
        const contents = page.getByRole('navigation', { name: 'Case study contents' });
        await contents.getByRole('link', { name: 'My contribution' }).press('Enter');
        await expect(page).toHaveURL(/#scope$/);
        await expect(page.getByRole('heading', { name: 'What I designed and built' })).toBeInViewport();
        await expect(page.getByRole('heading', { name: 'Designed', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Built', exact: true })).toBeVisible();
        await contents.getByRole('link', { name: 'Design decisions' }).press('Enter');
        await expect(page).toHaveURL(/#decisions$/);
        await expect(page.locator('#decisions .decision')).toHaveCount(3);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    });
}
