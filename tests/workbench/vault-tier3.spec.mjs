import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const engine of ['react', 'alpine']) {
    const url = (slug) => '/vault/preview/' + slug + '/?engine=' + engine + '&dir=rtl';
    test(engine + ' bilingual Ask ranks four query forms and records picks', async ({ page }) => {
        await page.goto(url('bilingual-ask-palette'));
        for (const [term, label] of [
            ['retrns', 'Monthly site returns'],
            ['العائدات', 'Monthly site returns'],
            [';hk', 'Historical records'],
            ['late', 'Overdue submissions'],
        ]) {
            await page.getByRole('button', { name: term, exact: true }).click();
            await page.getByRole('button', { name: label }).click();
            await expect(page.getByRole('status')).toHaveText('Picked ' + label);
        }
        await expect(page.getByRole('listitem')).toContainText('recent 2.0');
    });

    test(
        engine + ' status transitions validate stale versions and approval gates',
        async ({ page }) => {
            await page.goto(url('status-gate-lifecycle'));
            await page.getByRole('button', { name: 'Change status' }).click();
            const modal = page.getByRole('dialog', { name: 'Transition requirements' });
            const apply = modal.getByRole('button', { name: 'Apply transition' });
            await expect(apply).toBeDisabled();
            await modal.getByLabel('Signed funding agreement').check();
            await modal.getByLabel('Budget and dates confirmed').check();
            await modal.getByLabel('Reason').fill('Reviewed the signed agreement.');
            await modal.getByRole('button', { name: 'Simulate concurrent edit' }).click();
            await expect(apply).toBeDisabled();
            await modal.getByRole('button', { name: 'Reload latest version' }).click();
            await apply.click();
            await expect(page.locator('[aria-current=step]')).toContainText('● Approved');
            await page.getByLabel('On hold').check();
            await expect(page.locator('[aria-current=step] .status-badge')).toHaveText('◐ On hold');
        },
    );

    test(
        engine + ' failed digest and versioned inbox recover through retry and undo',
        async ({ page }) => {
            await page.goto(url('needs-action-inbox'));
            await page.getByLabel('Fail licenses query').check();
            await expect(page.getByRole('alert')).toContainText('digest incomplete');
            await expect(page.getByText('Expiring licenses', { exact: false })).toHaveCount(0);
            await page.getByRole('button', { name: 'Retry' }).click();
            await expect(page.getByRole('alert')).toHaveCount(0);
            await page.getByRole('button', { name: 'Simulate stale version' }).click();
            await page.getByRole('button', { name: 'Approve', exact: true }).click();
            await expect(page.getByRole('status')).toHaveText('changed');
            await page.getByRole('button', { name: 'Reload item' }).click();
            await page.getByRole('button', { name: 'Approve', exact: true }).click();
            await expect(page.getByRole('status')).toHaveText('done');
            await page.getByRole('button', { name: /Undo decision/ }).click();
            await expect(page.getByRole('status')).toHaveText('Decision undone.');
        },
    );

    test(
        engine + ' importer emits row warnings, preserves hidden fields, and exports CSV',
        async ({ page }) => {
            await page.goto(url('spreadsheet-importer-register'));
            await page.getByLabel('CSV to import').fill('Job,Interval\nWeekly backup,-3');
            await page.getByRole('button', { name: 'Parse CSV' }).click();
            await expect(page.getByRole('alert')).toContainText('Interval (h) must be 0 or greater.');
            await expect(page.getByRole('button', { name: 'Load rows into register' })).toHaveCount(0);
            await page.getByLabel('CSV to import').fill('Job,Job Name,Interval\nFirst,Second,24');
            await page.getByRole('button', { name: 'Parse CSV' }).click();
            await expect(page.getByRole('alert')).toContainText(/more than one column maps to "Backup job"/i);
            await expect(page.getByRole('button', { name: 'Load rows into register' })).toHaveCount(0);
            await page.getByRole('button', { name: 'Load sample' }).click();
            await expect(page.getByText(/paste.csv:4/)).toBeVisible();
            await page.getByRole('button', { name: 'Load rows into register' }).click();
            await page.getByLabel('Search register').fill('server');
            const row = page.getByRole('row').filter({ hasText: 'File Server Nightly' });
            await expect(row).toContainText('2025-12-31');
            await expect(row).toHaveAttribute('data-row-tone', 'crit');
            await row.getByRole('button', { name: 'Edit' }).click();
            await page.getByLabel('Interval (h)', { exact: true }).fill('8');
            await page.getByRole('button', { name: 'Save partial update' }).click();
            await expect(row).toContainText('8');
            await expect(page.getByRole('heading', { name: 'Field diff [spec]' })).toBeVisible();
            await expect(page.locator('pre:visible').first()).not.toContainText('notes');
            const download = page.waitForEvent('download');
            await page.getByRole('button', { name: 'Export filtered CSV' }).click();
            expect((await download).suggestedFilename()).toBe('backup-register.csv');
        },
    );

    test(
        engine + ' reconstructs signed terms and exports a vacancy-filtered local org chart',
        async ({ page }) => {
            await page.goto(url('amendment-diff-org-chart'));
            await page.getByRole('button', { name: 'asSigned() original' }).click();
            await expect(
                page.getByRole('definition').filter({ hasText: 'East Annex' }),
            ).toBeVisible();
            await expect(page.getByText('EUR 2,800 / month', { exact: true })).toHaveCount(0);
            await page.getByLabel('Demo viewer').selectOption('HR manager');
            await expect(
                page.getByRole('definition').filter({ hasText: 'EUR 2,800 / month' }).first(),
            ).toBeVisible();
            await page.getByLabel('Demo viewer').selectOption('Coordinator');
            await expect(page.getByText('EUR 2,800 / month', { exact: true })).toHaveCount(0);
            await page.goto(url('amendment-diff-org-chart') + '&panel=org');
            const chart = page.getByRole('group', { name: 'Reporting lines' });
            await expect(chart.getByRole('button')).toHaveCount(5);
            await page.getByRole('button', { name: 'Hide vacancies' }).click();
            await expect(chart.getByRole('button')).toHaveCount(4);
            await expect(chart.locator("path[stroke-dasharray='5 4']")).toHaveCount(1);
            const download = page.waitForEvent('download');
            await page.getByRole('button', { name: 'Download SVG' }).click();
            const file = await download;
            expect(file.suggestedFilename()).toBe('reporting-lines.svg');
            const svg = await readFile(await file.path(), 'utf8');
            expect(
                await page.evaluate((text) => {
                    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
                    return {
                        errors: doc.querySelectorAll('parsererror').length,
                        nodes: doc.querySelectorAll('g').length,
                    };
                }, svg),
            ).toEqual({ errors: 0, nodes: 4 });
        },
    );
}
