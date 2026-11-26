-- A deleted author's shared drafts and revisions stay with the team.
alter table public.prompt_drafts alter column created_by drop not null;
alter table public.prompt_drafts drop constraint prompt_drafts_created_by_fkey;
alter table public.prompt_drafts add constraint prompt_drafts_created_by_fkey
    foreign key (created_by) references auth.users on delete set null;
alter table public.prompt_drafts add constraint personal_prompt_requires_author
    check (folder_id is not null or created_by is not null);

create function public.prompt_account_has_shared_folders(account_id uuid) returns boolean
language sql security definer set search_path = '' as $$
    select exists (
        select 1 from public.prompt_folders f
        where f.owner_id = account_id and (
            exists (select 1 from public.prompt_folder_members m where m.folder_id = f.id)
            or exists (
                select 1 from public.prompt_drafts d
                where d.folder_id = f.id and d.created_by is distinct from account_id
            )
        )
    )
$$;

create schema if not exists prompt_internal;
revoke all on schema prompt_internal from public, anon, authenticated;

create function prompt_internal.protect_prompt_account_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    -- Folder row locks serialize this check with draft or membership inserts
    -- that reference an owned folder through a foreign key.
    perform 1 from public.prompt_folders where owner_id = old.id order by id for update;
    if public.prompt_account_has_shared_folders(old.id) then
        raise exception 'prompt_account_shared_folders' using errcode = 'P0001';
    end if;
    delete from public.prompt_drafts where created_by = old.id and folder_id is null;
    return old;
end
$$;

revoke execute on function prompt_internal.protect_prompt_account_delete() from public, anon, authenticated;
create trigger protect_prompt_account_delete before delete on auth.users
for each row execute function prompt_internal.protect_prompt_account_delete();

create function public.transfer_prompt_folder(folder uuid, member uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
    perform 1 from public.prompt_folders where id = folder and owner_id = actor for update;
    if not found then raise exception 'prompt_forbidden' using errcode = '42501'; end if;

    delete from public.prompt_folder_members where folder_id = folder and user_id = member and role = 'editor';
    if not found then raise exception 'prompt_forbidden' using errcode = '42501'; end if;

    update public.prompt_folders set owner_id = member where id = folder;
    insert into public.prompt_folder_members (folder_id, user_id, role) values (folder, actor, 'editor');
    delete from public.prompt_folder_invites where folder_id = folder;
end
$$;

revoke execute on function public.prompt_account_has_shared_folders(uuid), public.transfer_prompt_folder(uuid, uuid)
    from public, anon, authenticated;
grant execute on function public.prompt_account_has_shared_folders(uuid) to service_role;
grant execute on function public.transfer_prompt_folder(uuid, uuid) to authenticated;

alter table public.prompt_folder_invites add column id uuid not null default gen_random_uuid() unique;
alter table public.prompt_folder_invites add column created_at timestamptz not null default now();

create function public.list_prompt_folder_invites(folder uuid)
returns table (id uuid, role text, created_at timestamptz, expires_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
    if public.prompt_folder_role(folder) is distinct from 'owner' then
        raise exception 'prompt_forbidden' using errcode = '42501';
    end if;
    return query select i.id, i.role, i.created_at, i.expires_at from public.prompt_folder_invites i
        where i.folder_id = folder and i.expires_at > now() order by i.created_at desc, i.id;
end
$$;

create function public.revoke_prompt_folder_invite(folder uuid, invitation uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
    perform 1 from public.prompt_folders where id = folder and owner_id = auth.uid() for share;
    if not found then raise exception 'prompt_forbidden' using errcode = '42501'; end if;
    delete from public.prompt_folder_invites where folder_id = folder and id = invitation;
end
$$;

-- Serialize invitation issuance against folder ownership changes.
create or replace function public.invite_to_prompt_folder(folder uuid, member_role text) returns text
language plpgsql security definer set search_path = '' as $$
declare token text;
begin
    perform 1 from public.prompt_folders where id = folder and owner_id = auth.uid() for share;
    if not found then raise exception 'prompt_forbidden' using errcode = '42501'; end if;
    token := encode(extensions.gen_random_bytes(32), 'hex');
    delete from public.prompt_folder_invites where folder_id = folder and expires_at <= now();
    insert into public.prompt_folder_invites (folder_id, role, token_hash)
        values (folder, member_role, extensions.digest(token, 'sha256'));
    return token;
end
$$;

create or replace function public.accept_prompt_folder_invite(invite_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
    actor uuid := auth.uid();
    invitation public.prompt_folder_invites%rowtype;
    target_folder uuid;
    fingerprint bytea;
begin
    if actor is null or invite_token is null or invite_token !~ '^[a-f0-9]{64}$' then
        raise exception 'prompt_invite_invalid' using errcode = '22023';
    end if;
    fingerprint := extensions.digest(invite_token, 'sha256');
    select i.folder_id into target_folder from public.prompt_folder_invites i
        where i.token_hash = fingerprint and i.expires_at > now();
    -- Lock the folder before modifying the invitation, in the same order as a transfer.
    perform 1 from public.prompt_folders where id = target_folder for share;
    if not found then raise exception 'prompt_invite_invalid' using errcode = '22023'; end if;
    delete from public.prompt_folder_invites
        where token_hash = fingerprint and expires_at > now() returning * into invitation;
    if not found then raise exception 'prompt_invite_invalid' using errcode = '22023'; end if;
    if public.prompt_folder_role(target_folder) is distinct from 'owner' then
        insert into public.prompt_folder_members (folder_id, user_id, role)
            values (target_folder, actor, invitation.role) on conflict do nothing;
    end if;
    return target_folder;
end
$$;

create or replace function public.set_prompt_folder_member(folder uuid, member uuid, member_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
    perform 1 from public.prompt_folders where id = folder and owner_id = auth.uid() for share;
    if not found then raise exception 'prompt_forbidden' using errcode = '42501'; end if;
    if member_role is null then
        delete from public.prompt_folder_members where folder_id = folder and user_id = member;
    else
        update public.prompt_folder_members set role = member_role where folder_id = folder and user_id = member;
    end if;
end
$$;

revoke execute on function public.list_prompt_folder_invites(uuid), public.revoke_prompt_folder_invite(uuid, uuid)
    from public, anon, authenticated;
grant execute on function public.list_prompt_folder_invites(uuid), public.revoke_prompt_folder_invite(uuid, uuid)
    to authenticated;
