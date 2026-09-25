-- A signed-in user holds only the privileges RLS and the trusted functions are
-- written for (REQ-AUTH-001), the counterpart of
-- 20260923000000_restrict_anonymous_privileges.sql for `authenticated`.
--
-- Supabase gives authenticated every privilege on new tables in `public`. Most
-- migrations narrowed the reads and writes, but none took back TRUNCATE,
-- REFERENCES or TRIGGER, and two tables kept writes no policy admits. None of
-- this was reachable through the API — PostgREST issues no TRUNCATE, and RLS
-- refuses the writes — but TRUNCATE is not subject to RLS, so the grant was one
-- SECURITY INVOKER function away from emptying a table.

-- 1. Privileges no client needs. anon lost them in 20260923000000; this also
--    covers tables created since.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- 2. Writes no policy admits. A profile is created by handle_new_user and never
--    edited from a client; the organization audit log is written only by the
--    SECURITY DEFINER functions that record each change.
revoke update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.organization_audit_log from authenticated;

-- 3. New tables. Supabase's defaults would hand these privileges back on the
--    next table, and give anon writes. A new table now starts without them.
--    Functions keep their defaults: PostgreSQL grants EXECUTE to PUBLIC
--    globally, which a schema default cannot take back, so a new function
--    still states its grants in the migration that adds it, and
--    anonymous_privileges.test.sql fails when it does not.
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger on tables from anon;
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from authenticated;

-- 4. The RLS helpers take a user id so policies can pass auth.uid(), but called
--    through the API they answered for any id: a Visitor or a signed-in user
--    could learn whether an arbitrary user was a Platform Admin or a member of
--    a given Organization. They now answer only about the caller. Every caller
--    in policies, functions and the application passes auth.uid() or relies on
--    the default, so none of them changes.
create or replace function public.is_platform_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(check_user = auth.uid(), false)
    and exists (select 1 from public.platform_admins where user_id = check_user)
$$;

create or replace function public.is_organization_member(
  target_organization_id uuid,
  check_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(check_user = auth.uid(), false)
    and exists (
      select 1
      from public.organization_memberships
      where organization_id = target_organization_id
        and user_id = check_user
    )
$$;

-- No policy evaluated for anon calls either helper: every policy that does is
-- for authenticated, or sits on a table anon cannot read. anon keeps only
-- is_current_published_event_revision, which the public read policies use.
-- Both were also executable through PUBLIC; authenticated and service_role
-- hold their own grants.
revoke execute on function public.is_platform_admin(uuid) from public, anon;
revoke execute on function public.is_organization_member(uuid, uuid) from public, anon;
