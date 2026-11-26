import { expect, test } from '@playwright/test';

test('the itinerary honors combined time, budget and indoor constraints', async ({ page }) => {
    await page.goto('/lab/#date-planner');
    const demo = page.locator('#date-planner');
    await demo.getByRole('button', { name:'Set constraints' }).click();
    await demo.getByLabel('Indoor stops only').check();
    await demo.getByLabel('Total budget').fill('0');
    await demo.getByRole('button', { name:'Build itinerary' }).click();
    await expect(demo.getByRole('status')).toContainText('No two stops fit');
    await demo.getByRole('button', { name:'Edit constraints' }).click();
    await demo.getByLabel('Total budget').fill('20');
    await demo.getByRole('button', { name:'Build itinerary' }).click();
    await expect(demo.locator('.itinerary li')).toHaveCount(2);
    const first = await demo.locator('.itinerary').innerText();
    await demo.getByRole('button', { name:'Try another itinerary' }).click();
    await expect(demo.locator('.itinerary')).not.toHaveText(first);
});

test('habit streaks persist per habit and can be undone', async ({ page }) => {
    await page.goto('/lab/#habit-tracker');
    const demo = page.locator('#habit-tracker');
    const days = demo.locator('.heatmap button');
    await expect(days).toHaveCount(28);
    await days.nth(26).click();
    await demo.getByRole('button', { name:'Check in today' }).click();
    await expect(demo.locator('.lab-result')).toHaveText('2-day streak');
    await page.reload();
    await expect(demo.locator('.lab-result')).toHaveText('2-day streak');
    await demo.getByRole('combobox', { name:'Habit', exact:true }).selectOption('Walk');
    await expect(demo.locator('.lab-result')).toHaveText('0-day streak');
    await demo.getByRole('combobox', { name:'Habit', exact:true }).selectOption('Read');
    await demo.getByRole('button', { name:'Undo today’s check-in' }).click();
    await expect(demo.locator('.lab-result')).toHaveText('1-day streak');
});

test('habit tabs preserve independent changes and update the visible streak', async ({ context, page }) => {
    const other = await context.newPage();
    const habit = (tab) => tab.locator('#habit-tracker');
    await Promise.all([page.goto('/lab/#habit-tracker'), other.goto('/lab/#habit-tracker')]);
    await habit(other).getByRole('combobox', { name: 'Habit', exact: true }).selectOption('Walk');
    await Promise.all([page, other].map(tab => habit(tab).getByRole('button', { name: 'Check in today' }).click()));
    await Promise.all([page.reload(), other.reload()]);
    await expect(habit(page).locator('.lab-result')).toHaveText('1-day streak');
    await habit(other).getByRole('combobox', { name: 'Habit', exact: true }).selectOption('Walk');
    await expect(habit(other).locator('.lab-result')).toHaveText('1-day streak');
    await habit(other).getByRole('combobox', { name: 'Habit', exact: true }).selectOption('Read');
    await habit(page).getByRole('button', { name: 'Undo today’s check-in' }).click();
    await expect(habit(other).locator('.lab-result')).toHaveText('0-day streak');
});

test.describe('habit dates in UTC', () => {
    test.use({ timezoneId: 'UTC' });

    test('an overnight tab checks in on the new day and retains legacy check-ins', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-11-26T23:58:00Z') });
        await page.addInitScript(() => {
            if (!sessionStorage.getItem('legacy-seeded')) {
                localStorage.setItem('yok-lab-habits-v1', JSON.stringify({ Read: ['2026-11-25', '2026-11-26'] }));
                sessionStorage.setItem('legacy-seeded', 'true');
            }
        });
        await page.goto('/lab/#habit-tracker');
        const demo = page.locator('#habit-tracker');
        const past = demo.getByRole('button', { name: 'Check in for 2026-11-25', exact: true });
        await expect(past).toHaveAttribute('aria-pressed', 'true');
        await expect(demo.getByRole('button', { name: 'Undo today’s check-in', exact: true })).toBeVisible();
        await page.clock.fastForward(4 * 60_000);
        await demo.getByRole('button', { name: 'Check in today', exact: true }).click();
        const today = demo.getByRole('button', { name: 'Check in for 2026-11-27', exact: true });
        await expect(today).toHaveAttribute('aria-pressed', 'true');
        await expect(demo.getByRole('button', { name: 'Check in for 2026-11-26', exact: true })).toHaveAttribute('aria-pressed', 'true');
        await past.click();
        await page.reload();
        await expect(today).toHaveAttribute('aria-pressed', 'true');
        await expect(past).toHaveAttribute('aria-pressed', 'false');
    });
});

test('the redesign preserves the agenda and the meal recalculates excluded ingredients at 375px', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({width:375, height:812});
    await page.goto('/lab/');
    const study = page.locator('#landing-redesign');
    await study.getByRole('button', { name:'Original' }).click();
    await study.getByRole('button', { name:'View agenda' }).click();
    await expect(study.locator('ol li')).toHaveCount(3);
    await study.getByRole('button', { name:'Revised' }).click();
    await expect(study.locator('ol')).toBeVisible();
    const meal = page.locator('#meal-configurator');
    await meal.getByLabel(/Grilled tofu/).check();
    await expect(meal.locator('.lab-result')).toContainText('€7.20');
    await meal.getByRole('button', { name:'Soy',exact:true }).click();
    await expect(meal.getByLabel(/Grilled tofu/)).toBeDisabled();
    await expect(meal.getByLabel(/Grilled tofu/)).not.toBeChecked();
    await meal.getByLabel('Bowls').selectOption('2');
    await expect(meal.locator('.lab-result')).toHaveText('€9.60 · 760 kcal · 28 g protein');
    await expect(meal.getByText('144 g carbs · 10 g fat')).toBeVisible();
    await meal.getByLabel('Maximum carbs (g)').fill('150');
    await meal.getByLabel('Maximum fat (g)').fill('12');
    await meal.getByLabel('Minimum protein (g)').fill('30');
    await expect(meal.getByText('Add 2 g protein')).toBeVisible();
    await expect(meal.getByLabel(/Roasted peppers/)).toBeDisabled();
    await expect(meal.getByLabel(/Sesame crunch/)).toBeDisabled();
    await meal.getByLabel('Base').selectOption('greens');
    await meal.getByLabel('Minimum protein (g)').fill('26');
    await meal.getByLabel(/Roasted peppers/).check();
    await expect(meal.getByText('Meal meets your macro targets.')).toBeVisible();
    await meal.getByLabel('Maximum carbs (g)').fill('0');
    await expect(meal.getByText('Reduce carbs by 82 g')).toBeVisible();
    await expect(meal.getByLabel(/Roasted peppers/)).toBeEnabled();
    await meal.getByLabel('Maximum carbs (g)').fill('');
    await expect(meal.getByText('Meal meets your macro targets.')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(375);
    expect(errors).toEqual([]);
});
