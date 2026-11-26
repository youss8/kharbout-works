import { expect, test } from '@playwright/test';

const tracking = '/systems/03-portfolio-kpi-engine/';
const hr = '/systems/02-hr-lifecycle-crm/';
const demos = [
    ['KPI cockpit', tracking + '#kpi-cockpit', 'KPI performance and pooled ratios', '#modeling'],
    [
        'Leave approval desk',
        hr + '#leave-engine',
        'Leave pricing and two-tier approval desk',
        '#modeling',
    ],
    [
        'Funding flow',
        tracking + '#funding-flow',
        'Funding flow and agreement health',
        '/vault/#html-svg-sankey-flow',
    ],
    [
        'Attendance & contracts',
        hr + '#attendance-amend',
        'Attendance month and signed contract diff',
        '/vault/#gantt-and-timesheet-machines',
    ],
];

test('the two homepage previews match their full workflow results', async ({ page }) => {
    await page.goto('/');
    const preview = page.locator('#featured-workflows');
    const choices = preview.getByRole('group', { name: 'Choose a workflow' });
    const result = preview.getByRole('status');
    const average = preview.getByRole('button', { name: 'Site average' });
    await expect(result).toContainText('67.8%');
    await expect(result).toContainText('61 of 90');
    await expect(average).toBeEnabled();
    await average.press('Enter');
    await expect(result).toContainText('59.6%');
    await expect(average).toBeFocused();
    await choices.getByRole('button', { name: 'HR workflows' }).press('Space');
    await expect(result).toContainText('16h');
    const days = preview.getByRole('list', { name: 'Day-by-day quote' });
    await expect(days).toContainText('Holiday');
    await expect(days).toContainText('Weekend');
    await preview.getByRole('button', { name: 'Morning only' }).press('Enter');
    await expect(result).toContainText('8h');
    await expect(days.getByText('4h')).toHaveCount(2);
    await choices.getByRole('button', { name: 'Portfolio tracking' }).press('Enter');
    await expect(result).toContainText('59.6%');

    await preview.getByRole('link', { name: 'Open KPI cockpit' }).click();
    const inspector = page.getByRole('region', { name: 'KPI inspector' });
    await expect(inspector.locator('.result-value')).toHaveText('67.8%');
    await inspector.getByRole('combobox', { name: 'Rollup method' }).selectOption('naive');
    await expect(inspector.locator('.result-value')).toHaveText('59.6%');

    await page.goto('/');
    await choices.getByRole('button', { name: 'HR workflows' }).click();
    await preview.getByRole('link', { name: 'Open leave approval desk' }).click();
    const leave = page.locator('#leave-engine');
    await expect(leave.locator('.hr-total')).toHaveText('Quoted hours · 16h');
    await leave.getByLabel('Part of day').selectOption('am');
    await expect(leave.locator('.hr-total')).toHaveText('Quoted hours · 8h');
});

test('at 320px the previews and evidence remain usable in dark RTL', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Dark mode' }).click();
    await page.locator('html').evaluate((html) => {
        html.dir = 'rtl';
    });
    await page.evaluate(() => document.fonts.ready);

    const launch = page.getByRole('link', { name: 'Run KPI cockpit' });
    const launchBox = await launch.boundingBox();
    expect(launchBox.y + launchBox.height).toBeLessThanOrEqual(740);
    const tabs = page.getByRole('tablist', { name: 'System architecture' });
    await tabs.getByRole('tab', { name: /SYS-03/ }).press('ArrowLeft');
    await expect(tabs.getByRole('tab', { name: /SYS-02/ })).toBeFocused();
    const panel = page.getByRole('tabpanel');
    await expect(panel.getByRole('link', { name: 'Price a leave request' })).toHaveAttribute(
        'href',
        hr + '#leave-engine',
    );
    await panel.locator('summary').click();
    await panel.getByRole('button', { name: /2026-12-23/ }).click();
    await expect(panel.locator('output')).toContainText('8h');
    await panel.locator('summary').click();

    const preview = page.locator('#featured-workflows');
    await page.getByRole('link', { name: 'Try a workflow', exact: true }).click();
    const compare = preview.getByRole('button', { name: 'Site average' });
    const button = await compare.boundingBox();
    expect(Math.round(button.height)).toBeGreaterThanOrEqual(44);
    await compare.click();
    await expect(preview.getByRole('status')).toContainText('59.6%');
    await preview.getByRole('button', { name: 'HR workflows' }).click();
    await preview.getByRole('button', { name: 'Morning only' }).click();
    await expect(preview.getByRole('status')).toContainText('8h');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('each system instrument responds to its fixture and preserves its demo links', async ({
    page,
}) => {
    await page.goto('/');
    const panel = page.getByRole('tabpanel');
    const tabs = page.getByRole('tablist', { name: 'System architecture' });
    await panel.locator('summary').click();
    await panel.getByRole('button', { name: /North Hub/ }).click();
    await expect(panel.locator('[data-display]')).toHaveText('74.3%');
    await expect(panel.locator('output')).toContainText('52 of 70 participants');
    await panel.getByRole('button', { name: /Valley Office/ }).click();
    await expect(panel.locator('[data-display]')).toHaveText('—');
    await panel.getByRole('button', { name: /All sites/ }).click();
    await expect(panel.locator('[data-display]')).toHaveText('67.8%');
    await tabs.getByRole('tab', { name: /SYS-02/ }).click();
    await panel.locator('summary').click();
    await panel.getByRole('button', { name: /2026-12-25/ }).click();
    await expect(panel.locator('output')).toContainText('0h');
    await tabs.getByRole('tab', { name: /SYS-01/ }).click();
    await panel.locator('summary').click();
    await panel.getByRole('button', { name: /NH-SRV-FILE/ }).click();
    await expect(panel.locator('[data-display]')).toHaveText('96%');
    await expect(panel.locator('output')).toContainText('35% CPU');
    await expect(page).toHaveURL(/#exhibit-SYS-01$/);
    await page.goBack();
    await expect(tabs.getByRole('tab', { name: /SYS-02/ })).toHaveAttribute('aria-selected', 'true');
    await page.goForward();
    await expect(tabs.getByRole('tab', { name: /SYS-01/ })).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByRole('link', { name: 'Inspect endpoints' })).toHaveAttribute(
        'href',
        '/systems/01-it-ops-helpdesk/#estate-overview',
    );
    await tabs.getByRole('tab', { name: /SYS-01/ }).press('Home');
    await expect(tabs.getByRole('tab', { name: /SYS-03/ })).toBeFocused();
});

test.describe('static sandbox navigation', () => {
    test.use({ javaScriptEnabled: false });

    test('four flagship demos have direct links and native reference previews', async ({
        page,
    }) => {
        for (const [name, href, heading, reference] of demos) {
            await page.goto('/');
            await expect(page.getByRole('group', { name: 'Choose a workflow' })).toBeHidden();
            const links = page.getByRole('navigation', { name: 'Try a system demo' });
            await expect(links.getByRole('link')).toHaveCount(4);
            const link = links.getByRole('link', { name: new RegExp(name) });
            await expect(link).toHaveAttribute('href', href);
            await link.click();
            await expect(page).toHaveURL(href);
            const demo = page.getByRole('region', { name: heading, exact: true });
            await expect(demo.getByRole('heading', { name: heading })).toBeVisible();
            const guide = demo.getByRole('complementary', { name: 'Guided challenge' });
            await expect(guide).toContainText('Expected result');
            const preview = guide.locator('details');
            const control = preview.locator('summary');
            await control.press('Enter');
            await expect(preview).toHaveAttribute('open', '');
            await expect(preview.locator('p')).toBeVisible();
            await control.press('Space');
            await expect(preview).not.toHaveAttribute('open', '');
            const referenceLink = guide.getByRole('link');
            await expect(referenceLink).toHaveAttribute('href', reference);
            await referenceLink.click();
            await expect(page.locator(reference.slice(reference.indexOf('#')))).toBeAttached();
        }
    });
});
