import { expect, test } from '@playwright/test';

for (const engine of ['alpine', 'react']) {
    test.describe(engine, () => {
        let diagnostics;
        test.beforeEach(async ({ page }) => {
            diagnostics = [];
            page.on('pageerror', error => diagnostics.push(error.message));
            page.on('console', message => { if (message.type() === 'error') diagnostics.push(message.text()); });
            await page.setViewportSize({ width: 375, height: 812 });
        });
        test.afterEach(() => expect(diagnostics).toEqual([]));
        const preview = id => '/vault/preview/' + id + '/?engine=' + engine + '&dir=rtl&theme=dark';

        test('Kanban rejects illegal and undocumented transitions and records a return note', async ({ page }) => {
            await page.goto(preview('guarded-workflow-kanban'));
            const original = page.getByRole('article', { name: 'WR-18' });
            await original.getByRole('combobox').selectOption('Approved');
            await original.getByRole('button', { name: 'Move' }).click();
            await expect(page.getByRole('status')).toContainText('stays in Draft');
            await expect(page.getByRole('region', { name: 'Draft' }).getByRole('article', { name: 'WR-18' })).toBeVisible();
            await original.getByRole('combobox').selectOption('Review');
            await original.getByRole('button', { name: 'Move' }).click();
            await expect(page.getByRole('region', { name: 'Review' }).getByRole('article', { name: 'WR-18' })).toBeVisible();
            await original.getByRole('combobox').selectOption('Draft');
            await original.getByRole('button', { name: 'Move' }).click();
            const dialog = page.getByRole('dialog', { name: 'Return to draft' });
            await expect(dialog.getByRole('button', { name: 'Confirm return' })).toBeDisabled();
            await dialog.getByRole('textbox', { name: 'Return note' }).fill('Please verify the revised headcount.');
            await dialog.getByRole('button', { name: 'Confirm return' }).click();
            await expect(dialog).toBeHidden();
            await expect(page.getByRole('region', { name: 'Draft' }).getByRole('article', { name: 'WR-18' })).toContainText('Please verify the revised headcount.');
        });

        test('approval version diffs, skipped reasons and both approval gates work', async ({ page }) => {
            await page.goto(preview('approval-stepper-checklist'));
            await expect(page.locator('del')).toHaveText(['12 seats', '04 Jan 2027']);
            await page.getByRole('button', { name: 'v1', exact: true }).click();
            await expect(page.locator('del')).toHaveCount(0);
            await expect(page.getByText('12 seats', { exact: true })).toBeVisible();
            await page.getByRole('button', { name: 'v2', exact: true }).click();
            await expect(page.getByRole('listitem').filter({ hasText: 'Finance sign-off' }).getByText('Budget unchanged between versions.')).toBeVisible();
            for (const [step, ...evidence] of [
                ['Operations review', 'Verify revised capacity', 'Confirm start date'],
                ['Release', 'Attach reviewed version', 'Confirm release owner'],
            ]) {
                await page.getByRole('button', { name: 'Open checklist: ' + step }).click();
                const dialog = page.getByRole('dialog', { name: 'Approval checklist' });
                const approve = dialog.getByRole('button', { name: 'Approve step' });
                await expect(approve).toBeDisabled();
                await dialog.getByRole('checkbox', { name: evidence[0] }).check();
                await expect(approve).toBeDisabled();
                await dialog.getByRole('checkbox', { name: evidence[1] }).check();
                await approve.click();
                await expect(dialog).toBeHidden();
                await expect(page.getByRole('status')).toContainText(step + ' completed for v2.');
            }
            await expect(page.getByText('Release approved')).toBeVisible();
        });

        test('intent palette returns answers, navigates to pages, and applies scoped actions', async ({ page }) => {
            await page.goto(preview('command-ask-bar'));
            const trigger = page.getByRole('button', { name: /Open command bar/ });
            await trigger.focus();
            await page.keyboard.press('Control+k');
            const dialog = page.getByRole('dialog', { name: 'Command bar' });
            const input = dialog.getByRole('combobox', { name: 'Search commands' });
            await expect(dialog.getByRole('group')).toHaveCount(3);
            await expect(input).toBeFocused();
            await input.press('ArrowDown');
            await expect(dialog.getByRole('option', { selected: true })).toContainText('KPI ratio');
            await input.press('Enter');
            await expect(page.getByRole('status')).toContainText('denominators');
            await expect(trigger).toBeFocused();
            await trigger.click();
            await input.fill('switch ltr');
            await expect(dialog.getByRole('option')).toHaveCount(1);
            await input.press('Enter');
            await expect(trigger.locator('..')).toHaveAttribute('dir','ltr');
            await expect(page.locator('html')).toHaveAttribute('dir','rtl');
            await trigger.click();
            await input.fill('zzzz');
            await expect(dialog.getByText('No matching commands.')).toBeVisible();
            await input.press('Escape');
            await expect(dialog).toBeHidden();
            await trigger.click();
            await input.fill('open cv');
            await expect(dialog.getByRole('option')).toHaveText('Interactive CV');
            await input.press('Enter');
            await expect(page).toHaveURL(/\/cv\/?$/);
        });
    });
}
