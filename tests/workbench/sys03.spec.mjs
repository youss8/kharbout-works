import { expect, test as base } from '@playwright/test';

const route = '/systems/03-portfolio-kpi-engine/';
const test = base.extend({
    cleanConsole: [async ({ page }, use) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        await use();
        expect(errors).toEqual([]);
    }, { auto: true }],
});

test('KPI rollups separate missing denominators, pending counts and cumulative snapshots', async ({ page }) => {
    await page.goto(route + '#kpi-cockpit');
    const demo = page.locator('.kpi-demo');
    const result = demo.locator('.result-value');
    await expect(result).toHaveText('67.8%');
    await expect(demo.getByText('1 site excluded · missing denominator')).toBeVisible();
    await demo.getByLabel('Rollup method').selectOption('naive');
    await expect(result).toHaveText('59.6%');
    await demo.getByRole('combobox', { name: 'Site', exact: true }).selectOption('S2');
    await expect(result).toHaveText('45%');
    await demo.getByRole('combobox', { name: 'Sponsor', exact: true }).selectOption('SP2');
    await expect(result).toHaveText('—');
    await demo.getByRole('button', { name: 'Reset Demo State' }).click();
    await demo.getByLabel('Include pending').check();
    await expect(demo.getByText('+10 pending', { exact: false })).toBeVisible();
    await demo.getByRole('button', { name: /TRN-04/ }).click();
    await expect(demo.getByRole('region', { name: 'Objective tree' }).getByText('334', { exact: true })).toBeVisible();
    await demo.getByRole('button', { name: 'Trend', exact: true }).click();
    await expect(demo.getByRole('columnheader', { name: 'Linear target' })).toBeVisible();
    await demo.getByRole('combobox', { name: 'Period', exact: true }).selectOption('Q1');
    await expect(demo.getByText('Annual time elapsed · 25%')).toBeVisible();
    await demo.getByRole('button', { name: 'Gaps', exact: true }).click();
    await expect(demo.getByText('O1.2 · No KPI linked')).toBeVisible();
    await demo.getByRole('button', { name: 'Toggle Increase workforce readiness in served regions' }).click();
    await expect(demo.getByRole('button', { name: /TRN-04/ })).toHaveCount(0);
    await demo.getByRole('button', { name: 'Reset Demo State' }).click();
    await expect(result).toHaveText('67.8%');
    await expect(demo.getByLabel('Include pending')).not.toBeChecked();
    await expect(demo.getByRole('button', { name: /TRN-04/ })).toBeVisible();
});

test('the Sankey traces the correct projects and receiving a tranche updates its currency and health', async ({ page }) => {
    await page.goto(route + '#funding-flow');
    const demo = page.locator('.funding-demo');
    const totals = demo.locator('.fund-totals');
    await expect(totals).toContainText('USD 420,000');
    await expect(totals).toContainText('USD 670,000');
    await expect(totals).toContainText('EUR 180,000');
    await expect(totals).toContainText('EUR 300,000');
    await expect(demo.locator('.ribbons path[d^="M"]')).toHaveCount(7);
    const sponsor = demo.locator('[data-flow-node="SP1"]');
    await sponsor.hover();
    await expect(demo.locator('[data-flow-node="PRJ-101"]')).toHaveClass(/is-traced/);
    await expect(demo.locator('[data-flow-node="PRJ-103"]')).toHaveClass(/is-dimmed/);
    await expect(demo.locator('[data-agreement="FA-01"]')).toHaveClass(/is-traced/);
    await page.mouse.move(0, 0);
    await demo.locator('[data-flow-node="PRJ-103"]').focus();
    await expect(demo.locator('[data-flow-node="SP3"]')).toHaveClass(/is-traced/);
    await demo.getByRole('button', { name: /Needs Attention 2/ }).click();
    await expect(demo.locator('[data-agreement]')).toHaveCount(2);
    await demo.getByRole('button', { name: 'Inspect FA-01' }).click();
    const drawer = demo.getByRole('dialog', { name: 'Agreement detail' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: 'Mark Tranche Received' }).click();
    await expect(drawer.locator('.status-badge')).toContainText('On Track');
    await expect(drawer).toContainText('USD 300,000 received');
    await drawer.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(demo.locator('[data-agreement]')).toHaveCount(1);
    await demo.getByRole('button', { name: /All 3/ }).click();
    await demo.getByRole('button', { name: 'Ledger', exact: true }).click();
    await expect(demo.getByRole('region', { name: 'Received disbursements' })).toContainText('2026-11-23');
    await expect(totals).toContainText('USD 300,000');
    await expect(totals).toContainText('EUR 180,000');
    await demo.getByRole('button', { name: 'Calendar', exact: true }).click();
    await expect(demo.getByText('FA-03 · annual report')).toBeVisible();
    await demo.getByRole('button', { name: 'Tranche Lanes', exact: true }).click();
    await expect(demo.locator('.lanes section')).toHaveCount(3);
    await demo.getByRole('button', { name: 'Reset Demo State' }).click();
    await expect(demo.locator('[data-agreement="FA-01"]')).toContainText('Needs Attention');
    await expect(totals).toContainText('USD 200,000');
});

test('KPI tables and funding nodes fit a 375px screen and the paths follow resized nodes', async ({ page }) => {
    await page.goto(route + '#funding-flow');
    const ribbon = page.locator('.ribbons path').first();
    await expect(ribbon).toHaveAttribute('d', /^M/);
    const wide = await ribbon.getAttribute('d');
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(ribbon).not.toHaveAttribute('d', wide);
    for (const demo of ['.kpi-demo', '.funding-demo']) {
        const widths = await page.locator(demo).evaluate(el => ({ internal: el.scrollWidth, visible: el.clientWidth }));
        expect(widths.internal).toBeLessThanOrEqual(widths.visible + 1);
    }
});
