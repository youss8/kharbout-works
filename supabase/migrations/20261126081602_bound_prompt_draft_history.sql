-- Match JavaScript's string lengths, including two UTF-16 units for supplementary characters.
create function prompt_internal.prompt_text_fits(value jsonb, maximum integer)
returns boolean language sql immutable set search_path = '' as $$
    select coalesce(jsonb_typeof(value) = 'string' and
        char_length(value #>> '{}') + regexp_count(value #>> '{}', '[\U00010000-\U0010FFFF]') <= maximum, false)
$$;

create function prompt_internal.valid_prompt_draft(doc jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
    pref jsonb := doc->'preferences';
    workflow text := doc->>'workflowId';
    keys text[];
    item record;
    run jsonb;
    chain jsonb := doc->'chain';
    chain_steps text[];
begin
    if (doc->'version') is distinct from '1'::jsonb or (doc->'workflowVersion') is distinct from '1'::jsonb
       or jsonb_typeof(doc->'values') is distinct from 'object' or jsonb_typeof(pref) is distinct from 'object'
       or jsonb_typeof(doc->'edits') is distinct from 'object' or jsonb_typeof(doc->'runs') is distinct from 'array'
       or chain is null then return false; end if;
    keys := case workflow
        when 'blank' then array['TASK','CONTEXT','CONSTRAINTS']
        when 'draft-email' then array['RECIPIENT','GOAL','DETAILS']
        when 'summarize-notes' then array['NOTES','FOCUS']
        when 'study-plan' then array['GOAL','TIME','LEVEL']
        when 'meeting-follow-up' then array['NOTES','RECIPIENT']
        when 'bug-to-spec' then array['OBSERVED','EXPECTED','STEPS','ENVIRONMENT']
        when 'review-pull-request' then array['GOAL','DIFF','CONCERNS']
        when 'implementation-brief' then array['GOAL','CONTEXT','CONSTRAINTS']
        when 'handover' then array['RECIPIENT','STATUS','NEXT','BLOCKERS']
        when 'verification-checklist' then array['CONTEXT']
        when 'meeting-decisions' then array['NOTES']
        when 'meeting-actions' then array['CONTEXT']
        else null end;
    if keys is null or not prompt_internal.prompt_text_fits(pref->'audience', 500)
       or coalesce(pref->>'tone','') not in ('neutral','friendly','formal','direct')
       or coalesce(pref->>'format','') not in ('default','bullets','table','prose','json')
       or coalesce(pref->>'target','') not in ('chat','coding')
       or coalesce(pref->>'outputLocale','') not in ('en','ar')
       or (pref ? 'profile' and coalesce(pref->>'profile','') not in ('universal','openai','openai-reasoning','claude','gemini','deepseek','grok','mistral','llama','qwen','copilot','github-copilot','codex','claude-code','perplexity'))
       then return false; end if;
    for item in select * from jsonb_each(pref) where key in ('sources','criteria','example') loop
        if not prompt_internal.prompt_text_fits(item.value,2000) then return false; end if;
    end loop;
    for item in select * from jsonb_each(doc->'values') loop
        if not item.key = any(keys) or not prompt_internal.prompt_text_fits(item.value,8000) then return false; end if;
    end loop;
    for item in select * from jsonb_each(doc->'edits') loop
        if item.key not in ('concise','detailed') or not prompt_internal.prompt_text_fits(item.value,40000) then return false; end if;
    end loop;
    if jsonb_array_length(doc->'runs') > 4 then return false; end if;
    for run in select value from jsonb_array_elements(doc->'runs') loop
        if not prompt_internal.prompt_text_fits(run->'prompt',40000)
           or not prompt_internal.prompt_text_fits(run->'result',40000) then return false; end if;
    end loop;
    if chain <> 'null'::jsonb then
        chain_steps := case chain->>'id'
            when 'bug-fix' then array['bug-to-spec','implementation-brief','verification-checklist']
            when 'meeting-actions' then array['meeting-decisions','meeting-actions','meeting-follow-up'] else null end;
        -- Compare as JSON numbers so integer-valued decimals match JavaScript Number.isInteger.
        if chain_steps is null or not exists (
            select 1 from unnest(chain_steps) with ordinality as s(id, position)
            where s.id = workflow and chain->'step' = to_jsonb(s.position - 1)
        ) then return false; end if;
    end if;
    return true;
end
$$;

-- Keep existing payloads readable, including records written by older clients.
alter table public.prompt_versions add column history_bytes integer generated always as
    (octet_length(payload::text) + octet_length(name) + 128) stored;

create function prompt_internal.check_history_budget()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
    library public.prompt_drafts%rowtype;
    used_bytes bigint;
begin
    select * into strict library from public.prompt_drafts where id = new.draft_id;
    perform pg_advisory_xact_lock(hashtextextended(
        coalesce('folder/' || library.folder_id::text, 'personal/' || library.created_by::text), 0));
    select sum(v.history_bytes) into used_bytes from public.prompt_versions v
    join public.prompt_drafts d on d.id = v.draft_id
    where d.folder_id = library.folder_id
       or (library.folder_id is null and d.folder_id is null and d.created_by = library.created_by);
    if used_bytes > 32 * 1024 * 1024 then
        raise exception 'prompt_storage_limit' using errcode = 'P0001';
    end if;
    return new;
end
$$;

revoke execute on function prompt_internal.prompt_text_fits(jsonb,integer),
    prompt_internal.valid_prompt_draft(jsonb), prompt_internal.check_history_budget() from public, anon, authenticated;
create trigger prompt_history_budget after insert on public.prompt_versions
for each row execute function prompt_internal.check_history_budget();

create or replace function public.save_prompt_draft(draft_id uuid, base_revision integer, in_folder uuid, draft_name text, draft_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    actor uuid := auth.uid();
    saved public.prompt_drafts%rowtype;
begin
    if actor is null then
        raise exception 'prompt_forbidden' using errcode = '42501';
    end if;
    if draft_name is null or char_length(btrim(draft_name)) not between 1 and 120
        or octet_length(draft_payload::text) > 4 * 1024 * 1024
        or not prompt_internal.valid_prompt_draft(draft_payload) then
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
