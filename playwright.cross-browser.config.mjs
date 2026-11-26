import { defineConfig } from '@playwright/test';
import catalogue from './playwright.config.ts';
import workbench from './playwright.workbench.config.mjs';

const suites = [
    {
        name: 'catalogue',
        config: catalogue,
        grep: /clipboard is denied|search preserves the shared Browse URL|the entry Back link restores/,
    },
    {
        name: 'workbench',
        config: workbench,
        grep: /the two homepage previews match|command palette resolves every intent|CV modes and private employer override/,
    },
];

export default defineConfig({
    forbidOnly: Boolean(process.env.CI),
    workers: 2,
    reporter: 'list',
    outputDir: './test-results/cross-browser',
    use: { trace: 'retain-on-failure' },
    projects: ['chromium', 'firefox', 'webkit'].flatMap((browserName) =>
        suites.map(({ name, config, grep }) => ({
            name: name + '-' + browserName,
            testDir: config.testDir,
            grep,
            use: { browserName, baseURL: config.use.baseURL },
        })),
    ),
    webServer: suites.map(({ config }) => config.webServer).filter(Boolean),
});
