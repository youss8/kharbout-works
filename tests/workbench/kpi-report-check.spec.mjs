import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const route = '/templates/kpi-report-check/';

async function openReport(page) {
    await page.goto(route);
    await expect(page.locator('.kpi-check')).not.toHaveAttribute('inert');
}

test('check a portfolio KPI sample, map a pasted report, and download all periods', async ({
    page,
}) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openReport(page);
    await expect(page.getByText('67.8%', { exact: true })).toBeVisible();
    await expect(page.getByText('59.6%', { exact: true })).toBeVisible();
    await expect(page.getByText('Missing numerator, denominator.')).toBeVisible();

    const paste = page.getByLabel('Or paste CSV');
    await paste.fill('Location,Month,Result,Possible\n=2+2,Q1,0,5\nHarbor,Q1,1,0\nNorth,Q2,2,4');
    await page.getByRole('button', { name: 'Read pasted CSV' }).click();
    await expect(page.getByText('Map the four fields to calculate the rates.')).toBeVisible();
    await page.getByLabel('Numerator', { exact: true }).selectOption('2');
    await page.getByLabel('Denominator', { exact: true }).selectOption('3');
    await expect(page.getByText('Measured zero included.')).toBeVisible();
    await expect(page.getByText('Denominator must be a positive whole number.')).toBeVisible();
    await page.getByLabel('Show excluded records only').check();
    await expect(page.getByText('Measured zero included.')).toHaveCount(0);
    await page.getByLabel('Reporting period').selectOption('q2');
    await expect(page.getByText('No excluded records in this view.')).toBeVisible();
    await expect(page.getByText('50.0%', { exact: true })).toHaveCount(2);

    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download validation CSV' }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('kpi-validation-report.csv');
    const csv = await readFile(await download.path(), 'utf8');
    expect(csv).toContain('"\'=2+2"');
    expect(csv).toContain('"Q1"');
    expect(csv).toContain('"Q2"');
    expect(errors).toEqual([]);
});

test('file import and recovery work on a narrow keyboard and RTL layout', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openReport(page);
    await page.locator('html').evaluate((element) => {
        element.dir = 'rtl';
    });
    const file = page.getByLabel('Choose a CSV file');
    await file.setInputFiles({
        name: 'reports.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('Site,Period,Numerator,Denominator\n"Unclosed'),
    });
    await expect(page.getByRole('alert')).toContainText('Unclosed quoted field');
    await file.setInputFiles({
        name: 'reports.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(
            'Site,Period,Numerator,Denominator\n"فرع, شمال",Q1,1,3\nفرع آخر,Q1,2,6',
        ),
    });
    await expect(page.getByText('فرع, شمال', { exact: true })).toBeVisible();
    await expect(page.getByText('33.3%', { exact: true })).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    const jump = page.getByRole('link', { name: 'Jump to results' });
    await jump.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Validation report' })).toBeFocused();
});
