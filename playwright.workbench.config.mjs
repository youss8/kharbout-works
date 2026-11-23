import { defineConfig } from '@playwright/test';

const runningURL = process.env.PLAYWRIGHT_WORKBENCH_URL;
const baseURL = runningURL ?? 'http://127.0.0.1:4339';

export default defineConfig({
    testDir: './tests/workbench',
    outputDir: './test-results/workbench',
    forbidOnly: Boolean(process.env.CI),
    workers: 2,
    reporter: 'list',
    use: {
        baseURL,
        trace: 'retain-on-failure',
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
    },
    webServer: runningURL ? undefined : {
        command: 'node ./node_modules/astro/astro.js preview --host 127.0.0.1 --port 4339',
        url: baseURL,
        reuseExistingServer: false,
    },
});
