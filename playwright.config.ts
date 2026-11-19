import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:8029';

export default defineConfig({
    testDir: './tests/browser',
    forbidOnly: Boolean(process.env.CI),
    workers: 2,
    reporter: 'list',
    use: {
        baseURL,
        trace: 'retain-on-failure',
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
    },
    webServer: {
        command: 'php artisan serve --host=127.0.0.1 --port=8029 --no-reload',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
    },
});
