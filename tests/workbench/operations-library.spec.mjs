import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';

test('Prompt Evidence exposes recorded Arabic scores and both rubric-backed prompts', async ({
    page,
    request,
}) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/ai-kit/prompt-evidence/');
    await expect(page.getByRole('heading', { name: 'Prompt Evidence' })).toBeVisible();
    const arabic = page
        .getByRole('row')
        .filter({ has: page.getByRole('link', { name: 'Qwen via Ollama · Arabic examples' }) });
    await expect(arabic.getByText('39/49')).toBeVisible();
    await expect(arabic.getByText('36/49')).toBeVisible();
    await page.getByRole('link', { name: 'Inspect the note-summary prompts' }).press('Enter');
    const example = page.locator('#qwen-ar-summarize-notes');
    await expect(example).toHaveAttribute('open', '');
    await expect(example.getByText('6/6 → 2/6 · −4 checks')).toBeVisible();
    await expect(example.locator('pre[lang="ar"][dir="rtl"]')).toHaveCount(2);
    await expect(example.getByRole('listitem')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

    const scores = await request.get('/ai-kit/prompt-evidence/recorded-runs.json');
    expect(scores.ok()).toBe(true);
    expect((await scores.json()).runs).toHaveLength(5);
});

test('the reusable approval desk blocks invalid actions and records successful returns', async ({
    page,
}) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/vault/recipes/approval-workflow/');
    const desk = page.getByRole('region', { name: 'Approval workflow demo' });
    await expect(page.locator('astro-island').filter({ has: desk })).not.toHaveAttribute('ssr', '');

    const record = desk.getByLabel('In-scope request');
    await record.selectOption('REQ-1043');
    await desk.getByRole('button', { name: 'Approve request' }).press('Enter');
    await expect(desk.getByRole('status')).toHaveText(
        'A reviewer cannot approve their own request.',
    );
    await expect(desk.getByText('No transitions recorded in this session.')).toBeVisible();

    await record.selectOption('REQ-1042');
    await desk.getByRole('button', { name: 'Return request' }).press('Enter');
    await expect(desk.getByRole('status')).toHaveText(
        'Add a return reason before returning this request.',
    );
    await desk.getByLabel('Return reason').fill('Attach the replacement quote.');
    await desk.getByLabel('Return reason').press('Enter');
    await expect(desk.getByRole('status')).toHaveText('REQ-1042 moved to draft.');
    await expect(
        desk.getByRole('heading', { name: 'Replace the warehouse scanner' }),
    ).toBeFocused();
    await expect(
        desk.getByText('Returned by Samira Noor · Version 2 · Attach the replacement quote.'),
    ).toBeVisible();

    await desk.getByLabel('Active actor').selectOption('robin');
    await expect(record.locator('option')).toHaveText([
        'REQ-1044 · Replace a damaged display cable',
    ]);
    await page.getByText('Permission matrix', { exact: true }).press('Enter');
    await expect(desk.getByRole('table')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('the recipe download contains a standalone project with passing acceptance checks', async ({
    request,
}, testInfo) => {
    const response = await request.get('/vault/recipes/approval-workflow.zip');
    expect(response.ok()).toBe(true);
    const archive = await JSZip.loadAsync(await response.body());
    const files = Object.values(archive.files).filter((item) => !item.dir);
    expect(files.map((item) => item.name.split('/').at(-1)).sort()).toEqual([
        'ApprovalDesk.jsx',
        'LICENSE',
        'README.md',
        'index.html',
        'main.jsx',
        'package-lock.json',
        'package.json',
        'permission-matrix.json',
        'smoke.test.mjs',
        'style.css',
        'workflow.mjs',
    ]);
    for (const file of files) {
        const target = testInfo.outputPath(file.name);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, await file.async('nodebuffer'));
    }
    const root = testInfo.outputPath('approval-workflow');
    const result = execFileSync(process.execPath, ['--test', 'smoke.test.mjs'], {
        cwd: root,
        encoding: 'utf8',
    });
    expect(result).toContain('pass 3');
});
