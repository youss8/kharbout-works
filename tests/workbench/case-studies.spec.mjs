import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const cases = ['01-it-ops-helpdesk', '02-hr-lifecycle-crm', '03-portfolio-kpi-engine'];
test('fixtures and ER sources match the handoff verbatim', () => {
    const read = file => readFileSync(file, 'utf8').replaceAll('\r\n', '\n').trimEnd();
    const spec = read('HANDOFF_MASTER_SPEC.md');
    const fixtures = [...spec.matchAll(/Verbatim Synthetic Dataset \(`([^\x60]+)`\):\*\*\s*```json\n([\s\S]*?)\n```/g)];
    expect(fixtures).toHaveLength(6);
    for (const [, path, content] of fixtures) {
        expect(read(path)).toBe(content);
        expect(JSON.parse(content)).toBeTruthy();
    }
    const diagrams = [...spec.matchAll(/```mermaid\n([\s\S]*?)\n```/g)];
    expect(diagrams).toHaveLength(cases.length);
    diagrams.forEach(([, content], i) => expect(read('src/data/diagrams/sys0' + (i + 1) + '.mmd')).toBe(content));
});

test('matrix links reach all six sandboxes', async ({ page }) => {
    await page.goto('/systems/');
    const links = await page.locator('a.table-link').evaluateAll(items => items.map(item => item.href));
    expect(new Set(links).size).toBe(6);
    for (const href of links) {
        const response = await page.goto(href);
        if (response) expect(response.status()).toBe(200);
        await expect(page.locator(new URL(href).hash)).toBeVisible();
    }
});

for (const slug of cases) {
    test(slug + ' displays the case study and re-renders its ER diagram in dark mode', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/systems/' + slug + '/#diagram');
        const figure = page.locator('entity-diagram');
        await figure.scrollIntoViewIfNeeded();
        await expect(figure.locator('[data-rendered-theme="light"] svg')).toBeVisible({ timeout: 20000 });
        await figure.getByRole('combobox').selectOption('175');
        await page.getByRole('button', { name: 'Dark mode' }).click();
        await expect(figure.locator('[data-rendered-theme="dark"] svg')).toBeVisible();
        await expect(page.getByRole('navigation', { name: 'Case study contents' }).getByRole('link')).toHaveCount(7);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
        expect(errors).toEqual([]);
    });
}
