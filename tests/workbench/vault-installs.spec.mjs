import { expect, test } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import JSZip from 'jszip';

const route = '/developer/vault-install/';

test('the keyboard kit preview uses the same search dialog offered in the install archive', async ({
    page,
}) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(route);
    const kit = page.getByRole('region', { name: 'Keyboard search dialog' });
    const preview = kit.getByText('Preview files and dependencies', { exact: true });
    await preview.focus();
    await page.keyboard.press('Enter');
    await expect(kit.getByText('react@19.3.1, react-dom@19.3.1')).toBeVisible();
    await expect(kit.getByText('src/kharbout/kits/search-dialog/SearchDialog.tsx')).toBeVisible();

    await kit.getByRole('link', { name: 'Try the component' }).click();
    const open = page.getByRole('button', { name: 'Search reading list' });
    await open.click();
    const search = page.getByRole('dialog').getByRole('combobox');
    await expect(search).toBeFocused();
    await search.fill('harbour');
    await search.press('Enter');
    await expect(page.getByLabel('Selected book')).toHaveText('The Lantern Atlas');
    await expect(open).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('published archives match registry files and the installer refuses to overwrite a host', async ({
    page,
    request,
}, testInfo) => {
    await page.goto(route);
    for (const [id, title] of [
        ['search-dialog', 'Keyboard search dialog'],
        ['saved-views', 'Role-scoped saved views'],
    ]) {
        const kit = page.getByRole('region', { name: title });
        const downloading = page.waitForEvent('download');
        await kit.getByRole('link', { name: 'Download project' }).click();
        const download = await downloading;
        expect(download.suggestedFilename()).toBe(`kharbout-vault-${id}.zip`);
        expect(new URL(download.url()).pathname).toBe(
            `/developer/vault-install/kharbout-vault-${id}.zip`,
        );
        expect((await request.get(`/developer/vault-install/${id}.zip`)).ok()).toBe(true);
        const zip = await JSZip.loadAsync(await readFile(await download.path()));
        const manifest = JSON.parse(await zip.file('install-manifest.json').async('string'));
        const registry = await page.evaluate(async (kitId) => {
            const response = await fetch(`/developer/vault-install/${kitId}.json`);
            return response.json();
        }, id);
        expect(registry.files.map(({ path }) => path)).toEqual(manifest.files);
        for (const { path, target, content } of registry.files) {
            expect(target).toBe(`~/${path}`);
            expect(await zip.file(path).async('string')).toBe(content);
        }

        const archivePath = testInfo.outputPath(id, 'archive');
        const hostPath = testInfo.outputPath(id, 'host');
        await mkdir(hostPath, { recursive: true });
        await writeFile(join(hostPath, 'package.json'), '{"dependencies":{"react":"^19"}}');
        for (const name of ['install.mjs', 'install-manifest.json', ...manifest.files]) {
            const target = join(archivePath, name);
            await mkdir(dirname(target), { recursive: true });
            await writeFile(target, await zip.file(name).async('nodebuffer'));
        }
        const run = (...args) =>
            spawnSync(process.execPath, ['install.mjs', hostPath, ...args], {
                cwd: archivePath,
                encoding: 'utf8',
                timeout: 15_000,
            });
        const firstFile = join(hostPath, manifest.files[0]);
        const preview = run();
        expect(preview.status, preview.stderr).toBe(0);
        expect(preview.stdout).toContain('Preview (no files written)');
        expect(await stat(firstFile).catch(() => null)).toBeNull();
        const installed = run('--apply');
        expect(installed.status, installed.stderr).toBe(0);
        expect(await readFile(firstFile, 'utf8')).toBe(registry.files[0].content);

        await writeFile(firstFile, 'this is my code');
        const clobber = run('--apply');
        expect(clobber.status).toBe(1);
        expect(clobber.stderr).toContain('Destination already exists');
        expect(await readFile(firstFile, 'utf8')).toBe('this is my code');
    }
});
