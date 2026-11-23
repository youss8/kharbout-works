import { execFileSync } from 'node:child_process';
import { expect, test as base } from '@playwright/test';

const test = base.extend({
    runtimeDiagnostics: [async ({ page }, use) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (entry) => {
            if (entry.type() === 'error' || entry.type() === 'warning') errors.push(entry.text());
        });
        await use();
        expect(errors, 'Browser console and runtime diagnostics').toEqual([]);
    }, { auto: true }],
});

async function expectToFitViewport(page) {
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
    }))).toEqual({ content: 375, viewport: 375 });
}

test('theme is established in the head and the user choice survives reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // Capture the real head's result as the parser reaches the end of it, before body content appears.
    await page.route('**/', async (route) => {
        const response = await route.fetch();
        const html = await response.text();
        await route.fulfill({
            response,
            body: html.replace('</head>', '<script>window.themeBeforeBody = document.documentElement.dataset.theme;</script></head>'),
        });
    });
    await page.goto('/');
    expect(await page.evaluate(() => window.themeBeforeBody)).toBe('light');
    const toggle = page.getByRole('button', { name: 'Dark mode' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('yok-theme'))).toBe('dark');
    await page.reload();
    expect(await page.evaluate(() => window.themeBeforeBody)).toBe('dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('the architecture tabs switch ownership, metrics, and modeling challenges', async ({ page }) => {
    await page.goto('/');
    const tabs = page.getByRole('tablist', { name: 'System architecture' });
    const panels = page.getByRole('tabpanel');
    const cases = [
        { code: 'SYS-01', scope: /100% solo/i, scale: '47', challenge: /field.level changes/i },
        { code: 'SYS-02', scope: /pre.rms/i, scale: '136', challenge: /leave quote/i },
        { code: 'SYS-03', scope: /80%/i, scale: '~98', challenge: /numerators and denominators/i },
    ];
    await expect(tabs.getByRole('tab', { selected: true })).toHaveAccessibleName(/SYS-01/);
    for (const { code, scope, scale, challenge } of cases) {
        const tab = tabs.getByRole('tab', { name: new RegExp(code) });
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        await expect(panels).toHaveCount(1);
        await expect(panels).toContainText(scope);
        await expect(panels.locator('dd')).toHaveCount(4);
        await expect(panels.getByText(scale, { exact: true })).toBeVisible();
        await expect(panels).toContainText(challenge);
    }
    await tabs.getByRole('tab', { name: /SYS-03/ }).press('ArrowLeft');
    await expect(tabs.getByRole('tab', { name: /SYS-02/ })).toBeFocused();
});

test('mobile navigation can be used and dismissed at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expectToFitViewport(page);
    const open = page.getByRole('button', { name: 'Open navigation' });
    await open.click();
    const menu = page.getByRole('dialog', { name: 'Navigation' });
    await expect(menu).toBeVisible();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(open).toBeFocused();
    await open.click();
    await menu.getByRole('link', { name: /CV/ }).click();
    await expect(page).toHaveURL(/\/cv\/?$/);
    await expectToFitViewport(page);
    await page.getByRole('button', { name: /DACH/ }).click();
    await expectToFitViewport(page);
});

test('CV modes and private employer override update the printable document', async ({ page }) => {
    await page.goto('/cv/');
    const standard = page.getByRole('button', { name: /International \/ Remote Tech/ });
    const dach = page.getByRole('button', { name: /DACH \/ Germany/ });
    const portrait = page.locator('.cv-portrait');
    const employer = page.getByRole('textbox', { name: /Employer/ });
    const sheet = page.getByRole('article');
    const defaultEmployer = 'Multi-Branch Operations Organization (NGO)';
    await expect(standard).toHaveAttribute('aria-pressed', 'true');
    await expect(portrait).toBeHidden();
    await expect(employer).toHaveValue(defaultEmployer);
    await dach.focus();
    await page.keyboard.press('Enter');
    await expect(dach).toHaveAttribute('aria-pressed', 'true');
    await expect(portrait).toBeVisible();
    const box = await portrait.boundingBox();
    expect(box).toMatchObject({ width: 96, height: 116 });
    await expect(sheet.getByText(/Open to Relocation to Germany.*German A1\.2/)).toBeVisible();
    await standard.click();
    await expect(portrait).toBeHidden();
    await employer.fill('Fictional Works <b>Group</b>');
    await expect(sheet).toContainText('Fictional Works <b>Group</b>');
    await employer.fill('');
    await expect(sheet).toContainText(defaultEmployer);
    await page.evaluate(() => { window.print = () => { window.workbenchPrintCalls = (window.workbenchPrintCalls ?? 0) + 1; }; });
    await page.getByRole('button', { name: /Print \/ Save PDF/ }).click();
    expect(await page.evaluate(() => window.workbenchPrintCalls)).toBe(1);
    await employer.fill('Fictional Works Group');
    await page.reload();
    await expect(employer).toHaveValue(defaultEmployer);
});

for (const format of ['international', 'dach']) {
    test(`CV exports a text-selectable A4 PDF in ${format} mode`, async ({ page }, testInfo) => {
        await page.goto('/cv/');
        if (format === 'dach') await page.getByRole('button', { name: /DACH/ }).click();
        await page.getByRole('textbox', { name: /Employer/ }).fill('Fictional Works Group');
        await page.getByRole('button', { name: 'Dark mode' }).click();
        await page.emulateMedia({ media: 'print' });
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByRole('button', { name: /Print \/ Save PDF/ })).toBeHidden();
        await expect(page.getByRole('textbox', { name: /Employer/ })).toBeHidden();
        const filename = testInfo.outputPath(`cv-${format}.pdf`);
        // Prefer the document's own @page size so a missing A4 declaration fails this check.
        await page.pdf({ path: filename, preferCSSPageSize: true, printBackground: true });
        const metadata = execFileSync('pdfinfo', [filename], { encoding: 'utf8' });
        const pages = Number(metadata.match(/^Pages:\s+(\d+)/m)?.[1]);
        expect(pages).toBeGreaterThanOrEqual(1);
        expect(pages).toBeLessThanOrEqual(2);
        expect(metadata).toMatch(/^Page size:.*\(A4\)/m);
        const pdfText = execFileSync('pdftotext', ['-enc', 'UTF-8', filename, '-'], { encoding: 'utf8' });
        const text = pdfText.replace(/\s+/g, ' ');
        for (const term of ['Youssef Kharbout', 'Fictional Works Group', 'SaaS', 'University of Aleppo', 'Germany', 'mentorship']) {
            expect(text).toContain(term);
        }
        expect(text).not.toMatch(/(?:GPA|72\s*%|Employer for private PDF|Print \/ Save PDF)/i);
        expect(/Open to Relocation to Germany.*?German A1\.2/i.test(text)).toBe(format === 'dach');
        const textPages = pdfText.split('\f');
        for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
            expect(textPages[pageIndex]?.trim().length, `Text on PDF page ${pageIndex + 1}`).toBeGreaterThan(100);
        }
        await testInfo.attach(`${format} CV · ${pages} A4 page(s)`, { path: filename, contentType: 'application/pdf' });
    });
}
