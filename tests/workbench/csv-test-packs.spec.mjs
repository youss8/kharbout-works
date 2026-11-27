import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';

test('generate Arabic CSV fixtures with custom outcomes and download a self-contained pack', async ({
    page,
}) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/developer/csv-test-packs/');
    await expect(page.locator('.csv-pack')).not.toHaveAttribute('inert', '');
    await expect(page.getByText('3 accepted')).toBeVisible();

    await page.getByLabel('Seed').fill('../path');
    await page.getByRole('button', { name: 'Generate fixtures' }).click();
    await expect(page.getByRole('alert')).toContainText('Start with a letter or digit.');
    await expect(page.getByText('3 accepted')).toBeVisible();

    await page.getByLabel('Seed').fill('november-ops');
    await page.getByLabel('Header language').selectOption('ar');
    await page.getByLabel('Duplicate IDs').selectOption('keep-first');
    await page.getByLabel('Ambiguous dates').selectOption('day-first');
    await page.getByLabel('Blank quantities').selectOption('null');
    await page.getByRole('button', { name: 'Generate fixtures' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('6 accepted')).toBeVisible();
    await expect(page.getByText('1 skipped')).toBeVisible();
    await expect(page.getByText('Interpreted as 2026-04-03')).toBeVisible();

    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download test pack (.zip)' }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('csv-test-pack-november-ops.zip');
    const archive = await JSZip.loadAsync(await readFile(await download.path()));
    const expected = JSON.parse(await archive.file('expected.json').async('string'));
    expect(expected.rows[3].value.quantity).toBeNull();
    expect(expected.rows[4].value.date).toBe('2026-04-03');
    expect(expected.rows[7].status).toBe('skipped');
    expect(await archive.file('sample.csv').async('string')).toContain('معرّف السجل');
    expect(await archive.file('README.md').async('string')).toContain(
        'node --test import.test.mjs',
    );
    expect(errors).toEqual([]);
});

test('CSV source and primary actions remain accessible on a narrow RTL layout', async ({
    page,
}) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.goto('/developer/csv-test-packs/');
    await expect(page.locator('.csv-pack')).not.toHaveAttribute('inert', '');
    await page.locator('html').evaluate((element) => {
        element.dir = 'rtl';
    });
    await page.getByLabel('Include a UTF-8 byte order mark').uncheck();
    await page.getByRole('button', { name: 'Generate fixtures' }).click();
    await page.getByText('View sample CSV', { exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.csv-pack-source pre')).toContainText('Record ID');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download sample CSV' }).click();
    const download = await downloading;
    const csv = await readFile(await download.path(), 'utf8');
    expect(csv.startsWith('"Record ID"')).toBe(true);
});
