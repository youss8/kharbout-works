import { test, expect } from '@playwright/test';

function run(slug, exercise) {
    test(slug + ' runs through the Livewire browser client', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/k/' + slug);
        await page.waitForFunction(() => window.Livewire?.all().length > 0);
        await exercise({
            page,
            role: (name) => page.getByRole('button', { name, exact: true }),
            status: () => page.getByRole('status'),
        });
        expect(errors).toEqual([]);
    });
}

run('saved-views-sticky-filters', async ({ page, role, status }) => {
    await role('Filter status').click();
    await page.getByRole('checkbox', { name: 'Ending' }).check();
    await role('Done').click();
    await expect(page.getByRole('button', { name: /Clear status/ })).toBeVisible();
    await expect(page.locator('tbody')).toContainText('Ending');
    await page.getByLabel('View name').fill('Ending this quarter');
    await role('Save view').click();
    await expect(page.getByText(/Ending this quarter · Regional HR/)).toBeVisible();
    await role('Delete view').click();
    await expect(role('Delete view')).toHaveCount(0);
});
run('guarded-modals-dirty-close', async ({ page, role, status }) => {
    await role('Edit schedule').click();
    await page.getByLabel('Hours').fill('7');
    await role('Cancel').click();
    await expect(role('Keep editing')).toBeVisible();
    await role('Keep editing').click();
    await page.getByLabel('Reject next save').check();
    await role('Save schedule').click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Hours')).toHaveValue('7');
    await role('Retry').click();
    await expect(page.locator('dialog')).toBeHidden();
    await role('Record decision').click();
    await page.getByLabel('Required note').fill('Reviewed by operations');
    await role('Save decision').click();
    await expect(page.getByRole('dialog', { name: 'Decision note' })).toBeHidden();
});
run('fail-closed-role-drawer', async ({ page, role, status }) => {
    await role('Staff 042').click();
    await expect(page.getByText('Site coordination')).toBeVisible();
    await role('Staff 088').click();
    await expect(page.getByRole('alert')).toContainText('Record unavailable');
    await expect(page.getByText('Site coordination')).toHaveCount(0);
    await page.getByLabel('Active role').selectOption('Regional HR');
    await expect(page.getByText('Restricted contract review')).toBeVisible();
    await role('Open missing record').click();
    await expect(page.getByRole('alert')).toBeVisible();
    await role('Retry').click();
    await expect(page.getByRole('alert')).toBeVisible();
});
run('shared-options-popover', async ({ page, role, status }) => {
    await role('Assign').first().click();
    const option = page.locator('[data-assignee-option]').first();
    await expect(option).toContainText('Operations officer 001');
    await option.click();
    await expect(option).toHaveAttribute('aria-pressed', 'true');
    await role('Close').click();
    await expect(page.locator('li').first()).toContainText('Operations officer 001');
});
run('office-pdf-preview', async ({ page, role }) => {
    await role('Open file preview').click();
    const dialog = page.getByRole('dialog', { name: 'Private file preview' });
    await expect(dialog.locator('tbody tr')).toHaveCount(500);
    await dialog.getByRole('tab', { name: 'By site', exact: true }).click();
    await expect(dialog.getByText('Harbor Office')).toBeVisible();
    await role('Next file').click();
    await expect(
        dialog.frameLocator('iframe[title="Document pages"]').getByText('Quarterly funding brief'),
    ).toBeVisible();
    await role('Previous file').click();
    await expect(dialog.locator('tbody tr')).toHaveCount(500);
});
run('bilingual-ask-palette', async ({ page, role, status }) => {
    await role('retrns').click();
    const first = page.locator('ul li button').first();
    await expect(first).toContainText(/returns/i);
    await first.click();
    await expect(status()).toContainText('Picked');
});
run('flush-row-desk-grid', async ({ page, role, status }) => {
    await role('Customize grid').click();
    const first = page.locator('[data-grid-id]').first();
    const start = await first.getAttribute('data-grid-id');
    await expect(first.locator('button').first()).toBeEnabled();
    await first.locator('button').first().press('ArrowRight');
    await expect(page.locator('[data-grid-id]').first()).not.toHaveAttribute('data-grid-id', start);
    await role('Done').click();
    await expect(role('Customize grid')).toBeVisible();
});
run('gantt-and-timesheet-machines', async ({ page, role, status }) => {
    await role('Timesheet').click();
    await page.getByLabel('March 3 · one punch').selectOption('Worked');
    await page.getByLabel('March 9 · zero punches').selectOption('Absent');
    await role('Confirm').click();
    await expect(page.getByText('Confirmed', { exact: true })).toBeVisible();
});

run('spreadsheet-importer-register', async ({ page, role }) => {
    const csv = page.getByLabel('CSV to import');
    const load = role('Load rows into register');
    await csv.fill('Job,Interval\nAlpha backup,24');
    await role('Parse CSV').click();
    await expect(load).toBeEnabled();
    await csv.fill('Job,Interval\nBeta backup,24');
    await expect(load).toBeDisabled();
    await expect(page.getByRole('alert')).toContainText('Parse it again');
    await expect(page.locator('tbody')).not.toContainText('Alpha backup');
    await role('Parse CSV').click();
    await load.click();
    await expect(page.locator('tbody')).toContainText('Beta backup');
    await expect(page.locator('tbody')).not.toContainText('Alpha backup');
});
