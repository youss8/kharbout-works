import { test, expect } from '@playwright/test';

for (const engine of ['alpine', 'react']) {
    test(engine + ' primitives enforce their data contracts at 375px in RTL', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 820 });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        async function open(id) {
            await page.goto('/vault/preview/' + id + '/?dir=rtl&theme=dark&engine=' + engine);
            await expect(page.locator('main section').first()).toBeVisible();
            await expect
                .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
                .toBe(375);
        }
        await open('status-tone-vocabulary');
        await expect(page.getByText('Critical', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Write priority' }).click();
        await expect(page.getByRole('status')).toContainText('Choose Critical');
        await page.getByLabel('Priority input').fill('Low');
        await page.getByRole('button', { name: 'Write priority' }).click();
        await expect(page.getByRole('status')).toHaveText('Saved Low');
        await open('two-band-progress-sla');
        await page.getByLabel('Approved (%)').fill('118');
        await expect(page.getByText('Over by 18%')).toBeVisible();
        await page.getByLabel('No approved reading').check();
        await expect(page.getByLabel('not set')).toHaveText('—');
        await page.getByLabel('SLA elapsed minutes').fill('2910');
        await expect(page.getByText('30m overdue')).toBeVisible();
        await page.getByLabel('Time language').selectOption('ar');
        await expect(page.locator('bdi[lang=ar]')).toContainText('متأخر');
        await open('currency-guard-balance');
        await page.getByLabel('Attempt mixed-currency total').check();
        await expect(page.getByRole('alert')).toContainText('single currency');
        await page.getByRole('button', { name: 'Retry per currency' }).click();
        await page.getByLabel('Used hours').fill('160');
        await expect(page.getByText('-48 hours')).toBeVisible();
        await open('zero-safe-signal-tiles');
        await page.getByRole('button', { name: 'Breached, 3', exact: true }).click();
        await expect(page.getByRole('listitem')).toHaveCount(3);
        await page.getByRole('button', { name: 'Zero out breaches' }).click();
        await expect(
            page.getByRole('button', { name: 'Breached, 0' }).locator('[data-tone]'),
        ).toHaveAttribute('data-tone', 'neutral');
        await page.getByRole('button', { name: 'Show all' }).click();
        await expect(page.getByRole('listitem')).toHaveCount(12);
        await open('redacted-pay-day-state');
        await expect(page.getByLabel('Monthly pay')).toHaveCount(0);
        await page.getByLabel('Active role').selectOption('HR Manager');
        await page.getByLabel('Monthly pay').fill('3500');
        await page.getByRole('button', { name: 'Save contract' }).click();
        await page.getByLabel('Active role').selectOption('Platform Admin');
        await page.getByRole('button', { name: 'Save contract' }).click();
        await expect(page.getByLabel('Save payload')).not.toContainText('pay');
        await page.getByLabel('Active role').selectOption('HR Manager');
        await expect(page.getByLabel('Monthly pay')).toHaveValue('3500');
        await page.getByRole('button', { name: 'Mark present' }).click();
        await expect(page.getByRole('combobox', { name: /Attendance day/ })).toHaveValue(
            'decided_present',
        );
        expect(errors).toEqual([]);
    });
}
