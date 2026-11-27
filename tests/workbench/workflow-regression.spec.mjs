import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';

async function downloadRunner(page, directory) {
    const promised = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CI suite' }).click();
    const download = await promised;
    expect(download.suggestedFilename()).toBe('workflow-regression.zip');
    const zip = await JSZip.loadAsync(await readFile(await download.path()));
    const files = [
        'LICENSE',
        'README.md',
        'acceptance-suite.json',
        'baseline.json',
        'candidate.json',
        'package.json',
        'regression.test.mjs',
        'runtime.mjs',
    ];
    expect(Object.keys(zip.files).sort()).toEqual(files);
    await mkdir(directory, { recursive: true });
    await Promise.all(
        files.map(async (name) =>
            writeFile(join(directory, name), await zip.file(name).async('nodebuffer')),
        ),
    );
    return spawnSync(process.execPath, ['--test', 'regression.test.mjs'], {
        cwd: directory,
        encoding: 'utf8',
    });
}

test('catch and repair the self-approval regression in the browser and downloaded CI suite', async ({
    page,
}, info) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/developer/workflow-regression/');
    await expect(page.locator('.workflow-regression')).not.toHaveAttribute('inert', '');
    const status = page.locator('.regression-summary__result');
    await expect(status).toContainText('3/4 passing · 1 regression');
    const selfApproval = page
        .getByRole('listitem')
        .filter({ hasText: 'Self-approval is blocked' })
        .first();
    await expect(selfApproval.getByText('Blocked → Allowed')).toBeVisible();
    await expect(selfApproval.getByText('different_author', { exact: true })).toBeVisible();

    const failing = await downloadRunner(page, info.outputPath('failing-suite'));
    expect(failing.status, failing.stderr).toBe(1);
    expect(failing.stdout).toContain('fail 1');
    expect(failing.stdout).toContain('Self-approval is blocked');

    await page.getByRole('button', { name: 'Restore reviewer guard' }).press('Enter');
    await expect(status).toContainText('4/4 passing · 0 regressions');

    const passing = await downloadRunner(page, info.outputPath('passing-suite'));
    expect(passing.status, passing.stderr).toBe(0);
    expect(passing.stdout).toContain('pass 4');
    await page.evaluate(() => {
        document.documentElement.dir = 'rtl';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('imports candidate and independent acceptance JSON, then reports invalid edits', async ({
    page,
}) => {
    await page.goto('/developer/workflow-regression/');
    await expect(page.locator('.workflow-regression')).not.toHaveAttribute('inert', '');
    await page.getByText('Candidate policy JSON', { exact: true }).press('Enter');
    const candidate = page.getByRole('textbox', { name: 'Candidate policy editor' });
    const fixed = JSON.parse(await candidate.inputValue());
    fixed.version = 3;
    fixed.transitions.find(({ action }) => action === 'approve').requires.push('different_author');
    await page.getByLabel('Import candidate policy JSON').setInputFiles({
        name: 'fixed-policy.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(fixed)),
    });
    await expect(page.getByText('fixed-policy.json is ready to compare.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download CI suite' })).toBeDisabled();

    await page.getByText('Acceptance suite JSON', { exact: true }).press('Enter');
    const suite = JSON.parse(
        await page.getByRole('textbox', { name: 'Acceptance suite editor' }).inputValue(),
    );
    await page.getByLabel('Import acceptance suite JSON').setInputFiles({
        name: 'acceptance.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({ contractVersion: 1, cases: [suite.cases[1]] })),
    });
    await expect(page.getByText('acceptance.json is ready to compare.')).toBeVisible();
    await page.getByRole('button', { name: 'Compare policies' }).press('Enter');
    await expect(page.locator('.regression-summary__result')).toContainText('1/1 passing');
    await expect(page.getByText('Baseline v1 · Candidate v3')).toBeVisible();

    await candidate.fill('{');
    await page.getByRole('button', { name: 'Compare policies' }).press('Enter');
    await expect(candidate).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('alert')).toContainText('invalid JSON');
    await expect(page.getByRole('button', { name: 'Download CI suite' })).toBeDisabled();
});
