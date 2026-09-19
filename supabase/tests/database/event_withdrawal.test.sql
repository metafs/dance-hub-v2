-- ADR-0018 makes `withdrawn` unreachable from every public surface, and the
-- AGENTS.md evidence rule asks for a database-level proof rather than UI
-- behaviour. The assertions below cover who may withdraw, what a Visitor can
-- still reach afterwards, and the failure the hand-written workaround had:
-- approving a later Revision used to put the Event back on the public surface.

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

select plan(13);

-- A published Event of the seed Organization 'aaaa…', whose Owner is 33333333
-- and whose Platform Admin is 22222222. 55555555 owns an unrelated Organization.
insert into public.events (id, owner_organization_id)
values ('33333333-aaaa-4aaa-8aaa-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.event_revisions (
  id, event_id, created_by, status, title, description, event_type, no_registration_required
)
values (
  '33333333-bbbb-4bbb-8bbb-000000000001',
  '33333333-aaaa-4aaa-8aaa-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'draft',
  'Withdrawal fixture',
  'Published so the withdrawal has something to remove.',
  'performance',
  true
);

-- Content goes in while the Revision is still a draft, because
-- assert_event_revision_content_editable locks it afterwards.
insert into public.event_schedules (event_revision_id, venue_id, starts_at, ends_at)
values (
  '33333333-bbbb-4bbb-8bbb-000000000001',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '2031-04-01T10:00:00Z',
  '2031-04-01T12:00:00Z'
);

insert into public.event_artists (event_revision_id, artist_id, role)
values (
  '33333333-bbbb-4bbb-8bbb-000000000001',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '出演'
);

update public.event_revisions
  set status = 'approved'
  where id = '33333333-bbbb-4bbb-8bbb-000000000001';

update public.events
  set published_revision_id = '33333333-bbbb-4bbb-8bbb-000000000001'
  where id = '33333333-aaaa-4aaa-8aaa-000000000001';

-- The Visitor's baseline, so the counts after the withdrawal mean something.
set local role anon;
select is(
  (select count(*)::integer from public.events
    where id = '33333333-aaaa-4aaa-8aaa-000000000001'),
  1,
  'a Visitor can read the Event before it is withdrawn'
);
select is(
  (select count(*)::integer from public.event_schedules
    where event_revision_id = '33333333-bbbb-4bbb-8bbb-000000000001'),
  1,
  'a Visitor can read its Schedule before it is withdrawn'
);

reset role;

-- Only a Platform Admin decides a withdrawal (listing-policy F).
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select throws_ok(
  $$select public.withdraw_event('33333333-aaaa-4aaa-8aaa-000000000001', 'Owner tries to remove it')$$,
  'P0001',
  'platform admin required',
  'the owning Organization cannot withdraw its own Event'
);

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select throws_ok(
  $$select public.withdraw_event('33333333-aaaa-4aaa-8aaa-000000000001', 'Outsider tries to remove it')$$,
  'P0001',
  'platform admin required',
  'an unrelated Organization Owner cannot withdraw an Event'
);

-- A reason is not optional: the decision has to be explainable later.
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select throws_ok(
  $$select public.withdraw_event('33333333-aaaa-4aaa-8aaa-000000000001', '   ')$$,
  'P0001',
  'withdrawal reason is required',
  'a withdrawal without a reason is refused'
);

select lives_ok(
  $$select public.withdraw_event('33333333-aaaa-4aaa-8aaa-000000000001', '権利者からの申し立てにより取り下げ')$$,
  'a Platform Admin can withdraw a published Event'
);

reset role;

-- Every public read path goes through is_current_published_event_revision, so
-- one column hides the Event and all of its Revision-owned content at once.
set local role anon;
select is(
  (select count(*)::integer from public.events
    where id = '33333333-aaaa-4aaa-8aaa-000000000001'),
  0,
  'a withdrawn Event is unreachable by direct id'
);
select is(
  (select count(*)::integer from public.event_revisions
    where id = '33333333-bbbb-4bbb-8bbb-000000000001'),
  0,
  'its published Revision is unreachable'
);
select is(
  (select count(*)::integer from public.event_schedules
    where event_revision_id = '33333333-bbbb-4bbb-8bbb-000000000001'),
  0,
  'its Schedules are unreachable, so it leaves the Calendar and the region filters'
);
select is(
  (select count(*)::integer from public.event_artists
    where event_revision_id = '33333333-bbbb-4bbb-8bbb-000000000001'),
  0,
  'its Artist credits are unreachable, so it leaves the Artist pages'
);

reset role;

-- The defect the SQL workaround had. approve_event_revision writes
-- published_revision_id unconditionally, so a withdrawal expressed as a null
-- pointer was undone by the next approval without anyone noticing.
insert into public.event_revisions (
  id, event_id, created_by, status, title, description, event_type, no_registration_required
)
values (
  '33333333-bbbb-4bbb-8bbb-000000000002',
  '33333333-aaaa-4aaa-8aaa-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'draft',
  'Withdrawal fixture, resubmitted',
  'A later Revision must not put a withdrawn Event back on the public surface.',
  'performance',
  true
);

select throws_ok(
  $$update public.event_revisions
      set status = 'in_review'
    where id = '33333333-bbbb-4bbb-8bbb-000000000002'$$,
  'P0001',
  'a withdrawn event cannot publish revisions',
  'a withdrawn Event cannot move a Revision back into review'
);

-- Restoring is an admin decision too, and both directions are recorded.
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select lives_ok(
  $$select public.restore_event('33333333-aaaa-4aaa-8aaa-000000000001', '申し立てが取り下げられたため')$$,
  'a Platform Admin can restore a withdrawn Event'
);

reset role;

select is(
  (select array_agg(entry.action::text order by entry.id)
    from public.event_revision_audit_log entry
    where entry.event_id = '33333333-aaaa-4aaa-8aaa-000000000001'),
  array['event_withdrawn', 'event_restored'],
  'both decisions are recorded in the review audit log'
);

select * from finish();
rollback;
