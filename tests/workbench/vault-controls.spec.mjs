import { expect, test } from '@playwright/test';

for (const engine of ['alpine', 'react']) {
    test.describe(engine + ' control kits', () => {
        test.use({ viewport: { width: 375, height: 812 } });
        const open = (page, kit) =>
            page.goto('/vault/preview/' + kit + '/?dir=rtl&engine=' + engine);
        test('one directory popover serves twelve rows', async ({ page }) => {
            await open(page, 'shared-options-popover');
            const buttons = page.getByRole('button', { name: 'Assign', exact: true });
            await expect(buttons).toHaveCount(12);
            await buttons.first().click();
            const dialog = page.getByRole('dialog', { name: 'Assign people' });
            await expect(dialog).toHaveCount(1);
            await dialog.getByLabel('Find an officer').fill('199');
            const option = dialog.getByRole('button', { name: /officer 199/ });
            await option.click();
            await expect(option).toHaveAttribute('aria-pressed', 'true');
            await dialog.getByRole('button', { name: 'Close' }).click();
            await expect(page.locator('ol li').first()).toContainText('officer 199');
            await expect(page.getByRole('status')).toContainText('Rendered option buttons: 0');
        });
        test('saved filter drafts commit, persist, and lose restricted filters on a role change', async ({
            page,
        }) => {
            await open(page, 'saved-views-sticky-filters');
            await page.getByRole('button', { name: 'Filter status' }).click();
            await page.getByLabel('Restricted', { exact: true }).check();
            await expect(page.locator('tbody tr')).toHaveCount(4);
            await page.getByRole('button', { name: 'Done' }).click();
            await expect(page.locator('tbody tr')).toHaveCount(1);
            await page.getByLabel('View name').fill('Restricted work');
            await page.getByRole('button', { name: 'Save view' }).click();
            await page.reload();
            await page.getByRole('button', { name: 'Apply', exact: true }).click();
            await expect(page.locator('tbody tr')).toHaveCount(1);
            await page.getByLabel('Active role').selectOption('Employee');
            await expect(page.getByRole('status')).toContainText('Removed filters');
            await expect(page.locator('tbody tr')).toHaveCount(3);
            await expect(page.getByRole('button', { name: 'Delete view' })).toHaveCount(0);
            await page.getByLabel('Active role').selectOption('Regional HR');
            await page.getByRole('button', { name: 'Delete view' }).click();
            await expect(page.getByRole('button', { name: 'Apply', exact: true })).toHaveCount(0);
        });
        test('single and multiple header options support keyboard drafts, cancellation, clearing and sticky state', async ({
            page,
        }) => {
            await open(page, 'saved-views-sticky-filters');
            const region = page.getByRole('button', { name: 'Filter region', exact: true });
            await region.click();
            let picker = page.getByRole('dialog', { name: 'Filter region' });
            await picker.getByRole('searchbox').fill('east');
            await picker.getByRole('searchbox').press('ArrowDown');
            await expect(picker.getByRole('radio', { name: 'East' })).toBeFocused();
            await page.keyboard.press('Space');
            await expect(page.locator('tbody tr')).toHaveCount(4);
            await page.keyboard.press('Escape');
            await expect(region).toBeFocused();
            await region.click();
            await expect(picker.getByRole('radio', { name: 'West (inactive)' })).toBeDisabled();
            await picker.getByRole('radio', { name: 'East' }).check();
            await picker.getByRole('button', { name: 'Done' }).click();
            await expect(page.locator('tbody tr')).toHaveCount(2);
            const status = page.getByRole('button', { name: 'Filter status', exact: true });
            await status.click();
            picker = page.getByRole('dialog', { name: 'Filter status' });
            await picker.getByRole('checkbox', { name: 'Ending' }).check();
            await picker.getByRole('checkbox', { name: 'Current' }).check();
            await picker.getByRole('button', { name: 'Clear', exact: true }).click();
            await expect(picker).toBeVisible();
            await expect(picker.getByRole('checkbox', { checked: true })).toHaveCount(0);
            await picker.getByRole('checkbox', { name: 'Ending' }).check();
            await picker.getByRole('button', { name: 'Done' }).click();
            await expect(page.locator('tbody tr')).toHaveCount(1);
            await page.reload();
            await expect(page.locator('tbody tr')).toHaveCount(1);
            await expect(page.locator('tbody tr')).toContainText('Contract D');
            await page.getByRole('button', { name: /Clear region/ }).click();
            await expect(page.locator('tbody tr')).toHaveCount(2);
        });
        test('modal normalizes inputs and guards reset and blank decisions', async ({ page }) => {
            await open(page, 'guarded-modals-dirty-close');
            await page.getByRole('button', { name: 'Edit schedule' }).click();
            const dialog = page.getByRole('dialog');
            await dialog.getByLabel('Hours').fill(' 5 ');
            await expect(dialog).toContainText('No changes');
            await dialog.getByLabel('Hours').fill('005');
            await page.keyboard.press('Escape');
            await expect(dialog).toContainText('Discard your schedule edits?');
            await dialog.getByRole('button', { name: 'Discard changes' }).click();
            await page.getByRole('button', { name: 'Reset credentials' }).click();
            await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
            await expect(dialog.getByRole('button', { name: 'Confirm reset' })).toBeDisabled();
            await dialog.getByLabel('Type RESET').fill('RESET');
            await dialog.getByRole('button', { name: 'Confirm reset' }).click();
            await expect(page.getByRole('status')).toContainText('revision 2');
            await page.getByRole('button', { name: 'Record decision' }).click();
            await expect(dialog.getByRole('button', { name: 'Save decision' })).toBeDisabled();
            await dialog.getByLabel('Required note').fill('Reviewed');
            await dialog.getByRole('button', { name: 'Save decision' }).click();
            await expect(page.getByRole('status')).toContainText('Reviewed');
        });
        test('failed fetch retains rows and retries; CSV download neutralizes notes', async ({
            page,
        }) => {
            await open(page, 'failure-honest-boundaries');
            await page.getByRole('button', { name: 'Simulate failure' }).click();
            await expect(page.getByRole('alert')).toContainText('timed out');
            await expect(page.getByText('Laptop LT-01', { exact: true })).toBeVisible();
            await page.getByRole('button', { name: 'Retry' }).click();
            await expect(page.getByRole('alert')).not.toBeVisible();
            await page.getByLabel('CSV notes cell').fill('+1');
            await expect(page.locator('code')).toContainText("'+1");
            const download = page.waitForEvent('download');
            await page.getByRole('button', { name: 'Download CSV' }).click();
            const stream = await (await download).createReadStream();
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const data = Buffer.concat(chunks).toString('utf8');
            expect(data.startsWith('\uFEFF')).toBe(true);
            expect(data).toContain(`"'+1"`);
        });
        test('local Office reader bounds sheets, escapes source text and reads uploaded documents', async ({
            page,
        }) => {
            await open(page, 'office-pdf-preview');
            await page.getByRole('button', { name: 'Open file preview' }).click();
            const dialog = page.getByRole('dialog');
            await expect(dialog.getByRole('status').filter({ hasText: '640 rows' })).toBeVisible();
            await expect(dialog.locator('tbody tr')).toHaveCount(500);
            await expect(
                dialog.getByText('<script>literal cell</script>', { exact: true }),
            ).toBeVisible();
            await dialog.getByRole('combobox', { name: /Worksheet/ }).selectOption('1');
            await expect(dialog.getByText('Harbor Office')).toBeVisible();
            await dialog.getByRole('button', { name: 'Next file' }).click();
            await expect(
                dialog
                    .frameLocator('iframe[title="Document pages"]')
                    .getByText('Quarterly funding brief'),
            ).toBeVisible();
            await dialog.getByRole('button', { name: 'Next file' }).click();
            await expect(dialog.locator("object[type='application/pdf']")).toHaveCount(1);
            await dialog.getByRole('button', { name: 'Next file' }).click();
            await expect(dialog.getByText(/no local preview/)).toBeVisible();
            await dialog
                .getByLabel('Choose local files')
                .setInputFiles('src/content/vault/office-pdf-preview/sample.docx');
            await expect(
                dialog
                    .frameLocator('iframe[title="Document pages"]')
                    .getByText('Quarterly funding brief'),
            ).toBeVisible();
            await dialog.getByLabel('Choose local files').setInputFiles({
                name: 'broken.xlsx',
                mimeType: 'application/octet-stream',
                buffer: Buffer.from('broken'),
            });
            await expect(dialog.getByRole('alert')).toBeVisible();
            await expect(dialog.getByRole('button', { name: 'Retry' })).toBeVisible();
        });
        test('profile race and role switch never display an obsolete record', async ({ page }) => {
            await open(page, 'fail-closed-role-drawer');
            await page.getByRole('button', { name: 'Staff 088' }).click();
            await page.getByRole('button', { name: 'Staff 042' }).click();
            await expect(page.getByRole('heading', { name: 'Staff 042' })).toBeVisible();
            await page.waitForTimeout(560);
            await expect(page.getByRole('heading', { name: 'Staff 042' })).toBeVisible();
            await page.getByRole('button', { name: 'Staff 088' }).click();
            await expect(page.getByText('Restricted contract review')).toBeVisible();
            await page.getByLabel('Active role').selectOption('Employee');
            await expect(page.getByText('Restricted contract review')).toHaveCount(0);
            await expect(page.getByRole('alert')).toContainText('Record unavailable');
            await page.getByRole('button', { name: 'Open missing record' }).click();
            await expect(page.getByRole('alert')).toContainText('Record unavailable');
        });
    });
}
