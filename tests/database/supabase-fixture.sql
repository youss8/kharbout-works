-- Minimal Supabase auth boundary for the disposable PostgreSQL CI database.
create schema extensions;
create schema auth;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create table auth.users (
    id uuid primary key,
    email text,
    email_confirmed_at timestamptz
);
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
