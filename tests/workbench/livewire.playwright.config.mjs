import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const port = Number(process.env.PLAYWRIGHT_LIVEWIRE_PORT ?? 4398);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PLAYWRIGHT_LIVEWIRE_PORT must be an integer between 1 and 65535.');
}
const runningURL = process.env.PLAYWRIGHT_LIVEWIRE_URL;
const baseURL = runningURL ?? 'http://127.0.0.1:' + port;
export default defineConfig({
    testDir: '.',
    testMatch: '*.browser.mjs',
    outputDir: '../../test-results/livewire-browser',
    workers: 1,
    timeout: 30_000,
    use: {
        baseURL,
        trace: 'retain-on-failure',
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
    },
    webServer: runningURL
        ? undefined
        : {
              cwd: root,
              command: 'php -S 127.0.0.1:' + port + ' tests/workbench/livewire-browser.php',
              env: { LIVEWIRE_BROWSER_TEST_KEY: randomBytes(32).toString('base64') },
              url: baseURL + '/health',
              timeout: 30_000,
          },
});
