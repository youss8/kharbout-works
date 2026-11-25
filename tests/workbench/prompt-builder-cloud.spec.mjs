import { expect, test } from '@playwright/test';

test.skip(!process.env.PLAYWRIGHT_PROMPT_CLOUD, 'Run with the documented local cloud test environment.');

const route = '/ai-kit/prompt-builder/';
const user = { id: 'a0000000-0000-4000-8000-000000000001', email: 'test@example.test', aud: 'authenticated', role: 'authenticated' };
const token = 'a'.repeat(64);

test('sign in, resolve a version conflict, preview a share, and review AI requests', async ({ page, context, browser }) => {
    const ai = [];
    let draft;
    let share;
    let writes = 0;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const mockCloud = async request => {
        const url = new URL(request.request().url());
        const json = (value, status = 200) => request.fulfill({ status, json: value, headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version, prefer, range, accept-profile',
            'access-control-allow-methods': 'GET, POST, OPTIONS',
        } });
        if (request.request().method() === 'OPTIONS') return json({});
        if (url.pathname.endsWith('/auth/v1/otp')) return json({});
        if (url.pathname.endsWith('/auth/v1/verify')) {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const jwt = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
                Buffer.from(JSON.stringify({ sub: user.id, exp, role: user.role })).toString('base64url'), 'signature'].join('.');
            return json({ access_token: jwt, refresh_token: 'refresh', expires_in: 3600, expires_at: exp, token_type: 'bearer', user });
        }
        if (url.pathname.endsWith('/save_prompt_draft')) {
            const body = request.request().postDataJSON();
            if (++writes === 2) {
                draft.revision = 2;
                return json({ code: 'P0001', message: 'prompt_conflict' }, 400);
            }
            draft = { id: 'd1', name: body.draft_name, revision: body.base_revision + 1, created_by: user.id, folder_id: null, payload: body.draft_payload };
            return json(draft);
        }
        if (url.pathname.endsWith('/publish_prompt_snapshot')) {
            const body = request.request().postDataJSON();
            share = { title: body.snapshot_title, prompt: body.snapshot_prompt };
            return json(token);
        }
        if (url.pathname.endsWith('/read_prompt_snapshot')) return json(share ?? null);
        if (url.pathname.endsWith('/revoke_prompt_snapshot')) { share = undefined; return json(null); }
        if (url.pathname.endsWith('/prompt_drafts')) {
            return json(url.searchParams.has('id') ? draft : draft ? [draft] : []);
        }
        if (url.pathname.endsWith('/prompt_shares')) {
            return json(share ? [{ id: 's1', title: share.title, expires_at: '2099-11-25T00:00:00Z' }] : []);
        }
        if (url.pathname.endsWith('/prompt_versions')) {
            return json([{ revision: 1, created_at: '2026-11-25T00:00:00Z', name: draft.name, payload: draft.payload }]);
        }
        if (url.pathname.endsWith('/prompt-ai')) {
            const body = request.request().postDataJSON();
            ai.push(body);
            if (body.action === 'suggest') return json({ action: 'suggest', fields: [{ key: 'OBSERVED', value: 'Catalogue remains empty.' }] });
            if (body.action === 'evaluate') return json({ action: 'evaluate', results: [{ index: 0, a: true, b: false, explanation: 'Only A describes both states.' }] });
            const runs = ai.filter(item => item.action === 'run').length;
            if (runs === 3) return json({ error: 'ai_timeout' }, 504);
            if (runs > 3) return json({ error: 'ai_limit' }, 429);
            return json({ action: 'run', result: `Assistant answer ${ai.length - 1}` });
        }
        return json([]);
    };
    await context.route('https://prompt-test.supabase.co/**', mockCloud);

    await page.goto(route + '?workflow=bug-to-spec');
    const cloud = page.getByRole('region', { name: 'Cloud library' });
    await cloud.getByRole('textbox', { name: 'Email address' }).fill(user.email);
    await cloud.getByRole('button', { name: 'Send sign-in code' }).click();
    await cloud.getByRole('textbox', { name: 'Sign-in code' }).fill('123456');
    await cloud.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(cloud.getByText(user.email)).toBeVisible();
    await page.getByRole('button', { name: 'Load example' }).click();
    await cloud.getByRole('button', { name: 'Save to cloud', exact: true }).click();
    await expect(cloud.getByRole('status')).toHaveText('Saved.');
    await page.getByRole('textbox', { name: 'Expected behavior', exact: true }).fill('The list should reset.');
    await cloud.getByRole('button', { name: 'Save to cloud', exact: true }).click();
    await expect(cloud.getByRole('status')).toContainText('This draft changed on another device');
    page.once('dialog', dialog => dialog.accept());
    await cloud.getByRole('button', { name: 'Load latest revision' }).click();
    await expect(page.getByRole('textbox', { name: 'Expected behavior', exact: true })).toHaveValue(/restore the full list/);
    await cloud.getByRole('button', { name: 'Version history' }).click();
    await cloud.getByRole('button', { name: 'Load this version' }).click();
    await expect(page.getByText('Version loaded. Save to cloud to make it current.')).toBeVisible();
    await cloud.getByRole('button', { name: 'Save to cloud', exact: true }).click();
    await expect(cloud.getByRole('status')).toHaveText('Saved.');

    await cloud.getByRole('button', { name: 'Share snapshot' }).click();
    await expect(cloud.getByText('Anyone with the link can read this title and prompt for seven days.')).toBeVisible();
    expect(share).toBeUndefined();
    await cloud.getByRole('button', { name: 'Create read-only link' }).click();
    await expect(cloud.getByRole('textbox', { name: 'Link', exact: true })).toHaveValue(new RegExp('#share=' + token + '$'));
    const shareUrl = await cloud.getByRole('textbox', { name: 'Link', exact: true }).inputValue();
    const recipientContext = await browser.newContext();
    await recipientContext.route('https://prompt-test.supabase.co/**', mockCloud);
    const recipient = await recipientContext.newPage();
    await recipient.goto(shareUrl);
    await expect(recipient.getByRole('region', { name: 'Shared prompt' })).toContainText('Clearing the filter should restore');
    await recipient.getByRole('button', { name: 'Copy into builder' }).click();
    await expect(recipient.locator('[data-variant=concise]')).toContainText('Clearing the filter should restore');
    await cloud.getByRole('button', { name: 'Revoke link' }).click();
    await expect(cloud.getByRole('status')).toHaveText('Removed.');
    await recipient.goto(shareUrl);
    await expect(recipient.getByText('This link is invalid, expired, or revoked.')).toBeVisible();
    await recipientContext.close();

    const workbench = page.getByRole('region', { name: 'AI workbench' });
    await workbench.getByRole('textbox', { name: 'Notes to turn into answers' }).fill('The catalogue stays empty.');
    await workbench.getByRole('button', { name: 'Suggest field values' }).click();
    await expect(workbench.getByText('Review what will be sent')).toBeVisible();
    expect(ai).toHaveLength(0);
    await workbench.getByRole('button', { name: 'Send to OpenAI' }).click();
    await expect(workbench.getByText('Review suggestions')).toBeVisible();
    await expect(workbench.getByRole('button', { name: 'Apply selected answers' })).toBeDisabled();
    await workbench.getByRole('checkbox', { name: 'Observed behavior' }).check();
    await workbench.getByRole('button', { name: 'Apply selected answers' }).click();
    await expect(page.getByRole('textbox', { name: 'Observed behavior', exact: true })).toHaveValue('Catalogue remains empty.');

    for (const answer of ['Answer A', 'Answer B']) {
        await workbench.getByRole('button', { name: 'Run current prompt' }).click();
        await workbench.getByRole('button', { name: 'Send to OpenAI' }).click();
        await expect(workbench.getByRole('heading', { name: answer })).toBeVisible();
    }
    await workbench.getByRole('button', { name: 'Compare against checklist' }).click();
    await workbench.getByRole('button', { name: 'Send to OpenAI' }).click();
    await expect(workbench.getByText('Only A describes both states.')).toBeVisible();
    await workbench.getByRole('button', { name: 'Run current prompt' }).click();
    await workbench.getByRole('button', { name: 'Send to OpenAI' }).click();
    await expect(workbench.getByText(/The AI request timed out/)).toBeVisible();
    await workbench.getByRole('button', { name: 'Run current prompt' }).click();
    await workbench.getByRole('button', { name: 'Send to OpenAI' }).click();
    await expect(workbench.getByText(/The AI usage limit has been reached/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy prompt' })).toBeEnabled();
    expect(errors).toEqual([]);
});
