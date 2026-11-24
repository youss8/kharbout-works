import { expect, test } from '@playwright/test';

for (const engine of ['react', 'alpine']) {
    test(
        engine + ' advances the SLA clock and counts actual shared directory nodes',
        async ({ page }) => {
            await page.clock.install();
            await page.goto('/vault/preview/two-band-progress-sla/?engine=' + engine);
            await page.getByLabel('SLA elapsed minutes').fill('2870');
            await expect(page.locator('output')).toContainText('10m left');
            await page.clock.fastForward(60_000);
            // The UI shows complete minutes; a fraction of a second beyond nine rounds down to eight.
            await expect(page.locator('output')).toContainText(/(?:8|9)m left/);
            await page.getByLabel('Ticket state').selectOption('Closed');
            await expect(page.locator('output')).toContainText('Closed');

            await page.goto('/vault/preview/shared-options-popover/?engine=' + engine);
            await page.getByRole('button', { name: 'Assign', exact: true }).first().click();
            await expect(page.locator('[data-assignee-option]')).toHaveCount(12);
            await expect(page.getByRole('status')).toContainText('Rendered option buttons: 12');
            if (engine === 'alpine')
                expect(
                    await page.evaluate(() => window.Alpine.store('directory').people.length),
                ).toBe(200);
            await page.getByLabel('Find an officer').fill('199');
            await expect(page.getByRole('status')).toContainText(
                'Rendered option buttons: 1 of 2,400',
            );
            await expect(page.locator('[data-assignee-option]')).toHaveCount(1);
        },
    );
}

for (const engine of ['react', 'alpine']) {
    test(engine + ' separates hold, funding and focus-filter data', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const open = (id) => page.goto('/vault/preview/' + id + '/?engine=' + engine);
        await open('status-tone-vocabulary');
        await expect(page.getByText('Ⅱ On hold', { exact: true }).first()).toBeVisible();
        await page.getByLabel('Place in-progress work on hold').uncheck();
        await expect(
            page.locator('.status-badge').filter({ hasText: 'In progress' }),
        ).toBeVisible();
        await expect(page.getByText('Ⅱ On hold', { exact: true }).first()).toBeHidden();
        await page.getByLabel('Risk rating').selectOption('');
        await expect(page.getByText('Likelihood: Not rated')).toBeVisible();
        await open('two-band-progress-sla');
        const funding = page.getByRole('progressbar', { name: 'Funding received' });
        await expect(funding).toHaveAttribute('aria-valuetext', /40,000.00 USD of 60,000.00 USD/);
        await page.getByLabel('Received amount').fill('70800');
        await expect(funding).toHaveAttribute('aria-valuetext', /Over by 18%/);
        await page.getByLabel('Committed amount').fill('0');
        await expect(funding).toHaveAttribute('aria-valuetext', /0% received/);
        await expect(funding).toHaveAttribute('aria-valuenow', '0');
        await page.getByLabel('Funding currency').selectOption('');
        await expect(funding).toHaveCount(0);
        await expect(page.getByRole('alert')).toContainText('Choose a funding currency');
        await page.getByRole('button', { name: 'Retry with USD' }).click();
        await expect(funding).toBeVisible();
        await page.getByLabel('No approved reading').check();
        const delivery = page.getByRole('progressbar', { name: 'Approved delivery' });
        await expect(delivery).not.toHaveAttribute('aria-valuenow', /.+/);
        await open('currency-guard-balance');
        const balance = page.getByRole('img', { name: /Used 40 hours/ });
        await expect(balance).toHaveAttribute(
            'aria-label',
            /reserved 16 hours, remaining 72 hours/,
        );
        await page.getByLabel('Reserve 16h pending').uncheck();
        await expect(balance).toHaveAttribute('aria-label', /reserved 0 hours, remaining 88 hours/);
        await page.getByLabel('Annual leave entitlement').uncheck();
        await expect(
            page.getByText('This contract has no annual leave entitlement.'),
        ).toBeVisible();
        await expect(balance).toHaveCount(0);
        await open('zero-safe-signal-tiles');
        await page.getByRole('button', { name: 'Breached, 3', exact: true }).click();
        await expect(page.getByRole('status')).toContainText('Showing 3 of 12');
        await page.locator('[title="Show everything"]:visible').click();
        await expect(page.getByRole('status')).toContainText('Showing 12 of 12');
        expect(errors).toEqual([]);
    });

    test(
        engine + ' fetches a shared options file once and retries a failed request',
        async ({ page }) => {
            let requests = 0;
            await page.route(/directory(?:[-.][^/]*)?\.json(?:\?.*)?$/, async (route) => {
                if (route.request().resourceType() !== 'fetch') return route.continue();
                if (++requests === 1)
                    return route.fulfill({ status: 503, body: 'Temporarily unavailable' });
                return route.continue();
            });
            await page.goto('/vault/preview/shared-options-popover/?engine=' + engine);
            const trigger = page.getByRole('button', { name: 'Assign', exact: true });
            await trigger.first().click();
            await expect(page.getByRole('alert')).toContainText('Could not load');
            await page.getByRole('button', { name: 'Retry directory' }).click();
            await expect(page.locator('[data-assignee-option]')).toHaveCount(12);
            await page.getByRole('button', { name: 'Close', exact: true }).click();
            await trigger.nth(1).click();
            await expect(page.locator('[data-assignee-option]')).toHaveCount(12);
            expect(requests).toBe(2);
        },
    );
}
