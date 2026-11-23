import { expect, test } from '@playwright/test';

for (const engine of ['react', 'alpine']) {
  test.describe(engine + ' vault patterns', () => {
    async function visit(page, slug) {
      const response = await page.goto('/vault/preview/' + slug + '/?engine=' + engine);
      expect(response?.ok()).toBe(true);
    }

    test('ports distinguish online, stale and never seen and expose the last check-in', async ({ page }) => {
      await visit(page, 'patch-panel-strip');
      const stale = page.getByRole('button', { name: /HO-LT-007/ });
      await expect(stale).toContainText('Stale');
      await expect(stale).toHaveAttribute('title', /2026-03-10T08:12:00Z/);
      await stale.focus();
      await page.keyboard.press('Enter');
      await expect(stale).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('output')).toContainText('HO-LT-007 · Stale');
      await page.getByRole('button', { name: /CC-WS-003/ }).click();
      await expect(page.locator('output')).toContainText('Last check-in: Never seen');
      await page.getByRole('button', { name: /NH-WS-014/ }).click();
      await expect(page.locator('output')).toContainText('Online');
    });

    test('date/hour quote, exclusions, team overlap and reservation', async ({ page }) => {
      await visit(page, 'live-quoting-composer');
      const reserve = page.getByRole('button', { name: 'Reserve hours' });
      await expect(page.locator('output')).toHaveText('32h quoted · 120h available');
      await expect(page.getByRole('cell', { name: 'Holiday excluded', exact: true })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Weekend excluded', exact: true })).toBeVisible();
      await expect(page.getByText(/Team overlap/)).toBeVisible();
      await page.getByLabel('Part of day').selectOption('AM');
      await expect(page.locator('output')).toHaveText('16h quoted · 120h available');
      await reserve.click();
      await expect(page.locator('output')).toHaveText('16h quoted · 104h available');
      await expect(reserve).toBeDisabled();
      await page.getByLabel('Through', { exact: true }).fill('2026-12-20');
      await expect(page.locator('output')).toContainText('0h quoted');
      await expect(reserve).toBeDisabled();
      await page.getByLabel('Through', { exact: true }).fill('2027-05-20');
      await expect(page.getByText('Insufficient balance.')).toBeVisible();
      await expect(reserve).toBeDisabled();
    });

    test('pending progress and currency stay independently selectable', async ({ page }) => {
      await visit(page, 'status-vocabulary-primitives');
      for (const status of ['In progress', 'Approved', 'Pending review', 'On hold']) {
        await expect(page.getByText(status, {exact: false}).first()).toBeVisible();
      }
      const progress = page.getByRole('progressbar');
      await expect(progress).toHaveAttribute('aria-valuenow', '105');
      await page.getByLabel('Include pending progress').uncheck();
      await expect(progress).toHaveAttribute('aria-valuenow', '99');
      await expect(page.locator('dl')).toContainText(/USD\s+420,000/);
      await page.getByRole('button', { name: 'EUR' }).click();
      await expect(page.locator('dl')).toContainText(/EUR\s+180,000/);
      await expect(page.locator('dl')).toContainText(/EUR\s+300,000/);
      await expect(page.locator('dl')).not.toContainText('USD');
    });

    test('every modal exit protects edits and successful save starts a fresh snapshot', async ({ page }) => {
      await visit(page, 'dirty-modal-guard');
      const open = page.getByRole('button', { name: 'Edit record' });
      const edit = page.getByRole('dialog', { name: 'Edit record' });
      const confirm = page.getByRole('dialog', { name: 'Discard unsaved changes?' });
      await open.click();
      await page.keyboard.press('Escape');
      await expect(edit).toBeHidden();
      await open.click();
      await page.getByLabel('Asset name').fill('Edited endpoint');
      await page.keyboard.press('Escape');
      await expect(confirm).toBeVisible();
      await page.getByRole('button', { name: 'Keep editing' }).click();
      await expect(page.getByLabel('Asset name')).toHaveValue('Edited endpoint');
      await page.mouse.click(1, 1);
      await expect(confirm).toBeVisible();
      await page.getByRole('button', { name: 'Discard changes' }).click();
      await expect(confirm).toBeHidden();
      await expect(open).toBeFocused();
      await open.click();
      await expect(page.getByLabel('Asset name')).toHaveValue('NH-WS-014');
      await page.getByLabel('Branch').selectOption('Harbor Office');
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(confirm).toBeVisible();
      await page.getByRole('button', { name: 'Keep editing' }).click();
      await page.getByRole('button', { name: 'Save changes' }).click();
      await open.click();
      await expect(page.getByLabel('Branch')).toHaveValue('Harbor Office');
      await page.getByLabel('Asset name').fill('Temporary');
      await page.getByLabel('Asset name').fill('NH-WS-014');
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(edit).toBeHidden();
      await expect(confirm).toBeHidden();
    });
  });
}
