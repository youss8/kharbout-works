import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { newDraft } from '../../src/lib/prompt-builder/model.ts';

test.skip(!process.env.PLAYWRIGHT_PROMPT_CLOUD, 'Run with the documented local cloud test environment.');

const route = '/ai-kit/prompt-builder/';
const user = { id: 'a0000000-0000-4000-8000-000000000001', email: 'test@example.test', aud: 'authenticated', role: 'authenticated' };
const token = 'a'.repeat(64);

const response = (request, json, status = 200) => request.fulfill({ status, json, headers: {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version, prefer, range, accept-profile',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
} });

function session(account) {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const jwt = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
        Buffer.from(JSON.stringify({ sub: account.id, exp, role: account.role })).toString('base64url'), 'signature'].join('.');
    return { access_token: jwt, refresh_token: 'refresh', expires_in: 3600, expires_at: exp, token_type: 'bearer', user: account };
}

async function signIn(cloud, account = user) {
    await cloud.getByRole('textbox', { name: 'Email address' }).fill(account.email);
    await cloud.getByRole('button', { name: 'Send sign-in code' }).click();
    await cloud.getByRole('textbox', { name: 'Sign-in code' }).fill('123456');
    await cloud.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(cloud.getByText(account.email)).toBeVisible();
}

test('share previews follow the active draft, expired snapshots can be removed and offline sign-out clears this device', async ({ page, context }) => {
    const payload = newDraft();
    payload.values.TASK = 'Fictional cloud agenda';
    const draft = { id: 'd1', name: 'Fixture A', revision: 1, folder_id: null, created_by: user.id, payload };
    let expired = { id: 's1', title: 'Expired fixture', prompt: 'Archived plain text', expires_at: '2000-01-01T00:00:00Z' };
    let aiCalls = 0;
    await context.route('https://prompt-test.supabase.co/**', request => {
        const url = new URL(request.request().url());
        const json = value => response(request, value);
        if (request.request().method() === 'OPTIONS') return json({});
        if (url.pathname.endsWith('/otp')) return json({});
        if (url.pathname.endsWith('/verify')) return json(session(user));
        if (url.pathname.endsWith('/logout')) return request.abort('internetdisconnected');
        if (url.pathname.endsWith('/prompt_drafts')) return json(url.searchParams.has('id') ? draft : [draft]);
        if (url.pathname.endsWith('/prompt_versions')) return json([{ revision: 1, name: draft.name, payload }]);
        if (url.pathname.endsWith('/prompt_shares')) return json(expired && !url.searchParams.has('expires_at') ? [expired] : []);
        if (url.pathname.endsWith('/revoke_prompt_snapshot')) { expired = null; return json(null); }
        if (url.pathname.endsWith('/prompt-ai')) aiCalls++;
        return json([]);
    });
    await page.goto(route);
    const cloud = page.getByRole('region', { name: 'Cloud library' });
    await signIn(cloud);
    const open = cloud.getByRole('listitem').filter({ hasText: 'Fixture A' }).getByRole('button', { name: 'Open' });
    await open.click();
    await cloud.getByRole('button', { name: 'Share snapshot' }).click();
    await expect(cloud.locator('pre')).toContainText('Fictional cloud agenda');
    await page.getByRole('combobox', { name: 'Workflow', exact: true }).selectOption('handover');
    await expect(cloud.getByRole('button', { name: 'Create read-only link' })).toBeHidden();
    const field = page.getByRole('textbox', { name: 'Current state', exact: true });
    await field.fill('界'.repeat(8000));
    await page.getByRole('button', { name: 'Run current prompt', exact: true }).click();
    await expect(page.getByText(/exceeds 24,000 UTF-8 bytes/)).toBeVisible();
    const workbench = page.getByRole('region', { name: 'AI workbench' });
    await workbench.getByRole('textbox').first().fill('"'.repeat(7800));
    await workbench.getByRole('button', { name: /suggest/i }).click();
    await expect(workbench.getByText(/exceeds 26,000 UTF-8 bytes/)).toBeVisible();
    expect(aiCalls).toBe(0);
    const pending = page.waitForEvent('download');
    await cloud.getByRole('button', { name: 'Download cloud data' }).click();
    const accountBackup = JSON.parse(await readFile(await (await pending).path()));
    expect(accountBackup.shares[0].prompt).toBe('Archived plain text');
    expect(accountBackup.histories[0].versions[0].payload.values.TASK).toBe(payload.values.TASK);
    const expiredItem = cloud.getByRole('listitem').filter({ hasText: 'Expired fixture' });
    await expect(expiredItem).toContainText(/Expired ·/);
    await expiredItem.getByRole('button').click();
    await expect(expiredItem).toBeHidden();
    page.once('dialog', dialog => dialog.accept());
    await open.click();
    await expect(page.getByRole('textbox', { name: 'Task', exact: true })).toHaveValue(payload.values.TASK);
    await cloud.getByRole('button', { name: 'Sign out' }).click();
    await expect(cloud.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Task', exact: true })).toHaveValue('');
    await page.reload();
    await expect(cloud.getByRole('textbox', { name: 'Email address' })).toBeVisible();
});

test('an unreadable legacy revision can be downloaded and restored from history', async ({ page, context }) => {
    const legacy = { version: 1, historical: 'Keep this original fixture' };
    const valid = newDraft();
    valid.values.TASK = 'Known working version';
    const row = { id: 'old', name: 'Legacy draft', revision: 2, folder_id: null, created_by: user.id };
    await context.route('https://prompt-test.supabase.co/**', request => {
        const url = new URL(request.request().url());
        const json = value => response(request, value);
        if (request.request().method() === 'OPTIONS') return json({});
        if (url.pathname.endsWith('/otp')) return json({});
        if (url.pathname.endsWith('/verify')) return json(session(user));
        if (url.pathname.endsWith('/prompt_drafts')) return json(url.searchParams.has('id') ? { ...row, payload: legacy } : [row]);
        if (url.pathname.endsWith('/prompt_versions')) {
            const version = { revision: 1, name: row.name, created_at: '2026-11-24T10:00:00Z' };
            return json(url.searchParams.has('revision') ? { ...version, payload: valid } : [version]);
        }
        return json([]);
    });
    await page.goto(route);
    const cloud = page.getByRole('region', { name: 'Cloud library' });
    await signIn(cloud);
    await cloud.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(cloud.getByRole('button', { name: 'Save to cloud', exact: true })).toBeDisabled();
    const pending = page.waitForEvent('download');
    await cloud.getByRole('button', { name: 'Download original JSON' }).click();
    expect(JSON.parse(await readFile(await (await pending).path()))).toEqual(legacy);
    await cloud.getByRole('button', { name: 'Load this version' }).click();
    await expect(page.getByRole('textbox', { name: 'Task', exact: true })).toHaveValue(valid.values.TASK);
    await expect(cloud.getByRole('button', { name: 'Save to cloud', exact: true })).toBeEnabled();
});

test('sign in, resolve a version conflict, preview a share, and review AI requests', async ({ page, context, browser }) => {
    const ai = [];
    let draft;
    let share;
    let writes = 0;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const mockCloud = async request => {
        const url = new URL(request.request().url());
        const json = (value, status = 200) => response(request, value, status);
        if (request.request().method() === 'OPTIONS') return json({});
        if (url.pathname.endsWith('/auth/v1/otp')) return json({});
        if (url.pathname.endsWith('/auth/v1/verify')) return json(session(user));
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
            const version = { revision: 1, created_at: '2026-11-25T00:00:00Z', name: draft.name };
            return url.searchParams.has('revision') ? json({ ...version, payload: draft.payload }) : json([version]);
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
    await signIn(cloud);
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

test('cloud document and results clear on sign-out even while an AI request is pending', async ({ page, context }) => {
    const next = { ...user, id: 'a0000000-0000-4000-8000-000000000002', email: 'second@example.test' };
    const summary = { id: 'private1', name: 'Cloud-only notes', revision: 1, created_by: user.id, folder_id: null };
    const payload = newDraft('blank');
    payload.values.TASK = 'Private agenda fixture';
    payload.runs.push({ prompt: 'Private agenda fixture', result: 'Private saved answer fixture' });
    let account = user;
    let respond;
    const held = new Promise(resolve => { respond = resolve; });
    await context.route('https://prompt-test.supabase.co/**', async request => {
        const url = new URL(request.request().url());
        const json = data => response(request, data);
        if (request.request().method() === 'OPTIONS') return json({});
        if (url.pathname.endsWith('/auth/v1/verify')) {
            account = request.request().postDataJSON().email === next.email ? next : user;
            return json(session(account));
        }
        if (url.pathname.endsWith('/auth/v1/otp') || url.pathname.endsWith('/auth/v1/logout')) return json({});
        if (url.pathname.endsWith('/prompt_drafts')) {
            return json(url.searchParams.has('id') ? { ...summary, payload } : account.id === user.id ? [summary] : []);
        }
        if (url.pathname.endsWith('/prompt-ai')) {
            await held;
            return json({ action: 'run', result: 'Delayed answer fixture' });
        }
        return json([]);
    });
    try {
        await page.goto(route);
        const cloud = page.getByRole('region', { name: 'Cloud library' });
        await signIn(cloud);
        await cloud.getByRole('button', { name: 'Open', exact: true }).click();
        const task = page.getByRole('textbox', { name: 'Task', exact: true });
        await expect(task).toHaveValue('Private agenda fixture');
        await expect(page.getByText('Private saved answer fixture')).toBeVisible();
        const workbench = page.getByRole('region', { name: 'AI workbench' });
        await workbench.getByRole('button', { name: 'Run current prompt' }).click();
        const sent = page.waitForRequest('**/functions/v1/prompt-ai');
        await workbench.getByRole('button', { name: 'Send to OpenAI' }).click();
        await sent;
        await cloud.getByRole('button', { name: 'Sign out' }).click();
        await expect(cloud.getByRole('textbox', { name: 'Email address' })).toBeVisible();
        respond();
        await expect(task).toHaveValue('');
        await expect(page.getByText('Private saved answer fixture')).toHaveCount(0);
        await signIn(cloud, next);
        await expect(task).toHaveValue('');
        await expect(page.getByText('Delayed answer fixture')).toHaveCount(0);
        await expect(page.getByRole('textbox', { name: 'Draft name' })).toHaveValue('');
    } finally { respond(); }
});

test('a library page uses metadata and a viewer can save a personal copy', async ({ page, context }) => {
    const folder = 'folder1';
    const drafts = Array.from({ length: 23 }, (_, i) => ({
        id: 'd' + i, name: 'Library fixture ' + i, revision: 1, created_by: 'owner', folder_id: folder,
    }));
    const payload = newDraft();
    payload.values.TASK = 'Read-only agenda fixture';
    const draftsQueries = [];
    const versionQueries = [];
    const saves = [];
    await context.route('https://prompt-test.supabase.co/**', request => {
        const url = new URL(request.request().url());
        const json = data => response(request, data);
        if (request.request().method() === 'OPTIONS') return json({});
        if (url.pathname.endsWith('/auth/v1/verify')) return json(session(user));
        if (url.pathname.endsWith('/auth/v1/otp')) return json({});
        if (url.pathname.endsWith('/prompt_folders')) return json([{ id: folder, name: 'Read-only folder', owner_id: 'owner' }]);
        if (url.pathname.endsWith('/prompt_folder_members')) return json([{ folder_id: folder, role: 'viewer' }]);
        if (url.pathname.endsWith('/prompt_drafts')) {
            draftsQueries.push(url.searchParams);
            if (url.searchParams.has('id')) return json({ ...drafts.find(d => 'eq.' + d.id === url.searchParams.get('id')), payload });
            const offset = Number(url.searchParams.get('offset'));
            return json(drafts.slice(offset, offset + Number(url.searchParams.get('limit'))));
        }
        if (url.pathname.endsWith('/prompt_versions')) {
            versionQueries.push(url.searchParams);
            const version = { revision: 1, created_at: '2026-11-25T00:00:00Z', name: drafts[0].name };
            return url.searchParams.has('revision') ? json({ ...version, payload }) : json([version]);
        }
        if (url.pathname.endsWith('/save_prompt_draft')) {
            const body = request.request().postDataJSON();
            saves.push(body);
            return json({ ...drafts[0], id: 'personal1', created_by: user.id, folder_id: body.in_folder, payload: body.draft_payload });
        }
        return json([]);
    });
    await page.goto(route);
    const cloud = page.getByRole('region', { name: 'Cloud library' });
    await signIn(cloud);
    await expect(cloud.getByRole('button', { name: 'Open', exact: true })).toHaveCount(20);
    expect(draftsQueries).toHaveLength(1);
    expect(draftsQueries[0].get('select')).not.toContain('payload');
    await cloud.getByRole('button', { name: 'Load more drafts' }).click();
    await expect(cloud.getByRole('button', { name: 'Open', exact: true })).toHaveCount(23);
    await cloud.getByRole('listitem').filter({ hasText: /^Library fixture 22/ }).getByRole('button', { name: 'Open', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Task', exact: true })).toHaveValue('Read-only agenda fixture');
    expect(draftsQueries.at(-1).get('select')).toContain('payload');
    expect(draftsQueries.at(-1).get('id')).toBe('eq.d22');
    await cloud.getByRole('button', { name: 'Version history' }).click();
    await expect(cloud.getByRole('button', { name: 'Load this version' })).toBeVisible();
    expect(versionQueries[0].get('select')).not.toContain('payload');
    await cloud.getByRole('button', { name: 'Load this version' }).click();
    await expect(page.getByText('Version loaded. Save to cloud to make it current.')).toBeVisible();
    expect(versionQueries.at(-1).get('select')).toContain('payload');
    await expect(cloud.getByRole('combobox', { name: 'Copy destination' })).toHaveValue('');
    await cloud.getByRole('button', { name: 'Save as new cloud copy' }).click();
    await expect(cloud.getByRole('status')).toHaveText('Saved.');
    expect(saves).toHaveLength(1);
    expect(saves[0].in_folder).toBe(null);
    expect(saves[0].draft_id).toBe(null);
    expect(draftsQueries).toHaveLength(3);
});

test('folder owners can revoke one invitation and transfer ownership before deleting the account', async ({ page, context }) => {
    const editor = { user_id: 'member1', display_email: 'editor@example.test', role: 'editor' };
    const folder = { id: 'team1', name: 'Shared work', owner_id: user.id };
    let invitations = [
        { id: 'i1', role: 'viewer', created_at: '2026-11-25T10:00:00Z', expires_at: '2026-12-02T10:00:00Z' },
        { id: 'i2', role: 'editor', created_at: '2026-11-25T12:00:00Z', expires_at: '2026-12-02T12:00:00Z' },
    ];
    const transfers = [];
    const revoked = [];
    await context.route('https://prompt-test.supabase.co/**', request => {
        const url = new URL(request.request().url());
        const json = (data, status) => response(request, data, status);
        if (request.request().method() === 'OPTIONS') return json({});
        if (url.pathname.endsWith('/auth/v1/verify')) return json(session(user));
        if (url.pathname.endsWith('/auth/v1/otp') || url.pathname.endsWith('/auth/v1/logout')) return json({});
        if (url.pathname.endsWith('/prompt_folders')) return json([folder]);
        if (url.pathname.endsWith('/list_prompt_folder_members')) return json([editor]);
        if (url.pathname.endsWith('/list_prompt_folder_invites')) return json(invitations);
        if (url.pathname.endsWith('/revoke_prompt_folder_invite')) {
            const body = request.request().postDataJSON();
            revoked.push(body);
            invitations = invitations.filter(item => item.id !== body.invitation);
            return json(null);
        }
        if (url.pathname.endsWith('/transfer_prompt_folder')) {
            const body = request.request().postDataJSON();
            transfers.push(body);
            folder.owner_id = body.member;
            return json(null);
        }
        if (url.pathname.endsWith('/prompt-account')) {
            return transfers.length ? json({ deleted: true }) : json({ error: 'prompt_account_shared_folders' }, 409);
        }
        return json([]);
    });
    await page.goto(route);
    const cloud = page.getByRole('region', { name: 'Cloud library' });
    await signIn(cloud);
    page.once('dialog', dialog => dialog.accept());
    await cloud.getByRole('button', { name: 'Delete account', exact: true }).click();
    await expect(cloud.getByRole('status')).toContainText('Transfer ownership of your shared folders');
    await cloud.getByRole('button', { name: 'Manage access' }).click();
    const revoke = cloud.getByRole('button', { name: 'Revoke invitation' });
    await expect(revoke).toHaveCount(2);
    await revoke.first().click();
    await expect(revoke).toHaveCount(1);
    expect(revoked).toEqual([{ folder: folder.id, invitation: 'i1' }]);
    page.once('dialog', dialog => dialog.accept());
    await cloud.getByRole('button', { name: 'Transfer ownership' }).click();
    await expect(cloud.getByRole('button', { name: 'Manage access' })).toBeHidden();
    expect(transfers).toEqual([{ folder: folder.id, member: editor.user_id }]);
    page.once('dialog', dialog => dialog.accept());
    await cloud.getByRole('button', { name: 'Delete account', exact: true }).click();
    await expect(cloud.getByRole('textbox', { name: 'Email address' })).toBeVisible();
});
