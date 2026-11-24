import { expect, test } from '@playwright/test';

const attachment = {
    name: 'exclusive-schedule-record.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('private-demo-marker-7411'),
};

export function scheduleGuardCases(engine, url) {
    test.describe(engine + ' schedule guard', () => {
        test.use({ viewport: { width: 375, height: 812 } });
        const open = async (page) => {
            await page.goto(url);
            await page.getByRole('button', { name: 'Edit schedule' }).click();
            return page.getByRole('dialog', { name: 'Edit schedule' });
        };
        test('pending file survives a rejected save until acknowledgement and stays local', async ({
            page,
        }) => {
            const requests = [];
            page.on('request', (request) =>
                requests.push(request.url() + ' ' + (request.postData() ?? '')),
            );
            const editor = await open(page);
            await editor.getByLabel('Start time').fill('09:00:00');
            await expect(editor).toContainText('No changes');
            await editor.getByLabel('Schedule attachment').setInputFiles(attachment);
            await expect(editor).toContainText('Unsaved changes');
            await editor.getByLabel('Reject next save').check();
            await editor.getByRole('button', { name: 'Save schedule' }).click();
            await expect(editor.getByRole('alert')).toContainText('rejected');
            await expect(editor).toContainText('Unsaved changes');
            expect(
                await editor
                    .getByLabel('Schedule attachment')
                    .evaluate((e) => e.files.item(0).name),
            ).toBe(attachment.name);
            await editor.getByRole('button', { name: 'Cancel' }).click();
            await editor.getByRole('button', { name: 'Keep editing' }).click();
            await expect(editor.getByLabel('Hours')).toBeFocused();
            await editor.getByLabel('Hours').fill(' 6 ');
            await editor.getByRole('button', { name: 'Retry' }).click();
            await expect(editor).not.toBeVisible();
            await page.getByRole('button', { name: 'Edit schedule' }).click();
            await expect(editor.getByLabel('Hours')).toHaveValue('6');
            await expect(editor.getByLabel('Start time')).toHaveValue('09:00');
            await expect(editor.getByLabel('Schedule attachment')).toHaveValue('');
            await expect(editor).toContainText('No changes');
            await editor.getByRole('button', { name: 'Cancel' }).click();
            expect(requests.join('\n')).not.toContain(attachment.name);
            expect(requests.join('\n')).not.toContain('private-demo-marker-7411');
        });
        test('unsaved navigation guards browser back, reload, and links, then restores the saved form', async ({
            page,
        }) => {
            const editor = await open(page);
            await editor.getByLabel('Schedule attachment').setInputFiles(attachment);
            await page.evaluate(() => history.back());
            const discard = editor.getByRole('group', { name: 'Unsaved changes' });
            await expect(discard).toBeVisible();
            await discard.getByRole('button', { name: 'Keep editing' }).click();
            const prompt = page.waitForEvent('dialog');
            await page.evaluate(() => {
                setTimeout(() => location.reload(), 0);
            });
            const native = await prompt;
            expect(native.type()).toBe('beforeunload');
            await native.dismiss();
            await expect(editor).toBeVisible();
            await editor.getByRole('link', { name: 'Schedule policy' }).click();
            await expect(discard).toBeVisible();
            await discard.getByRole('button', { name: 'Keep editing' }).click();
            expect(new URL(page.url()).hash).toBe('');
            await editor.getByLabel('Hours').fill('13');
            await editor.getByRole('link', { name: 'Schedule policy' }).click();
            await discard.getByRole('button', { name: 'Discard changes' }).click();
            await expect(page).toHaveURL(/#schedule-policy$/);
            await expect(editor).not.toBeVisible();
            await page.getByRole('button', { name: 'Edit schedule' }).click();
            await expect(editor.getByLabel('Schedule attachment')).toHaveValue('');
            await expect(editor.getByLabel('Hours')).toHaveValue('5');
            await page.evaluate(() => history.back());
            await expect(editor).not.toBeVisible();
        });
    });
}
