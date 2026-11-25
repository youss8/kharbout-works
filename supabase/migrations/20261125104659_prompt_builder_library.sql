create extension if not exists pgcrypto with schema extensions;

create table public.prompt_folders (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users on delete cascade,
    name text not null check (char_length(btrim(name)) between 1 and 120)
);

create table public.prompt_folder_members (
    folder_id uuid not null references public.prompt_folders on delete cascade,
    user_id uuid not null references auth.users on delete cascade,
    role text not null check (role in ('editor', 'viewer')),
    primary key (folder_id, user_id)
);
create index prompt_folder_members_by_user on public.prompt_folder_members (user_id, folder_id);

create table public.prompt_folder_invites (
    token_hash bytea primary key,
    folder_id uuid not null references public.prompt_folders on delete cascade,
    role text not null check (role in ('editor', 'viewer')),
    expires_at timestamptz not null default (now() + interval '7 days')
);

create table public.prompt_drafts (
    id uuid primary key default gen_random_uuid(),
    created_by uuid not null references auth.users on delete cascade,
    folder_id uuid references public.prompt_folders on delete cascade,
    name text not null check (char_length(btrim(name)) between 1 and 120),
    payload jsonb not null,
    revision integer not null default 1 check (revision > 0),
    updated_at timestamptz not null default now()
);
create index prompt_drafts_by_creator on public.prompt_drafts (created_by, updated_at desc);
create index prompt_drafts_by_folder on public.prompt_drafts (folder_id, updated_at desc);

create table public.prompt_versions (
    draft_id uuid not null references public.prompt_drafts on delete cascade,
    revision integer not null,
    name text not null,
    payload jsonb not null,
    created_at timestamptz not null default now(),
    primary key (draft_id, revision)
);

create table public.prompt_shares (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users on delete cascade,
    token_hash bytea not null unique,
    title text not null check (char_length(btrim(title)) between 1 and 120),
    prompt text not null check (char_length(prompt) between 1 and 40000),
    expires_at timestamptz not null default (now() + interval '7 days')
);
create index prompt_shares_by_owner on public.prompt_shares (owner_id, expires_at);

alter table public.prompt_folders enable row level security;
alter table public.prompt_folder_members enable row level security;
alter table public.prompt_folder_invites enable row level security;
alter table public.prompt_drafts enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.prompt_shares enable row level security;

revoke all on public.prompt_folders, public.prompt_folder_members, public.prompt_folder_invites,
    public.prompt_drafts, public.prompt_versions, public.prompt_shares from public, anon, authenticated;
grant select on public.prompt_folders, public.prompt_drafts, public.prompt_versions to authenticated;
grant select (folder_id, role) on public.prompt_folder_members to authenticated;
grant select (id, title, prompt, expires_at) on public.prompt_shares to authenticated;

create function public.prompt_folder_role(folder uuid) returns text
language sql stable security definer set search_path = '' as $$
    select case when f.owner_id = (select auth.uid()) then 'owner' else m.role end
    from public.prompt_folders f
    left join public.prompt_folder_members m on m.folder_id = f.id and m.user_id = (select auth.uid())
    where f.id = folder
$$;

create policy prompt_visible_folders on public.prompt_folders for select to authenticated
    using (public.prompt_folder_role(id) is not null);
create policy prompt_own_membership on public.prompt_folder_members for select to authenticated
    using (user_id = (select auth.uid()));
create policy prompt_visible_drafts on public.prompt_drafts for select to authenticated
    using (
        (folder_id is null and created_by = (select auth.uid()))
        or public.prompt_folder_role(folder_id) is not null
    );
create policy prompt_visible_versions on public.prompt_versions for select to authenticated
    using (exists (select 1 from public.prompt_drafts d where d.id = draft_id));
create policy prompt_own_shares on public.prompt_shares for select to authenticated
    using (owner_id = (select auth.uid()));

create function public.save_prompt_draft(draft_id uuid, base_revision integer, in_folder uuid, draft_name text, draft_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    actor uuid := auth.uid();
    saved public.prompt_drafts%rowtype;
begin
    if actor is null then
        raise exception 'prompt_forbidden' using errcode = '42501';
    end if;
    if draft_name is null or char_length(btrim(draft_name)) not between 1 and 120
        or jsonb_typeof(draft_payload) is distinct from 'object'
        or (draft_payload->'version') is distinct from '1'::jsonb
        or octet_length(draft_payload::text) > 400000 then
        raise exception 'prompt_invalid' using errcode = '22023';
    end if;

    if draft_id is null then
        if in_folder is not null and coalesce(public.prompt_folder_role(in_folder), '') not in ('owner', 'editor') then
            raise exception 'prompt_forbidden' using errcode = '42501';
        end if;
        insert into public.prompt_drafts (created_by, folder_id, name, payload)
            values (actor, in_folder, btrim(draft_name), draft_payload) returning * into saved;
    else
        select * into saved from public.prompt_drafts where id = draft_id for update;
        if not found or (saved.folder_id is null and saved.created_by <> actor)
            or (saved.folder_id is not null and coalesce(public.prompt_folder_role(saved.folder_id), '') not in ('owner', 'editor'))
            or saved.folder_id is distinct from in_folder then
            raise exception 'prompt_forbidden' using errcode = '42501';
        end if;
        if saved.revision is distinct from base_revision then
            raise exception 'prompt_conflict' using errcode = 'P0001';
        end if;
        if saved.payload = draft_payload and saved.name = btrim(draft_name) then return to_jsonb(saved); end if;
        update public.prompt_drafts set name = btrim(draft_name), payload = draft_payload, revision = revision + 1, updated_at = now()
            where id = draft_id returning * into saved;
    end if;

    insert into public.prompt_versions (draft_id, revision, name, payload) values (saved.id, saved.revision, saved.name, saved.payload);
    return to_jsonb(saved);
end
$$;

create function public.delete_prompt_draft(draft_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
    delete from public.prompt_drafts d where d.id = draft_id and (
        (d.folder_id is null and d.created_by = auth.uid())
        or public.prompt_folder_role(d.folder_id) = 'owner'
        or (d.created_by = auth.uid() and public.prompt_folder_role(d.folder_id) = 'editor')
    );
    if not found then raise exception 'prompt_forbidden' using errcode = '42501'; end if;
end
$$;

create function public.create_prompt_folder(folder_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare created uuid;
begin
    insert into public.prompt_folders (owner_id, name) values (auth.uid(), btrim(folder_name)) returning id into created;
    return created;
end
$$;

create function public.delete_prompt_folder(folder uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
    delete from public.prompt_folders where id = folder and owner_id = auth.uid();
    if not found then raise exception 'prompt_forbidden' using errcode = '42501'; end if;
end
$$;

create function public.invite_to_prompt_folder(folder uuid, member_role text) returns text
language plpgsql security definer set search_path = '' as $$
declare token text;
begin
    if public.prompt_folder_role(folder) is distinct from 'owner' then
        raise exception 'prompt_forbidden' using errcode = '42501';
    end if;
    token := encode(extensions.gen_random_bytes(32), 'hex');
    delete from public.prompt_folder_invites where folder_id = folder and expires_at <= now();
    insert into public.prompt_folder_invites (folder_id, role, token_hash)
        values (folder, member_role, extensions.digest(token, 'sha256'));
    return token;
end
$$;

create function public.accept_prompt_folder_invite(invite_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare invitation public.prompt_folder_invites%rowtype;
begin
    if auth.uid() is null or invite_token is null or invite_token !~ '^[a-f0-9]{64}$' then
        raise exception 'prompt_invite_invalid' using errcode = '22023';
    end if;
    delete from public.prompt_folder_invites
        where token_hash = extensions.digest(invite_token, 'sha256') and expires_at > now()
        returning * into invitation;
    if not found then raise exception 'prompt_invite_invalid' using errcode = '22023'; end if;
    if public.prompt_folder_role(invitation.folder_id) is distinct from 'owner' then
        insert into public.prompt_folder_members (folder_id, user_id, role)
            values (invitation.folder_id, auth.uid(), invitation.role) on conflict do nothing;
    end if;
    return invitation.folder_id;
end
$$;

create function public.list_prompt_folder_members(folder uuid)
returns table (user_id uuid, display_email text, role text)
language plpgsql stable security definer set search_path = '' as $$
begin
    if public.prompt_folder_role(folder) is distinct from 'owner' then
        raise exception 'prompt_forbidden' using errcode = '42501';
    end if;
    return query select m.user_id, coalesce(u.email, '')::text, m.role
        from public.prompt_folder_members m join auth.users u on u.id = m.user_id
        where m.folder_id = folder order by u.email;
end
$$;

create function public.set_prompt_folder_member(folder uuid, member uuid, member_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
    if public.prompt_folder_role(folder) is distinct from 'owner' then
        raise exception 'prompt_forbidden' using errcode = '42501';
    end if;
    if member_role is null then
        delete from public.prompt_folder_members where folder_id = folder and user_id = member;
    else
        update public.prompt_folder_members set role = member_role where folder_id = folder and user_id = member;
    end if;
end
$$;

create function public.publish_prompt_snapshot(snapshot_title text, snapshot_prompt text) returns text
language plpgsql security definer set search_path = '' as $$
declare token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
    delete from public.prompt_shares where owner_id = auth.uid() and expires_at <= now();
    insert into public.prompt_shares (owner_id, token_hash, title, prompt)
        values (auth.uid(), extensions.digest(token, 'sha256'), btrim(snapshot_title), snapshot_prompt);
    return token;
end
$$;

create function public.read_prompt_snapshot(share_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
    select jsonb_build_object('title', title, 'prompt', prompt)
    from public.prompt_shares
    where share_token ~ '^[a-f0-9]{64}$'
        and token_hash = extensions.digest(share_token, 'sha256')
        and expires_at > now()
$$;

create function public.revoke_prompt_snapshot(share_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
    delete from public.prompt_shares where id = share_id and owner_id = auth.uid();
    if not found then raise exception 'prompt_forbidden' using errcode = '42501'; end if;
end
$$;

revoke execute on function public.prompt_folder_role(uuid), public.save_prompt_draft(uuid, integer, uuid, text, jsonb),
    public.delete_prompt_draft(uuid), public.create_prompt_folder(text), public.delete_prompt_folder(uuid),
    public.invite_to_prompt_folder(uuid, text), public.accept_prompt_folder_invite(text),
    public.list_prompt_folder_members(uuid), public.set_prompt_folder_member(uuid, uuid, text),
    public.publish_prompt_snapshot(text, text), public.read_prompt_snapshot(text), public.revoke_prompt_snapshot(uuid)
    from public, anon, authenticated;
grant execute on function public.prompt_folder_role(uuid), public.save_prompt_draft(uuid, integer, uuid, text, jsonb),
    public.delete_prompt_draft(uuid), public.create_prompt_folder(text), public.delete_prompt_folder(uuid),
    public.invite_to_prompt_folder(uuid, text), public.accept_prompt_folder_invite(text),
    public.list_prompt_folder_members(uuid), public.set_prompt_folder_member(uuid, uuid, text),
    public.publish_prompt_snapshot(text, text), public.revoke_prompt_snapshot(uuid) to authenticated;
grant execute on function public.read_prompt_snapshot(text) to anon, authenticated;
