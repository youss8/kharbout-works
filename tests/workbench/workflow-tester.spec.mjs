import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const route = '/templates/workflow-tester/';

test('the approval example checks three decisions and exports its acceptance cases', async ({
    page,
}) => {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: 'Workflow & Permission Tester' })).toBeVisible();
    const decision = page.getByRole('region', { name: 'Decision' });
    const run = page.getByRole('button', { name: 'Test transition', exact: true });
    await run.click();
    await expect(decision.getByRole('heading', { name: 'Allowed' })).toBeVisible();
    await expect(decision.getByText('Approved', { exact: true })).toBeVisible();
    await expect(decision.getByText('approved', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Self-approval is blocked', exact: true }).click();
    await run.click();
    await expect(decision.getByRole('heading', { name: 'Blocked' })).toBeVisible();
    await expect(decision.getByText(/reviewer differs from the author/u).first()).toBeVisible();

    await page
        .getByRole('button', { name: 'Return without a reason is blocked', exact: true })
        .click();
    await run.click();
    await expect(decision.getByText(/a return reason is provided/iu).first()).toBeVisible();
    await expect(decision.getByText('None', { exact: true })).toBeVisible();

    const pendingDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Acceptance cases', exact: true }).click();
    const downloaded = await pendingDownload;
    const report = JSON.parse(await readFile(await downloaded.path(), 'utf8'));
    expect(report.cases.map(({ expected }) => expected.allowed)).toEqual([true, false, false]);
});

test('invalid edits keep the active contract and an imported contract can be evaluated and downloaded', async ({
    page,
}) => {
    await page.goto(route);
    const jsonEditor = page.getByRole('textbox', { name: 'Contract JSON' });
    await jsonEditor.fill('invalid');
    await page.getByRole('button', { name: 'Validate and use contract' }).click();
    await expect(jsonEditor).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText(/last validated contract remains active/u)).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Try Approve from Review to Approved' }),
    ).toBeVisible();

    const custom = {
        version: 2,
        initial: 'received',
        states: ['received', 'filed'],
        roles: ['clerk'],
        transitions: [
            {
                from: 'received',
                to: 'filed',
                action: 'file',
                roles: ['clerk'],
                requires: ['signed_receipt'],
                auditEvent: 'receipt_filed',
            },
        ],
    };
    await page.getByLabel('Open a JSON contract').setInputFiles({
        name: 'receipt.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(custom)),
    });
    await expect(page.getByText('Contract v2 is active.')).toBeVisible();
    const decision = page.getByRole('region', { name: 'Decision' });
    const run = page.getByRole('button', { name: 'Test transition', exact: true });
    await run.click();
    await expect(decision.getByRole('heading', { name: 'Blocked' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Evidence provided for signed_receipt' }).check();
    await run.click();
    await expect(decision.getByText('receipt_filed')).toBeVisible();
    await page.getByRole('button', { name: 'Save acceptance case' }).click();
    await expect(page.getByText('Acceptance case saved.')).toBeVisible();

    const pendingDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Contract JSON', exact: true }).click();
    const downloaded = await pendingDownload;
    expect(JSON.parse(await readFile(await downloaded.path(), 'utf8'))).toEqual(custom);
});

test('the transition map remains operable by keyboard on a narrow right-to-left page', async ({
    page,
}) => {
    await page.setViewportSize({ width: 320, height: 780 });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await page.goto(route);
    await page.evaluate(() => {
        document.documentElement.dir = 'rtl';
        document.documentElement.dataset.theme = 'dark';
    });
    const transition = page.getByRole('button', { name: 'Try Return from Review to Draft' });
    await transition.press('Enter');
    await expect(page.getByRole('combobox', { name: 'Action', exact: true })).toBeFocused();
    await expect(page.getByRole('combobox', { name: 'Action', exact: true })).toHaveValue('return');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
    );
});
