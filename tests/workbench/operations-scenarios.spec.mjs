import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';

test('scenario choices become available after the interactive module loads', async ({ page }) => {
    let releaseModule;
    const moduleReady = new Promise((resolve) => {
        releaseModule = resolve;
    });
    await page.route('**/_astro/OperationsScenario.*.js', async (route) => {
        await moduleReady;
        await route.continue();
    });
    const firstChoice = page.getByRole('button', { name: /Pool the participants/ });
    try {
        await page.goto('/scenarios/sponsor-report/', { waitUntil: 'domcontentloaded' });
        await expect(firstChoice).toBeDisabled();
    } finally {
        releaseModule();
    }
    await expect(firstChoice).toBeEnabled();
    await firstChoice.press('Enter');
    await expect(page.getByText('67.8%', { exact: true })).toBeVisible();
});

test('the sponsor scenario shares the chosen method and reporting cutoff', async ({
    page,
    browser,
}) => {
    const base = new URL('/scenarios/sponsor-report/', test.info().project.use.baseURL);
    await page
        .context()
        .grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base.origin });
    await page.goto('/');
    await page.getByRole('link', { name: 'Run the scenario' }).click();
    await expect(
        page.getByRole('heading', { name: 'What number would you report?' }),
    ).toBeVisible();
    await expect(page.getByText('67.8%', { exact: true })).toHaveCount(0);

    const firstChoice = page.getByRole('button', { name: /Pool the participants/ });
    await expect(firstChoice).toBeEnabled();
    await firstChoice.press('Enter');
    await expect(page.getByText('67.8%', { exact: true })).toBeVisible();
    await expect(page.getByText('59.6%', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Keep the original cutoff' }).click();
    const decision = page.getByRole('region', { name: 'Decision record' });
    await expect(decision).toContainText('61 retained out of 90 participants');
    await expect(decision).toContainText('Includes North Hub and Harbor Point');
    await expect(decision).toContainText('Valley Office is excluded');

    await page.getByRole('button', { name: 'Revise with the late return' }).click();
    await expect(page.getByText('60.8%', { exact: true })).toBeVisible();
    await expect(decision).toContainText('73 retained out of 120 participants');
    await expect(decision).toContainText('3 of 3 sites reporting');
    await decision.getByRole('button', { name: 'Copy decision' }).click();
    await expect(decision.getByRole('status')).toHaveText('Decision record copied.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
        '73 retained out of 120 participants',
    );
    await decision.getByRole('button', { name: 'Copy replay link' }).click();
    await expect(decision.getByRole('status')).toHaveText('Replay link copied.');
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toBe(page.url());

    const shared = await browser.newPage();
    await shared.goto(link);
    const record = shared.getByRole('region', { name: 'Decision record' });
    await expect(record).toContainText('Pooled participant rate · 60.8%');
    await record.getByText('Inspect the rule').click();
    await expect(record.getByRole('link', { name: 'Read the implementation' })).toHaveAttribute(
        'href',
        /pooledRatio\.ts$/,
    );
    await expect(record.getByRole('link', { name: 'Read the verification test' })).toHaveAttribute(
        'href',
        /sys03\.spec\.mjs#L14$/,
    );
    await expect(record.getByRole('link', { name: 'Check my own report' })).toHaveAttribute(
        'href',
        '/templates/kpi-report-check/',
    );
    await shared.getByRole('button', { name: /Average the site rates/ }).click();
    await expect(record).toContainText('Equal-weight site average · 53.1%');
    await shared.getByRole('button', { name: 'Restart scenario' }).click();
    await expect(shared.getByText('67.8%', { exact: true })).toHaveCount(0);
    await expect(shared).toHaveURL(base.href);
    await shared.goto(new URL('?v=2&method=pooled&cutoff=revised', base).href);
    await expect(record).toHaveCount(0);
    await shared.close();
});

test('the timesheet scenario replays the self-approval guard and one final credit on a narrow RTL screen', async ({
    page,
}) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/scenarios/close-timesheet/');
    await page.locator('.scenario-page').evaluate((element) => element.setAttribute('dir', 'rtl'));

    for (const [label, message] of [
        ['3 November · Record 8 hours', 'Worked Full (8h)'],
        ['9 November · Record 4 hours', 'Half Day (4h)'],
        ['Confirm as employee', 'Employee confirmed the timesheet.'],
        ['Try approving your own timesheet', 'Self-approval blocked'],
        ['Approve as a different manager', 'Manager approved the timesheet.'],
        ['Lock the month as HR', '4 overtime hours credited'],
    ]) {
        const action = page.getByRole('button', { name: label });
        await expect(action).toBeEnabled();
        await action.press('Enter');
        await expect(page.locator('.scenario-board').getByRole('status')).toContainText(message);
    }
    await expect(page.getByRole('region', { name: 'Decision record' })).toContainText(
        'HR credited 4 overtime hours',
    );
    expect(
        await page.locator('.scenario-page').evaluate((element) => element.scrollWidth),
    ).toBeLessThanOrEqual(320);
    await page.reload();
    await expect(page.locator('.scenario-rows')).toContainText('locked');
    await expect(page.locator('#attendance-log + ol li')).toHaveCount(6);
});

test('the CV has exact work links and both public A4 downloads', async ({ page }, testInfo) => {
    await page.goto('/cv/#hiring-brief');
    const brief = page.getByRole('region', { name: 'Hiring brief' });
    await expect(
        brief.getByRole('link', { name: 'Run the sponsor reporting scenario' }),
    ).toHaveAttribute('href', '/scenarios/sponsor-report/');
    await expect(
        brief.getByRole('link', { name: 'Try the leave pricing and approval rules' }),
    ).toHaveAttribute('href', '/systems/02-hr-lifecycle-crm/#leave-engine');
    await expect(brief.getByRole('link', { name: 'Inspect the endpoint monitor' })).toHaveAttribute(
        'href',
        '/systems/01-it-ops-helpdesk/#estate-overview',
    );

    for (const [label, format] of [
        ['International CV (PDF)', 'international'],
        ['DACH CV (PDF)', 'dach'],
    ]) {
        const pending = page.waitForEvent('download');
        await brief.getByRole('link', { name: label }).click();
        const download = await pending;
        const file = testInfo.outputPath(`public-cv-${format}.pdf`);
        await download.saveAs(file);
        const metadata = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
        expect(metadata).toMatch(/^Pages:\s+1\s*$/m);
        expect(metadata).toMatch(/^Page size:.*\(A4\)/m);
        const cv = execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], {
            encoding: 'utf8',
        }).replace(/\s+/g, ' ');
        expect(cv).toContain('Youssef Kharbout');
        expect(cv).toContain('Multi-Branch Operations Organization (NGO)');
        expect(cv).not.toContain('Hiring brief');
        expect(cv.includes('Open to Relocation to Germany')).toBe(format === 'dach');
    }
});
