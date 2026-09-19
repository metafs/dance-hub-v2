-- ADR-0016 puts main-image upload behind the Revision edit authorization that
-- already exists, and the AGENTS.md evidence rule asks for a database-level
-- proof rather than UI behaviour. This asserts the two ways a write must fail:
-- a user outside the owning Organization, and a Revision that has left the
-- editable states (REQ-AUTH-001, REQ-MEDIA-001).

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

select plan(8);

-- A draft Revision of an Event owned by the seed Organization 'aaaa…', whose
-- Owner is 33333333 and whose Editor is 44444444. 11111111 belongs to no
-- Organization; 55555555 owns the unrelated Organization 'bbbb…'.
insert into public.events (id, owner_organization_id)
values ('22222222-aaaa-4aaa-8aaa-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.event_revisions (id, event_id, created_by, status, title, event_type)
values (
  '22222222-bbbb-4bbb-8bbb-000000000001',
  '22222222-aaaa-4aaa-8aaa-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'draft',
  'Media authorization fixture',
  'performance'
);

select ok(
  not has_table_privilege('anon', 'public.event_media', 'INSERT'),
  'anonymous users cannot write media at all'
);

-- A member of the owning Organization may attach media while the Revision is a
-- draft. This is the positive case the negative ones are measured against.
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select lives_ok(
  $$insert into public.event_media
      (event_revision_id, object_key, content_type, alt_text, is_main)
    values (
      '22222222-bbbb-4bbb-8bbb-000000000001',
      'events/22222222-aaaa-4aaa-8aaa-000000000001/0123abcd-4567.jpg',
      'image/jpeg',
      'Fixture main image',
      true
    )$$,
  'an Organization member can attach media to a draft Revision'
);

-- A user outside the owning Organization is refused by the insert policy.
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select throws_ok(
  $$insert into public.event_media
      (event_revision_id, object_key, content_type, alt_text, is_main)
    values (
      '22222222-bbbb-4bbb-8bbb-000000000001',
      'events/22222222-aaaa-4aaa-8aaa-000000000001/deadbeef-0001.jpg',
      'image/jpeg',
      'Outsider upload',
      false
    )$$,
  '42501',
  null,
  'a user outside the owning Organization cannot attach media'
);

-- An Owner of a different Organization is equally refused.
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select throws_ok(
  $$insert into public.event_media
      (event_revision_id, object_key, content_type, alt_text, is_main)
    values (
      '22222222-bbbb-4bbb-8bbb-000000000001',
      'events/22222222-aaaa-4aaa-8aaa-000000000001/deadbeef-0002.jpg',
      'image/jpeg',
      'Other organization upload',
      false
    )$$,
  '42501',
  null,
  'an Owner of another Organization cannot attach media'
);
select is(
  (select count(*)::integer from public.event_media
    where event_revision_id = '22222222-bbbb-4bbb-8bbb-000000000001'),
  0,
  'a non-member cannot even read the media it failed to write'
);

reset role;

-- Once the Revision is submitted, its content is locked for everyone including
-- the member who created it.
update public.event_revisions
  set status = 'in_review'
  where id = '22222222-bbbb-4bbb-8bbb-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select throws_ok(
  $$insert into public.event_media
      (event_revision_id, object_key, content_type, alt_text, is_main)
    values (
      '22222222-bbbb-4bbb-8bbb-000000000001',
      'events/22222222-aaaa-4aaa-8aaa-000000000001/deadbeef-0003.jpg',
      'image/jpeg',
      'Late upload',
      false
    )$$,
  'P0001',
  null,
  'a member cannot attach media once the Revision is in review'
);
-- The update policy's USING clause stops matching once the Revision leaves the
-- editable states, so the statement updates no rows rather than raising: the
-- row is simply not visible to an update any more.
select lives_ok(
  $$update public.event_media
      set alt_text = 'Rewritten while in review'
    where event_revision_id = '22222222-bbbb-4bbb-8bbb-000000000001'$$,
  'an update against a locked Revision is refused by the policy, not by an error'
);
select is(
  (select alt_text from public.event_media
    where event_revision_id = '22222222-bbbb-4bbb-8bbb-000000000001'),
  'Fixture main image',
  'a member cannot rewrite media once the Revision is in review'
);

reset role;

select * from finish();
rollback;
