import { access } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const build = fileURLToPath(new URL('../dist/', import.meta.url));
const origin = 'https://workbench.invalid';
await access(resolve(build, 'cv', 'index.html'));
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({
    executablePath,
    channel: executablePath ? undefined : 'chromium',
});

try {
    for (const [format, button] of [
        ['international', 'International / Remote Tech'],
        ['dach', 'DACH / Germany'],
    ]) {
        const page = await browser.newPage();
        await page.route('**/*', async (route) => {
            const { origin: requestOrigin, pathname } = new URL(route.request().url());
            const file = resolve(
                build,
                decodeURIComponent(pathname).replace(/^\/+/, ''),
                pathname.endsWith('/') ? 'index.html' : '',
            );
            if (requestOrigin !== origin || !file.startsWith(resolve(build) + sep)) {
                await route.abort();
                return;
            }
            try {
                await route.fulfill({ path: file });
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
                await route.fulfill({ status: 404 });
            }
        });
        const response = await page.goto(origin + '/cv/');
        if (!response?.ok())
            throw new Error(`CV page returned HTTP ${response?.status() ?? 'unknown'}.`);
        await page.locator('.cv-portrait:not([x-cloak])').waitFor({ state: 'attached' });
        const control = page.getByRole('button', { name: button, exact: true });
        await control.click();
        await page.waitForFunction(
            (name) =>
                [...document.querySelectorAll('.cv-formats button')].some(
                    (item) =>
                        item.textContent.trim() === name &&
                        item.getAttribute('aria-pressed') === 'true',
                ),
            button,
        );
        await page.emulateMedia({ media: 'print' });
        await page.evaluate(() => document.fonts.ready);
        const path = fileURLToPath(new URL(`../public/cv-${format}.pdf`, import.meta.url));
        await page.pdf({ path, preferCSSPageSize: true, printBackground: true, tagged: true });
        await page.close();
        console.log(`Wrote ${path}`);
    }
} finally {
    await browser.close();
}
