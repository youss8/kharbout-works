import { test, expect } from '@playwright/test';

for (const engine of ['react', 'alpine']) {
    test.describe(engine + ' flagship kits', () => {
        test.use({ viewport: { width: 375, height: 740 } });
        async function preview(page, id) {
            await page.goto('/vault/preview/' + id + '/?dir=rtl&theme=dark&engine=' + engine);
            await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
            await expect
                .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
                .toBe(375);
        }
        test('desk saves a packed draft and drops a cancelled resize', async ({ page }) => {
            await preview(page, 'flush-row-desk-grid');
            await page.getByRole('button', { name: 'Customize grid' }).click();
            await page.getByRole('button', { name: 'Grow Monthly returns' }).click();
            await expect(page.locator('[data-grid-panel]').first()).toContainText('8/12');
            await page.getByRole('button', { name: 'Cancel' }).click();
            await expect(page.locator('[data-grid-panel]').first()).toContainText('6/12');
            await page.getByRole('button', { name: 'Customize grid' }).click();
            await page.getByRole('button', { name: 'Grow Monthly returns' }).click();
            await page.getByRole('button', { name: 'Done' }).click();
            await page.reload();
            await expect(page.locator('[data-grid-panel]').first()).toContainText('8/12');
            await expect(page.locator('output')).toContainText('Zero holes');
        });
        test('resize hysteresis updates before pointer release and respects RTL', async ({
            page,
        }) => {
            await page.setViewportSize({ width: 960, height: 720 });
            await page.goto('/vault/preview/flush-row-desk-grid/?dir=rtl&engine=' + engine);
            await page.getByRole('button', { name: 'Customize grid' }).click();
            const width = await page
                .locator('.desk-layout')
                .evaluate((el) => el.getBoundingClientRect().width / 12);
            const grip = page.getByRole('button', { name: 'Drag to resize Monthly returns' });
            const rect = await grip.boundingBox();
            const x = rect.x + rect.width / 2,
                y = rect.y + rect.height / 2,
                counter = page.locator('[data-grid-panel] bdi').first();
            await page.mouse.move(x, y);
            await page.mouse.down();
            await page.mouse.move(x - 0.5 * width, y);
            await expect(counter).toHaveText('6/12');
            await page.mouse.move(x - 0.72 * width, y);
            await expect(counter).toHaveText('7/12');
            await page.mouse.move(x - 0.52 * width, y);
            await expect(counter).toHaveText('7/12');
            await page.mouse.move(x - 0.25 * width, y);
            await expect(counter).toHaveText('6/12');
            await page.mouse.up();
        });
        test('Sankey isolates currencies and traces without crossing to another sponsor', async ({
            page,
        }) => {
            await preview(page, 'html-svg-sankey-flow');
            await expect(page.locator('.flow-board path[d]')).toHaveCount(4);
            await page.locator('[data-node="SP1"]').focus();
            await expect(page.locator('[data-node="SP2"]')).toHaveAttribute('data-hot', 'false');
            await expect(page.locator('.flow-register tbody tr').last()).toHaveAttribute(
                'data-hot',
                'false',
            );
            await page.getByRole('button', { name: 'EUR', exact: true }).click();
            await expect(page.locator('.flow-register tbody tr')).toHaveCount(1);
            await expect(page.locator('.flow-register')).toContainText('FA-03');
            await expect(page.locator('.flow-board path[d]')).toHaveCount(3);
        });
        test('36 endpoints expose one keyboard tooltip and recover an agent from an outage', async ({
            page,
        }) => {
            await page.clock.install();
            await preview(page, 'patch-panel-estate-strip');
            const ports = page.locator('.estate-ports button');
            await expect(ports).toHaveCount(36);
            await page.getByRole('button', { name: 'Simulate branch outage' }).click();
            await expect(ports.first()).toHaveAttribute('data-state', 'stale');
            await ports.first().focus();
            await expect(page.getByRole('tooltip')).toContainText('NH-WS-014');
            await expect(page.getByRole('meter')).toHaveCount(3);
            await page.getByRole('button', { name: 'Simulate agent check-in' }).click();
            await expect(ports.first()).toHaveAttribute('data-state', 'online');
            const clock = page.locator('[data-poll-clock]'),
                before = await clock.textContent();
            await page.clock.fastForward(15_100);
            await expect(clock).not.toHaveText(before);
        });
        test('schedule undoes linked edits and timesheet protects approval and overtime', async ({
            page,
        }) => {
            await preview(page, 'gantt-and-timesheet-machines');
            const horizon = page.getByRole('slider', { name: 'Schedule horizon' }),
                plot = page.getByRole('region', { name: 'Task schedule' });
            await horizon.press('End');
            await expect
                .poll(() => plot.evaluate((el) => Math.abs(el.scrollLeft)))
                .toBeGreaterThan(100);
            await horizon.press('Home');
            await expect.poll(() => plot.evaluate((el) => Math.abs(el.scrollLeft))).toBe(0);
            const box = await horizon.boundingBox();
            const x = box.x + box.width * 0.95,
                y = box.y + box.height / 2;
            await page.mouse.move(x, y);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width * 0.5, y, { steps: 4 });
            await page.mouse.up();
            await expect
                .poll(() => plot.evaluate((el) => Math.abs(el.scrollLeft)))
                .toBeGreaterThan(0);
            await page.getByLabel('Trace task').selectOption('phase');
            await expect(page.getByText('Delivery plan · Selected', { exact: true })).toBeVisible();
            await page.getByLabel('Trace task').selectOption('r2');
            await expect(page.locator('.funding-routes [data-traced=false]')).toContainText('1.3');
            await expect(page.locator('.funding-routes [data-traced=true]')).toHaveCount(3);
            await page.getByLabel('Route emphasis').selectOption('all');
            await expect(page.locator('.funding-routes [data-traced=true]')).toHaveCount(4);
            await page.getByLabel('Route emphasis').selectOption('none');
            await expect(page.locator('.funding-routes [data-traced=true]')).toHaveCount(0);
            await page.getByLabel('Route emphasis').selectOption('selected');
            await page.getByLabel('Trace task').selectOption('r1');
            await page.getByRole('button', { name: 'Move +1 day' }).click();
            await expect(page.getByRole('status').last()).toContainText('Moved 4 tasks');
            await page.getByRole('button', { name: 'Undo', exact: true }).focus();
            await page.keyboard.press('Control+z');
            await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeEnabled();
            await page.getByRole('button', { name: 'Timesheet', exact: true }).click();
            await expect(page.getByRole('button', { name: 'Export timesheet' })).toBeDisabled();
            await page.getByLabel('March 3 · one punch').selectOption('Worked');
            await page.getByLabel('March 9 · zero punches').selectOption('Absent');
            await page.getByRole('button', { name: 'Confirm', exact: true }).click();
            await page.getByLabel('Acting role').selectOption('Manager');
            await page.getByLabel('Approving my own month').check();
            await page.getByRole('button', { name: 'Approve', exact: true }).click();
            await expect(page.getByRole('status').last()).toContainText('Self-approval');
            await page.getByLabel('Approving my own month').uncheck();
            await page.getByRole('button', { name: 'Approve', exact: true }).click();
            await page.getByLabel('Acting role').selectOption('HR');
            await page.getByRole('button', { name: 'Lock', exact: true }).click();
            await expect(page.getByText(/Punches resolved/)).toContainText('Leave credit 4h');
            await page.getByRole('button', { name: 'Reopen', exact: true }).click();
            await expect(page.getByText(/Punches resolved/)).toContainText('Leave credit 0h');
        });
    });
}
