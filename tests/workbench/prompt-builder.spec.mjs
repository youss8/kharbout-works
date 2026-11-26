import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const route = '/ai-kit/prompt-builder/';
const prompt = (page, variant = 'concise') => page.locator('pre[data-variant=' + variant + ']');
const button = (page, name) => page.getByRole('button', { name, exact: true });

test('find a preset from search and preserve literal content in previews, edits, and exports', async ({ page, context }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/ai-kit/');
    await expect(page.getByRole('link', { name: 'Build a prompt' })).toHaveAttribute('href', route);
    await page.getByRole('button', { name: 'Open command search' }).click();
    await page.getByRole('combobox', { name: 'Search pages, assets and quick actions' }).fill('تحويل بلاغ خلل');
    await page.getByRole('option', { name: /Turn a bug report into a spec/ }).click();
    await expect(page).toHaveURL(/prompt-builder\/\?workflow=bug-to-spec$/);
    await expect(page.getByText('Still to add')).toBeVisible();
    await button(page, 'Load example').click();
    await expect(page.getByText('Example planned')).toBeVisible();
    await expect(page.getByText('Still to add')).toBeHidden();
    const literal = '<em>État الحالة</em> {{TASK}} $&';
    await page.getByRole('textbox', { name: 'Observed behavior', exact: true }).fill(literal);
    await expect(prompt(page)).toContainText(literal);
    await expect(prompt(page).locator('em')).toHaveCount(0);
    await button(page, 'Compare variants').click();
    await expect(prompt(page, 'detailed')).toContainText('Give testable acceptance criteria');
    await page.getByRole('region', { name: 'Concise', exact: true }).getByRole('button', { name: 'Edit prompt' }).click();
    const edit = 'Keep this literal\n' + literal;
    await page.getByRole('textbox', { name: 'Editing prompt · Concise' }).fill(edit);
    await page.getByRole('textbox', { name: 'Expected behavior', exact: true }).fill('Updated expected outcome');
    await button(page, 'Done editing').click();
    expect(await prompt(page).textContent()).toBe(edit);
    await button(page, 'Copy prompt').click();
    await expect.poll(async () => (await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n')).toBe(edit);
    for (const [label, extension] of [['Download Markdown', 'md'], ['Download plain text', 'txt']]) {
        const pending = page.waitForEvent('download');
        await button(page, label).click();
        const download = await pending;
        expect(download.suggestedFilename()).toBe('prompt-builder.' + extension);
        expect(await readFile(await download.path(), 'utf8')).toBe(edit);
    }
    page.once('dialog', dialog => dialog.accept());
    await button(page, 'Regenerate from answers').click();
    await expect(prompt(page)).toContainText('Updated expected outcome');
    expect(errors).toEqual([]);
});

test('imports a new draft, restores the device library on reload, and confirms each handoff', async ({ page }) => {
    await page.goto(route + '?chain=bug-fix');
    await button(page, 'Load example').click();
    await button(page, 'Review what carries forward').click();
    const handoff = page.getByRole('textbox', { name: /Confirmed facts to carry forward/ });
    await expect(handoff).toHaveValue(/catalogue stays empty/);
    await handoff.fill('Confirmed: status clearing leaves the list empty.');
    await button(page, 'Continue to next step').click();
    await expect(page.getByRole('combobox', { name: 'Workflow', exact: true })).toHaveValue('implementation-brief');
    await expect(page.getByRole('textbox', { name: 'Goal', exact: true })).toHaveValue(/restore the full list/);
    await expect(prompt(page)).toContainText('Confirmed: status clearing leaves the list empty.');
    await page.getByRole('textbox', { name: 'Draft name' }).fill('Implementation draft');
    await button(page, 'Save draft').click();
    await expect(page.getByText('Implementation draft', { exact: true })).toBeVisible();
    await button(page, 'Add workflow to favorites').click();
    await expect(page.getByText('Favorites', { exact: true })).toBeVisible();
    await page.reload();
    const saved = page.getByRole('listitem').filter({ hasText: 'Implementation draft' });
    await saved.getByRole('button', { name: 'Open' }).click();
    await expect(button(page, 'Remove workflow from favorites')).toHaveAttribute('aria-pressed', 'true');
    await expect(prompt(page)).toContainText('Confirmed: status clearing leaves the list empty.');
    await button(page, 'Review what carries forward').click();
    await button(page, 'Continue to next step').click();
    await expect(page.getByText('Final step')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Workflow', exact: true })).toHaveValue('verification-checklist');

    const pending = page.waitForEvent('download');
    await button(page, 'Download draft JSON').click();
    const file = await pending;
    const input = page.locator('input[type=file]');
    await input.setInputFiles({ name: 'Imported.json', mimeType: 'application/json', buffer: await readFile(await file.path()) });
    await expect(page.getByText('Imported', { exact: true })).toBeVisible();
    await input.setInputFiles({ name: 'Bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":5}') });
    await expect(page.getByText('This file is invalid or uses an unsupported draft version.')).toBeVisible();

    await button(page, 'Meeting notes to follow-up').click();
    await button(page, 'Load example').click();
    await button(page, 'Review what carries forward').click();
    await button(page, 'Continue to next step').click();
    await expect(page.getByRole('combobox', { name: 'Workflow', exact: true })).toHaveValue('meeting-actions');
    await button(page, 'Review what carries forward').click();
    await button(page, 'Continue to next step').click();
    await expect(page.getByRole('combobox', { name: 'Workflow', exact: true })).toHaveValue('meeting-follow-up');
    await expect(prompt(page)).toContainText('workshop to Thursday');
});

test('supports Arabic and mixed-direction typing at 320px with a clipboard fallback', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 780 });
    await page.addInitScript(() => {
        Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('Clipboard unavailable')) });
    });
    await page.goto(route);
    await page.getByRole('combobox', { name: 'Interface language' }).selectOption('ar');
    await expect(page.locator('.prompt-builder')).toHaveAttribute('dir', 'rtl');
    const task = page.getByRole('textbox', { name: 'المهمة', exact: true });
    await expect(task).toHaveAttribute('dir', 'auto');
    await task.fill('راجع statusFilter ثم اختبر النتيجة.');
    const jump = page.getByRole('link', { name: 'انتقل إلى الموجّه' });
    await jump.focus();
    await jump.press('Enter');
    await expect(page.locator('#builder-output')).toBeFocused();
    await expect(prompt(page)).toContainText('راجع statusFilter ثم اختبر النتيجة.');
    await button(page, 'انسخ الموجّه').click();
    await expect(page.getByRole('textbox', { name: 'نص للنسخ اليدوي' })).toBeFocused();
    await expect(page.getByRole('textbox', { name: 'نص للنسخ اليدوي' })).toHaveValue(/statusFilter/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('model selection changes structure, explains the rules, and preserves edited text until regeneration', async ({ page }) => {
    await page.goto(route + '?workflow=bug-to-spec&model=claude');
    const target = page.getByRole('combobox', { name: 'Target model or assistant' });
    await expect(target).toHaveValue('claude');
    await button(page, 'Load example').click();
    await expect(prompt(page)).toContainText('<context>');
    await page.getByText('How to use this profile', { exact: true }).click();
    await expect(page.getByRole('link', { name: 'Official prompting guide' })).toHaveAttribute('href', /platform\.claude\.com/);
    await button(page, 'Edit prompt').click();
    await page.getByRole('textbox', { name: 'Editing prompt · Concise' }).fill('Keep my custom prompt.');
    await button(page, 'Done editing').click();
    await target.selectOption('gemini');
    await expect(prompt(page)).toHaveText('Keep my custom prompt.');
    const concise = page.getByRole('region', { name: 'Concise', exact: true });
    await expect(concise.getByText(/Regenerate to apply the current profile/)).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await button(page, 'Regenerate from answers').click();
    await expect(prompt(page)).toContainText('After clearing a status filter');
    const text = await prompt(page).textContent();
    expect(text.startsWith('## Response requirements')).toBe(true);
    expect(text.indexOf('## Provided context')).toBeLessThan(text.indexOf('## Task'));

    await page.getByText('Response preferences', { exact: true }).click();
    await page.getByRole('combobox', { name: 'Answer format' }).selectOption('json');
    const example = page.getByRole('textbox', { name: 'Example of a good response' });
    await example.fill('[1,2]');
    await expect(example).toHaveAttribute('aria-invalid', 'true');
    await expect(example).toHaveAttribute('aria-describedby', 'builder-example-error');
    await expect(prompt(page)).not.toContainText('[1,2]');
    await example.fill('{"title":"Filters"}');
    await expect(example).not.toHaveAttribute('aria-describedby');
    await expect(prompt(page)).toContainText('{"title":"Filters"}');
    await page.getByRole('textbox', { name: 'Draft name' }).fill('Gemini bug draft');
    await button(page, 'Save draft').click();
    await expect(page.getByText('Gemini bug draft', { exact: true })).toBeVisible();
    await page.goto(route);
    await page.getByRole('listitem').filter({ hasText: 'Gemini bug draft' }).getByRole('button', { name: 'Open' }).click();
    await expect(target).toHaveValue('gemini');
    await expect(prompt(page)).toContainText('{"title":"Filters"}');
});

test('claims an example run only for a profile with a completed benchmark pair', async ({ page }) => {
    await page.goto(route + '?workflow=draft-email&model=claude-code');
    await button(page, 'Load example').click();
    await expect(page.getByText('Example run recorded · claude-haiku-4-5-20251001')).toBeVisible();
    await page.getByRole('combobox', { name: 'Target model or assistant' }).selectOption('gemini');
    await expect(page.getByText('Example planned')).toBeVisible();
});

test('long compiled prompts stay available and saveable when manual editing exceeds the limit', async ({ page }) => {
    await page.goto(route + '?workflow=handover&model=claude');
    for (const name of ['Current state', 'Next action']) {
        await page.getByRole('textbox', { name, exact: true }).fill('<'.repeat(7_500));
    }
    const compiled = await prompt(page).textContent();
    expect(compiled.length).toBeGreaterThan(40_000);
    await button(page, 'Edit prompt').click();
    await expect(page.locator('#builder-output').getByRole('status').filter({ hasText: /exceeds the 40,000-character editor limit/ })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Editing prompt · Concise' })).toBeHidden();
    expect(await prompt(page).textContent()).toBe(compiled);
    await page.getByRole('textbox', { name: 'Draft name' }).fill('Long handover');
    await button(page, 'Save draft').click();
    await expect(page.getByText('Long handover', { exact: true })).toBeVisible();
});

test('a freshly saved draft is clean and a title-only edit is protected', async ({ page }) => {
    await page.goto(route + '?workflow=bug-to-spec');
    await button(page, 'Load example').click();
    await page.getByRole('textbox', { name: 'Draft name' }).fill('QA example');
    await button(page, 'Save draft').click();
    await expect(page.getByText('QA example', { exact: true })).toBeVisible();
    const workflow = page.getByRole('combobox', { name: 'Workflow', exact: true });
    await workflow.selectOption('handover');
    await expect(workflow).toHaveValue('handover');
    await page.getByRole('textbox', { name: 'Draft name' }).fill('New title without a body edit');
    let prompted = false;
    page.once('dialog', dialog => { prompted = true; return dialog.dismiss(); });
    await workflow.selectOption('bug-to-spec');
    expect(prompted).toBe(true);
    await expect(workflow).toHaveValue('handover');
    await expect(page.getByRole('textbox', { name: 'Draft name' })).toHaveValue('New title without a body edit');
});

test('matches benchmark evidence to the language of the loaded example and answer', async ({ page }) => {
    await page.goto(route + '?workflow=draft-email&model=codex');
    await button(page, 'Load example').click();
    await expect(page.getByText('Example run recorded · gpt-5.6-sol')).toBeVisible();

    await page.getByRole('combobox', { name: 'Interface language' }).selectOption('ar');
    await page.getByText('تفضيلات الرد', { exact: true }).click();
    await page.getByRole('combobox', { name: 'لغة الرد' }).selectOption('ar');
    await expect(page.getByText('المثال مخطّط له')).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await button(page, 'حمّل المثال').click();
    await expect(page.getByText('تم تسجيل تجربة المثال · gpt-5.6-sol')).toBeVisible();
});
