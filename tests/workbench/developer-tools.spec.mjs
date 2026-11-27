import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import JSZip from 'jszip';

test('the homepage replays the approval race and opens the recorded PHP evidence', async ({
    page,
    request,
}) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Replay the approval race' }).click();
    const start = page.getByRole('button', { name: 'Approve at the same time' });
    await expect(start).toBeEnabled();
    await start.press('Enter');
    const preview = page.getByRole('region', { name: 'Developer request debugger' });
    await expect(preview.getByRole('status')).toContainText('200 OK');
    await expect(preview.getByRole('status')).toContainText('409 Conflict');
    await expect(preview.getByRole('status')).toContainText('1 audit entry');
    await preview.getByRole('link', { name: 'Inspect the request trace' }).click();

    await expect(page.getByRole('heading', { name: 'Request Debugger' })).toBeVisible();
    await start.click();
    const observation = page.getByRole('region', { name: 'Selected trace step' });
    await observation.getByText('Inspect source', { exact: true }).click();
    await expect(observation.getByLabel('Relevant PHP source')).toContainText(
        'public static function race',
    );

    const sequence = page.getByRole('list', { name: 'Recorded steps' });
    await sequence.getByRole('button').last().click();
    await expect(observation).toContainText('1 approval · 1 audit event');
    const choose = page.getByRole('group', { name: 'Choose a recorded test' });
    await choose.getByRole('button', { name: /lost response/i }).click();
    await page.getByRole('button', { name: 'Retry after a timeout', exact: true }).click();
    await sequence.getByRole('button').last().click();
    await expect(observation).toContainText('1 approval · 1 audit event');

    const response = await request.get('/developer/approval-api.zip');
    expect(response.ok()).toBe(true);
    const archive = await JSZip.loadAsync(await response.body());
    for (const path of [
        'README.md',
        '.env.example',
        'composer.lock',
        'examples/approve.json',
        'routes/api.php',
        'tests/ApprovalTest.php',
        'traces/approval-api.json',
        'LICENSE',
    ])
        expect(archive.file(path), path).toBeTruthy();
    expect(Object.keys(archive.files).some((path) => path.startsWith('vendor/'))).toBe(false);
});

test('SQL computes the original and corrected totals on a narrow page and exports a runnable test', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 320, height: 780 });
    await page.goto('/developer/sql/');
    await page.locator('html').evaluate((html) => {
        html.dir = 'rtl';
    });
    const compare = page.getByRole('button', { name: 'Compare queries' });
    await expect(compare).toBeEnabled();
    await compare.press('Enter');
    await expect(page.getByRole('status')).toHaveText(/Result rows differ/);
    await expect(page.getByRole('region', { name: 'Original query results' })).toContainText(
        '2000',
    );
    await expect(page.getByRole('region', { name: 'Corrected query results' })).toContainText(
        '1000',
    );
    await page.getByText('Inspect the example’s joined rows', { exact: true }).click();
    const joins = page.getByRole('region', { name: 'Joined rows for the example' });
    await expect(joins.getByText('Repeated award', { exact: true })).toHaveCount(4);
    const original = page.getByRole('textbox', { name: 'Original query' });
    await original.fill('SELECT 9007199254740992 AS x;');
    await page
        .getByRole('textbox', { name: 'Corrected query' })
        .fill('SELECT 9007199254740993 AS x;');
    await compare.click();
    await expect(page.getByRole('region', { name: 'Corrected query results' })).toContainText(
        '9007199254740993',
    );
    await expect(page.getByRole('status')).toHaveText(/Result rows differ/);
    await original.fill('SELECT 1; SELECT 2;');
    await compare.click();
    await expect(page.getByRole('alert')).toContainText('Run one query per editor.');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download worksheet and test' }).click();
    const download = await downloadPromise;
    const archive = await JSZip.loadAsync(await readFile(await download.path()));
    const target = testInfo.outputPath('sql-download');
    await mkdir(target, { recursive: true });
    for (const entry of Object.values(archive.files)) {
        if (!entry.dir) await writeFile(join(target, entry.name), await entry.async('nodebuffer'));
    }
    expect(
        execFileSync(process.execPath, ['--test', 'worksheet.test.mjs'], {
            cwd: target,
            encoding: 'utf8',
        }),
    ).toContain('pass 1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('developer tools are discoverable from the directory and command search', async ({ page }) => {
    await page.setViewportSize({ width: 781, height: 820 });
    await page.goto('/developer/');
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(781);
    const tools = page.getByRole('navigation', { name: 'Open a developer tool' });
    await expect(tools.getByRole('link')).toHaveCount(5);
    await page.getByRole('button', { name: 'Open command search' }).click();
    await page.getByRole('combobox').fill('SQL Result Lab');
    await page.getByRole('option', { name: /SQL Result Lab/ }).click();
    await expect(page.getByRole('heading', { name: 'SQL Result Lab' })).toBeVisible();
});

test('SQL clears an earlier error when the next worker times out and can still run again', async ({
    page,
}) => {
    await page.goto('/developer/sql/');
    const original = page.getByRole('textbox', { name: 'Original query' });
    const compare = page.getByRole('button', { name: 'Compare queries' });
    await original.fill(
        'WITH source AS (SELECT 2) UPDATE awards SET amount = (SELECT * FROM source) RETURNING amount;',
    );
    await compare.click();
    await expect(page.getByRole('alert')).toContainText(/readonly database/i);

    await original.fill(
        'WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq) SELECT SUM(n) FROM seq;',
    );
    await compare.click();
    await expect(page.getByRole('alert')).toContainText('six-second limit', { timeout: 10_000 });

    await page.getByRole('button', { name: 'Reset examples' }).click();
    await compare.click();
    await expect(page.getByRole('region', { name: 'Original query results' })).toContainText(
        '2000',
    );
});
