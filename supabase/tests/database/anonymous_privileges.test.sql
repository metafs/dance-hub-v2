-- DH-16: the complete privilege surface of an anonymous Visitor.
--
-- The other database tests prove that particular rows stay hidden. This one
-- pins what anon may touch at all, so a migration that adds a table, a column
-- or a function in `public` cannot widen the anonymous surface without this
-- file changing in the same pull request. Supabase grants anon everything on
-- new objects by default; a missing revoke therefore fails here.

begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to anon, authenticated;
do $$
declare
  assertion_function record;
begin
  for assertion_function in
    select procedure.oid::regprocedure as signature
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_depend dependency
      on dependency.classid = 'pg_catalog.pg_proc'::regclass
      and dependency.objid = procedure.oid
      and dependency.deptype = 'e'
    join pg_catalog.pg_extension extension
      on extension.oid = dependency.refobjid
    where extension.extname = 'pgtap'
  loop
    execute format('grant execute on function %s to anon, authenticated', assertion_function.signature);
  end loop;
end;
$$;

select plan(12);

-- Writes ---------------------------------------------------------------------

select is_empty(
  $$
    select table_name || ':' || privilege_type
    from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public' and privilege_type <> 'SELECT'
    union
    select table_name || '.' || column_name || ':' || privilege_type
    from information_schema.column_privileges
    where grantee = 'anon' and table_schema = 'public' and privilege_type <> 'SELECT'
  $$,
  'anon holds no write, truncate, reference or trigger privilege on any table'
);

-- Reads ----------------------------------------------------------------------

select set_eq(
  $$
    select table_name::text
    from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public' and privilege_type = 'SELECT'
  $$,
  array[
    'artists',
    'event_artists',
    'event_links',
    'event_media',
    'event_schedules',
    'event_ticket_links',
    'event_ticket_offers',
    'venues'
  ],
  'anon reads whole rows only from published Event content and canonical Artists and Venues'
);

select set_eq(
  $$
    select column_privilege.table_name::text || '.' || column_privilege.column_name::text
    from information_schema.column_privileges column_privilege
    where column_privilege.grantee = 'anon'
      and column_privilege.table_schema = 'public'
      and column_privilege.privilege_type = 'SELECT'
      and not exists (
        select 1
        from information_schema.role_table_grants table_grant
        where table_grant.grantee = 'anon'
          and table_grant.table_schema = 'public'
          and table_grant.table_name = column_privilege.table_name
          and table_grant.privilege_type = 'SELECT'
      )
  $$,
  array[
    'events.id',
    'events.owner_organization_id',
    'events.published_revision_id',
    'events.cancelled_at',
    'events.cancellation_reason',
    'events.created_at',
    'events.parent_event_id',
    'events.listing_origin',
    'event_revisions.id',
    'event_revisions.event_id',
    'event_revisions.status',
    'event_revisions.title',
    'event_revisions.description',
    'event_revisions.event_type',
    'event_revisions.application_deadline',
    'event_revisions.proposed_parent_event_id',
    'event_revisions.created_at',
    'event_revisions.reviewed_at',
    'event_revisions.no_registration_required',
    'event_revisions.contact_kind',
    'event_revisions.contact_value',
    'organizations.id',
    'organizations.name'
  ],
  'anon reads Events, Revisions and Organizations only through the listed public columns'
);

select ok(
  not has_column_privilege('anon', 'public.event_revisions', 'decision_reason', 'SELECT')
  and not has_column_privilege('anon', 'public.event_revisions', 'reviewed_by', 'SELECT')
  and not has_column_privilege('anon', 'public.event_revisions', 'created_by', 'SELECT'),
  'the review memo, reviewer and author of a published Revision are not public'
);

select ok(
  not has_column_privilege('anon', 'public.events', 'withdrawal_reason', 'SELECT')
  and not has_column_privilege('anon', 'public.events', 'withdrawn_by', 'SELECT')
  and not has_column_privilege('anon', 'public.events', 'withdrawn_at', 'SELECT'),
  'why and by whom an Event was withdrawn is not public'
);

-- Functions ------------------------------------------------------------------

select set_eq(
  $$
    select procedure.oid::regprocedure::text
    from pg_catalog.pg_proc procedure
    where procedure.pronamespace = 'public'::regnamespace
      and procedure.prorettype <> 'trigger'::regtype
      and has_function_privilege('anon', procedure.oid, 'EXECUTE')
  $$,
  array[
    'is_current_published_event_revision(uuid)'
  ],
  'anon can call only the helpers the public read policies evaluate'
);

select ok(
  has_function_privilege('authenticated', 'public.approve_event_revision(uuid,text)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.withdraw_event(uuid,text)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.create_event_revision_draft(uuid)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.approve_organization_application(uuid,text)', 'EXECUTE'),
  'signed-in users keep the trusted transitions, which authorize the caller themselves'
);

-- Behaviour as anon ----------------------------------------------------------

update public.event_revisions
set decision_reason = '内部メモ: 公開しない'
where id = 'e0000001-0000-4000-8000-0000000000a1';

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select ok(
  (select count(*) from public.event_revisions where id = 'e0000001-0000-4000-8000-0000000000a1') = 1,
  'a Visitor still reads the published Revision itself'
);

select lives_ok(
  $$select id, title, description, event_type, application_deadline, reviewed_at, contact_kind, contact_value from public.event_revisions$$,
  'every Revision column the public pages select remains readable'
);

select throws_ok(
  $$select decision_reason from public.event_revisions where id = 'e0000001-0000-4000-8000-0000000000a1'$$,
  '42501',
  null,
  'a Visitor cannot read the review memo of a published Revision'
);

select throws_ok(
  $$select public.approve_event_revision('e0000001-0000-4000-8000-0000000000a1', null)$$,
  '42501',
  null,
  'a Visitor cannot call a trusted transition at all'
);

select throws_ok(
  $$select count(*) from public.profiles$$,
  '42501',
  null,
  'a Visitor cannot query profiles'
);

reset role;

select * from finish();
rollback;
