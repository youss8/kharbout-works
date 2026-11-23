import { expect, test } from '@playwright/test';

const route = '/systems/02-hr-lifecycle-crm/';
test.beforeEach(async ({ page }) => {
  await page.goto(route);
});

test('leave pricing, manager deduction, HR send-back, final review and reset', async ({ page }) => {
  const desk = page.locator('#leave-engine');
  const annual = desk.locator('[aria-label="annual balance"]');
  const value = (label) => annual.locator('dl div').filter({ has: page.locator('dt', { hasText: label }) }).locator('dd');
  const actions = (name) => desk.getByRole('button', { name, exact: true });
  await expect(value('Pending')).toHaveText('24h');
  await expect(value('Used')).toHaveText('40h');
  await expect(desk.getByText('Quoted hours · 16h')).toBeVisible();
  await expect(desk.getByText('Holiday excluded')).toBeVisible();
  await expect(desk.getByText('Weekend excluded')).toBeVisible();
  await desk.getByLabel('Part of day').selectOption('am');
  await expect(desk.getByText('Quoted hours · 8h')).toBeVisible();
  await desk.getByLabel('Stand-in colleague').selectOption('E-1077');
  await actions('Submit request').click();
  await expect(value('Pending')).toHaveText('32h');
  await expect(desk.getByText('Stand-in · Mira Castell')).toBeVisible();
  await actions('Direct Manager').click();
  await actions('Manager approve').click();
  await expect(value('Pending')).toHaveText('24h');
  await expect(value('Used')).toHaveText('48h');
  await actions('Regional HR').click();
  await expect(actions('HR send-back')).toBeDisabled();
  await desk.getByLabel('Decision note').fill('Check coverage for this shift');
  await actions('HR send-back').click();
  await expect(value('Pending')).toHaveText('32h');
  await expect(value('Used')).toHaveText('40h');
  await expect(desk.locator('ol')).toContainText('Check coverage for this shift');
  await actions('Direct Manager').click();
  await actions('Manager approve').click();
  await actions('Regional HR').click();
  await actions('Complete HR review').click();
  await expect(desk.getByRole('status').last()).toContainText('HR review completed');
  await actions('Reset Demo State').click();
  await expect(value('Pending')).toHaveText('24h');
  await expect(value('Used')).toHaveText('40h');
  await expect(desk.getByText('Quoted hours · 16h')).toBeVisible();
});

test('insufficient balance blocks submission and rejection releases only the reserved hours', async ({ page }) => {
  const desk = page.locator('#leave-engine');
  await desk.getByLabel('Through', { exact: true }).fill('2027-09-01');
  await expect(desk.getByRole('button', { name: 'Submit request' })).toBeDisabled();
  await expect(desk.getByText('The quote exceeds the available balance.')).toBeVisible();
  await desk.getByRole('button', { name: 'Direct Manager' }).click();
  await expect(desk.getByText('Team overlap · Jordan Okafor').last()).toBeVisible();
  await desk.getByLabel('Decision note').fill('Coverage unavailable');
  await desk.getByRole('button', { name: 'Reject with note' }).click();
  await expect(desk.locator('[aria-label="annual balance"] dl div').filter({ hasText: 'Pending' })).toHaveText('Pending0h');
  await expect(desk.locator('ol')).toContainText('Coverage unavailable');
});

test('timesheet gates, self-approval guard, one-time credit and revocation', async ({ page }) => {
  const desk = page.locator('#attendance-amend');
  const action = (name) => desk.getByRole('button', { name, exact: true });
  await expect(desk.getByText('DRAFT', { exact: true }).first()).toBeVisible();
  await expect(action('Employee confirm')).toBeDisabled();
  await action('Resolve 2026-11-03').click();
  await desk.getByRole('dialog').getByRole('button', { name: 'Worked Full (8h)' }).click();
  await action('Resolve 2026-11-09').click();
  await desk.getByRole('dialog').getByRole('button', { name: 'Half Day (4h)' }).click();
  await expect(desk.locator('.hr-watermark')).toBeHidden();
  await action('Employee confirm').click();
  await desk.getByLabel('Approving manager is the employee').check();
  await action('Manager approve').click();
  await expect(desk.getByRole('status')).toContainText('Self-approval blocked');
  await expect(action('HR lock')).toBeDisabled();
  await desk.getByLabel('Approving manager is the employee').uncheck();
  await action('Manager approve').click();
  await action('HR lock').click();
  await expect(desk.locator('[data-credit]')).toHaveText('4h');
  await expect(action('HR lock')).toBeDisabled();
  await desk.getByLabel('Credit already consumed').check();
  await action('Reopen').click();
  await expect(desk.getByRole('status')).toContainText('Reopen blocked');
  await expect(desk.locator('[data-credit]')).toHaveText('4h');
  await desk.getByLabel('Credit already consumed').uncheck();
  await action('Reopen').click();
  await expect(desk.locator('[data-credit]')).toHaveText('0h');
  await expect(action('Employee confirm')).toBeEnabled();
  await action('Reset Demo State').click();
  await expect(desk.locator('.hr-watermark')).toBeVisible();
  await expect(action('Employee confirm')).toBeDisabled();
});

test('asSigned reads the original snapshot and masks both pay tiers for the platform admin', async ({ page }) => {
  const desk = page.locator('#attendance-amend');
  await desk.getByRole('tab', { name: 'Attendance month' }).press('ArrowRight');
  await expect(desk.getByRole('tab', { name: 'Contract asSigned() diff' })).toBeFocused();
  const panel = desk.getByRole('tabpanel', { name: 'Contract asSigned() diff' });
  await expect(panel).toContainText('East Annex');
  await expect(panel).toContainText('Senior Operations Coordinator');
  await expect(panel).toContainText('Amendment offset · -14h · 14 leave days preserved');
  await expect(panel).toContainText('$2,300 / mo');
  await expect(panel).toContainText('$2,450 / mo');
  await desk.getByRole('button', { name: 'Platform Admin' }).click();
  await expect(panel.getByText('[ENCRYPTED — BLOCKED BY ROLE DENY-LIST]', { exact: true })).toHaveCount(2);
  await expect(panel).not.toContainText('$2,');
  await desk.getByRole('button', { name: 'HR Manager' }).click();
  await expect(panel).toContainText('$2,450 / mo');
  await desk.getByRole('button', { name: 'Reset Demo State' }).click();
  await expect(desk.getByRole('tab', { name: 'Attendance month' })).toHaveAttribute('aria-selected', 'true');
});
