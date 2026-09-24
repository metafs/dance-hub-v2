-- DEC-R7: the Platform Admin's review memo on a Revision (decision_reason) is
-- not readable through event_revisions by any signed-in user; the people it
-- is for receive it through review_notifications and the audit log instead.

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

select plan(7);

select ok(
  not has_column_privilege('authenticated', 'public.event_revisions', 'decision_reason', 'SELECT'),
  'signed-in users hold no read privilege on the review memo'
);

select set_eq(
  $$
    select column_name::text
    from information_schema.column_privileges
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name = 'event_revisions'
      and privilege_type = 'SELECT'
  $$,
  array[
    'id', 'event_id', 'created_by', 'status', 'title', 'description', 'event_type',
    'application_deadline', 'proposed_parent_event_id', 'created_at', 'reviewed_at',
    'reviewed_by', 'no_registration_required', 'contact_kind', 'contact_value'
  ],
  'every other Revision column stays readable to signed-in users'
);

-- The published fixture Revision belongs to the fixture Organization, whose
-- Owner is 3333; 5555 owns a different Organization.
update public.event_revisions
set decision_reason = '内部メモ: 主催者以外には見せない'
where id = 'e0000001-0000-4000-8000-0000000000a1';

set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);

select ok(
  (select count(*) from public.event_revisions where id = 'e0000001-0000-4000-8000-0000000000a1') = 1,
  'a member of another Organization still reads the published Revision'
);

select throws_ok(
  $$select decision_reason from public.event_revisions where id = 'e0000001-0000-4000-8000-0000000000a1'$$,
  '42501',
  null,
  'a member of another Organization cannot read its review memo'
);

select throws_ok(
  $$select * from public.event_revisions where id = 'e0000001-0000-4000-8000-0000000000a1'$$,
  '42501',
  null,
  'a wildcard select cannot reach the memo either'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select lives_ok(
  $$select id, event_id, status, title, description, event_type, application_deadline, proposed_parent_event_id, no_registration_required, contact_kind, contact_value, created_at from public.event_revisions where event_id = 'e0000001-0000-4000-8000-000000000001'$$,
  'the owning Organization reads every column its workspace selects'
);

select throws_ok(
  $$select decision_reason from public.event_revisions where id = 'e0000001-0000-4000-8000-0000000000a1'$$,
  '42501',
  null,
  'the owning Organization reads the memo through its notifications and audit log, not here'
);

reset role;

select * from finish();
rollback;
