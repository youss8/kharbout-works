import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { expect, test } from '@playwright/test';
import JSZip from 'jszip';

test('runs the real React workflow by keyboard, compares the recorded Livewire trace, and downloads runnable checks', async ({
    page,
}, info) => {
    await page.setViewportSize({ width: 320, height: 780 });
    await page.goto('/developer/stack-parity/');
    await expect(page.getByText('Livewire · recorded')).toHaveCount(3);
    await expect(page.getByText('Pending run')).toHaveCount(3);
    const run = page.getByRole('button', { name: 'Run React comparison' });
    await expect(run).toBeEnabled();
    await run.press('Enter');
    await expect(page.locator('.parity-feedback')).toHaveText('3/3 checkpoints match the fixture.');
    const stale = page
        .getByRole('listitem')
        .filter({ has: page.getByRole('heading', { name: 'Submit after another edit' }) });
    await expect(stale.getByText('Review v2', { exact: true })).toHaveCount(2);
    await expect(stale.getByText('None', { exact: true })).toHaveCount(2);
    await expect(
        stale.getByText('Record changed. Reload the latest version.', { exact: true }),
    ).toHaveCount(2);
    const fresh = page
        .getByRole('listitem')
        .filter({ has: page.getByRole('heading', { name: 'Reload and approve' }) });
    await expect(fresh.getByText('Approved v3', { exact: true })).toHaveCount(2);
    await expect(fresh.getByText('status_changed', { exact: true })).toHaveCount(2);
    await expect(fresh.getByText('Review → Approved · v3', { exact: true })).toHaveCount(2);
    await page.evaluate(() => {
        document.documentElement.dir = 'rtl';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

    const download = page.getByRole('link', { name: 'Download fixture and checks' });
    await expect(download).toHaveAttribute('href', '/developer/stack-parity.zip');
    await expect(download).toHaveAttribute('download', '');
    const bytes = await page.evaluate(
        async (href) => {
            const response = await fetch(href);
            if (!response.ok) throw new Error('The parity archive could not be fetched.');
            return Array.from(new Uint8Array(await response.arrayBuffer()));
        },
        await download.getAttribute('href'),
    );
    const zip = await JSZip.loadAsync(new Uint8Array(bytes));
    const folder = info.outputPath('stack-parity');
    for (const file of Object.values(zip.files).filter(({ dir }) => !dir)) {
        const destination = join(folder, file.name);
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, await file.async('nodebuffer'));
    }
    const result = execFileSync(process.execPath, ['--test', 'tests/stack-parity.test.mjs'], {
        cwd: folder,
        encoding: 'utf8',
    });
    expect(result).toContain('pass 3');
});
