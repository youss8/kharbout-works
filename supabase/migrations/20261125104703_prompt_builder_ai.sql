create table public.prompt_ai_settings (
    id boolean primary key default true check (id),
    enabled boolean not null default false,
    daily_account_limit integer not null default 10 check (daily_account_limit > 0),
    monthly_budget_micros bigint not null default 25000000 check (monthly_budget_micros > 0)
);
insert into public.prompt_ai_settings default values;

create table public.prompt_ai_usage (
    id uuid primary key default gen_random_uuid(),
    account_id uuid references auth.users on delete set null,
    created_at timestamptz not null default now(),
    action text not null check (action in ('suggest', 'run', 'evaluate')),
    reserved_micros bigint not null check (reserved_micros > 0),
    actual_micros bigint check (actual_micros >= 0),
    status text not null default 'pending'
        check (status in ('pending', 'success', 'refused', 'timeout', 'provider_error')),
    duration_ms integer check (duration_ms >= 0)
);
create index prompt_ai_usage_by_account on public.prompt_ai_usage (account_id, created_at desc);
create index prompt_ai_usage_by_month on public.prompt_ai_usage (created_at desc);

alter table public.prompt_ai_settings enable row level security;
alter table public.prompt_ai_usage enable row level security;
revoke all on public.prompt_ai_settings, public.prompt_ai_usage from public, anon, authenticated;

create function public.reserve_prompt_ai(actor uuid, request_action text, hold_micros bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
    settings public.prompt_ai_settings%rowtype;
    held bigint;
    reservation uuid;
begin
    perform pg_advisory_xact_lock(31117251);
    select * into settings from public.prompt_ai_settings where id for share;
    if not found or not settings.enabled then return jsonb_build_object('error', 'ai_unavailable'); end if;
    if not exists (select 1 from auth.users where id = actor and email_confirmed_at is not null) then
        return jsonb_build_object('error', 'prompt_forbidden');
    end if;
    if (select count(*) from public.prompt_ai_usage
        where account_id = actor and created_at >= date_trunc('day', now(), 'UTC')) >= settings.daily_account_limit then
        return jsonb_build_object('error', 'ai_limit');
    end if;
    select coalesce(sum(coalesce(actual_micros, reserved_micros)), 0) into held from public.prompt_ai_usage
        where created_at >= date_trunc('month', now(), 'UTC');
    if hold_micros + held > settings.monthly_budget_micros then return jsonb_build_object('error', 'ai_limit'); end if;
    insert into public.prompt_ai_usage (account_id, action, reserved_micros) values (actor, request_action, hold_micros)
        returning id into reservation;
    return jsonb_build_object('reservation', reservation);
end
$$;

create function public.finish_prompt_ai(reservation uuid, billed_micros bigint, outcome text, elapsed_ms integer)
returns void language sql security definer set search_path = '' as $$
    update public.prompt_ai_usage set actual_micros = billed_micros, status = outcome, duration_ms = elapsed_ms
        where id = reservation and status = 'pending'
$$;

revoke execute on function public.reserve_prompt_ai(uuid, text, bigint), public.finish_prompt_ai(uuid, bigint, text, integer)
    from public, anon, authenticated;
grant execute on function public.reserve_prompt_ai(uuid, text, bigint), public.finish_prompt_ai(uuid, bigint, text, integer)
    to service_role;
