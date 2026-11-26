begin;

create function pg_temp.check_true(condition boolean, description text) returns void
language plpgsql as $$
begin
    if condition is distinct from true then raise exception 'Failed check: %', description; end if;
end
$$;

create function pg_temp.check_error(command text, description text) returns void
language plpgsql as $$
begin
    begin
        execute command;
    exception when others then
        if sqlerrm <> description then raise; end if;
        return;
    end;
    raise exception 'Expected failure: %', description;
end
$$;

insert into auth.users (id, email, email_confirmed_at) values
    ('a0000000-0000-4000-8000-000000000001', 'prompt-owner@example.test', now()),
    ('a0000000-0000-4000-8000-000000000002', 'prompt-editor@example.test', now()),
    ('a0000000-0000-4000-8000-000000000003', 'prompt-viewer@example.test', now()),
    ('a0000000-0000-4000-8000-000000000004', 'prompt-outsider@example.test', now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('test.folder', public.create_prompt_folder('Fictional team')::text, true);
select set_config('test.editor_token', public.invite_to_prompt_folder(current_setting('test.folder')::uuid, 'editor'), true);
select set_config('test.viewer_token', public.invite_to_prompt_folder(current_setting('test.folder')::uuid, 'viewer'), true);
select set_config('test.draft', public.save_prompt_draft(null, 0, current_setting('test.folder')::uuid, 'Shared draft', '{"version":1,"test":"shared"}')->>'id', true);
select set_config('test.private', public.save_prompt_draft(null, 0, null, 'Private', '{"version":1}')->>'id', true);
select set_config('test.share_token', public.publish_prompt_snapshot('Shared title', 'Public snapshot only'), true);
select set_config('test.share', (select id::text from public.prompt_shares where title = 'Shared title'), true);

select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000004', true);
select pg_temp.check_true(not exists(select 1 from public.prompt_drafts where id in
    (current_setting('test.draft')::uuid, current_setting('test.private')::uuid)), 'outsiders cannot read private or shared drafts');
select pg_temp.check_error(
    $$select public.save_prompt_draft(current_setting('test.draft')::uuid, 1, current_setting('test.folder')::uuid, 'Intrusion', '{"version":1}')$$,
    'prompt_forbidden');

select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true);
select public.accept_prompt_folder_invite(current_setting('test.editor_token'));
select pg_temp.check_error($$select public.accept_prompt_folder_invite(current_setting('test.editor_token'))$$, 'prompt_invite_invalid');
select pg_temp.check_true(
    (public.save_prompt_draft(current_setting('test.draft')::uuid, 1, current_setting('test.folder')::uuid, 'Shared draft', '{"version":1,"test":"revised"}')->>'revision') = '2',
    'editors can create a new revision');
select pg_temp.check_error(
    $$select public.save_prompt_draft(current_setting('test.draft')::uuid, 1, current_setting('test.folder')::uuid, 'Shared draft', '{"version":1}')$$,
    'prompt_conflict');
select pg_temp.check_true((select count(*) from public.prompt_versions where draft_id = current_setting('test.draft')::uuid) = 2, 'history has both versions');
select set_config('test.editor_draft', public.save_prompt_draft(null, 0, current_setting('test.folder')::uuid, 'Editor draft', '{"version":1}')->>'id', true);
select public.save_prompt_draft(current_setting('test.editor_draft')::uuid, 1, current_setting('test.folder')::uuid, 'Editor revision', '{"version":1}');

select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000003', true);
select public.accept_prompt_folder_invite(current_setting('test.viewer_token'));
select pg_temp.check_true(exists(select 1 from public.prompt_drafts where id = current_setting('test.draft')::uuid), 'viewers can read shared drafts');
select pg_temp.check_error($$select public.list_prompt_folder_members(current_setting('test.folder')::uuid)$$, 'prompt_forbidden');
select pg_temp.check_error(
    $$select public.save_prompt_draft(current_setting('test.draft')::uuid, 2, current_setting('test.folder')::uuid, 'Shared draft', '{"version":1}')$$,
    'prompt_forbidden');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.check_true(
    public.read_prompt_snapshot(current_setting('test.share_token')) = '{"title":"Shared title","prompt":"Public snapshot only"}'::jsonb,
    'share lookup gives only previewed content');
select pg_temp.check_true(not has_table_privilege('anon', 'public.prompt_shares', 'select'), 'anon cannot list shares');
select pg_temp.check_true(not has_function_privilege('anon', 'public.reserve_prompt_ai(uuid,text,bigint)', 'execute'), 'anon cannot reserve AI spend');
select pg_temp.check_true(not has_function_privilege('authenticated', 'public.finish_prompt_ai(uuid,bigint,text,integer)', 'execute'), 'users cannot reconcile spend');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select pg_temp.check_true((select count(*) from public.list_prompt_folder_members(current_setting('test.folder')::uuid)) = 2, 'owners can list members');
select set_config('test.revoked_invite', public.invite_to_prompt_folder(current_setting('test.folder')::uuid, 'editor'), true);
select set_config('test.surviving_invite', public.invite_to_prompt_folder(current_setting('test.folder')::uuid, 'viewer'), true);
select pg_temp.check_true(
    (select count(*) from public.list_prompt_folder_invites(current_setting('test.folder')::uuid)) = 2,
    'owners can identify both outstanding invitations');
select public.revoke_prompt_folder_invite(current_setting('test.folder')::uuid,
    (select id from public.list_prompt_folder_invites(current_setting('test.folder')::uuid) where role = 'editor'));
select pg_temp.check_true(
    (select count(*) from public.list_prompt_folder_invites(current_setting('test.folder')::uuid)) = 1,
    'revoking one invitation leaves the second active');
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000004', true);
select pg_temp.check_error($$select public.accept_prompt_folder_invite(current_setting('test.revoked_invite'))$$, 'prompt_invite_invalid');
select public.accept_prompt_folder_invite(current_setting('test.surviving_invite'));
select pg_temp.check_true(public.prompt_folder_role(current_setting('test.folder')::uuid) = 'viewer', 'the other invitation works');
select pg_temp.check_error($$select public.list_prompt_folder_invites(current_setting('test.folder')::uuid)$$, 'prompt_forbidden');
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select public.set_prompt_folder_member(current_setting('test.folder')::uuid, 'a0000000-0000-4000-8000-000000000003', null);
select public.revoke_prompt_snapshot(current_setting('test.share')::uuid);
select set_config('test.expiring_token', public.publish_prompt_snapshot('Expired test', 'Expired content'), true);
set local role none;
update public.prompt_shares set expires_at = now() - interval '1 second' where title = 'Expired test';
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select pg_temp.check_true(public.read_prompt_snapshot(current_setting('test.share_token')) is null, 'revoked shares disappear immediately');
select pg_temp.check_true(public.read_prompt_snapshot(current_setting('test.expiring_token')) is null, 'expired shares cannot be read');

set local role none;
update public.prompt_ai_settings set enabled = false;
set local role service_role;
select pg_temp.check_true(public.reserve_prompt_ai('a0000000-0000-4000-8000-000000000001', 'run', 3)->>'error' = 'ai_unavailable', 'operator pause takes effect');
set local role none;
update public.prompt_ai_settings set enabled = true, daily_account_limit = 1, monthly_budget_micros = 5;
set local role service_role;
select set_config('test.reservation', public.reserve_prompt_ai('a0000000-0000-4000-8000-000000000001', 'run', 4)->>'reservation', true);
select pg_temp.check_true(public.reserve_prompt_ai('a0000000-0000-4000-8000-000000000001', 'run', 1)->>'error' = 'ai_limit', 'per-account daily limit');
select pg_temp.check_true(public.reserve_prompt_ai('a0000000-0000-4000-8000-000000000002', 'run', 2)->>'error' = 'ai_limit', 'pending requests count against the site budget');
select public.finish_prompt_ai(current_setting('test.reservation')::uuid, 1, 'success', 50);
select public.finish_prompt_ai(current_setting('test.reservation')::uuid, 2, 'success', 60);
select pg_temp.check_true(public.reserve_prompt_ai('a0000000-0000-4000-8000-000000000002', 'run', 2) ? 'reservation', 'reported usage releases unused budget');
select pg_temp.check_true(public.prompt_account_has_shared_folders('a0000000-0000-4000-8000-000000000001'), 'account preflight detects shared work');

set local role none;
select pg_temp.check_true(
    (select actual_micros from public.prompt_ai_usage where id = current_setting('test.reservation')::uuid) = 1,
    'repeated settlement cannot change the recorded bill');
select pg_temp.check_error(
    $$delete from auth.users where id = 'a0000000-0000-4000-8000-000000000001'$$,
    'prompt_account_shared_folders');
select pg_temp.check_true(
    (select count(*) from public.prompt_versions where draft_id = current_setting('test.editor_draft')::uuid) = 2,
    'blocked deletion preserves the editor history');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select pg_temp.check_error(
    $$select public.transfer_prompt_folder(current_setting('test.folder')::uuid, 'a0000000-0000-4000-8000-000000000004')$$,
    'prompt_forbidden');
select public.transfer_prompt_folder(current_setting('test.folder')::uuid, 'a0000000-0000-4000-8000-000000000002');
select pg_temp.check_true(public.prompt_folder_role(current_setting('test.folder')::uuid) = 'editor', 'former owner becomes editor');
set local role none;
delete from auth.users where id = 'a0000000-0000-4000-8000-000000000001';
select pg_temp.check_true(not exists(select 1 from public.prompt_drafts where id = current_setting('test.private')::uuid), 'deleted accounts lose personal drafts');
select pg_temp.check_true(not exists(select 1 from public.prompt_shares where title = 'Expired test'), 'deleted accounts lose snapshots');
select pg_temp.check_true(
    exists (select 1 from public.prompt_drafts where id = current_setting('test.draft')::uuid and created_by is null),
    'shared draft from deleted user remains with the folder');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true);
select pg_temp.check_true(public.prompt_folder_role(current_setting('test.folder')::uuid) = 'owner', 'recipient becomes owner');
select pg_temp.check_true(
    (select count(*) from public.prompt_versions where draft_id = current_setting('test.editor_draft')::uuid) = 2,
    'editor reads both revisions after the former owner leaves');

rollback;
