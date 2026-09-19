-- M6 requires a check that non-approved Event content never reaches a Visitor.
--
-- Every count below is scoped to this test's own Revisions: the seed carries
-- published Event fixtures for the anonymous discovery journey, so a global
-- count would measure those too.
-- The existing database tests cover privileges and the review transitions; this
-- one covers row visibility, by building an Event whose draft and in-review
-- content sits beside its approved content and asserting an anonymous reader
-- sees only the approved Revision (REQ-AUTH-001, REQ-EVENT-002).

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

select plan(14);

-- A published Event. Child content is inserted while the Revision is a draft,
-- because assert_event_revision_content_editable locks it afterwards, and the
-- Revision is then approved and published.
insert into public.events (id, owner_organization_id)
values ('11111111-aaaa-4aaa-8aaa-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.event_revisions (id, event_id, created_by, status, title, description, event_type)
values (
  '11111111-bbbb-4bbb-8bbb-000000000001',
  '11111111-aaaa-4aaa-8aaa-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'draft',
  'Approved revision title',
  'Approved revision description',
  'performance'
);

insert into public.event_schedules (event_revision_id, venue_id, starts_at, ends_at)
values (
  '11111111-bbbb-4bbb-8bbb-000000000001',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '2030-04-01T10:00:00Z',
  '2030-04-01T12:00:00Z'
);
insert into public.event_artists (event_revision_id, artist_id, role)
values (
  '11111111-bbbb-4bbb-8bbb-000000000001',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Approved credit'
);
insert into public.event_media (event_revision_id, object_key, content_type, alt_text, is_main)
values (
  '11111111-bbbb-4bbb-8bbb-000000000001',
  'approved/main.jpg',
  'image/jpeg',
  'Approved main image',
  true
);
insert into public.event_ticket_offers (event_revision_id, price_type, currency, amount_minor)
values ('11111111-bbbb-4bbb-8bbb-000000000001', 'fixed', 'JPY', 3000);
insert into public.event_ticket_links (event_revision_id, kind, url)
values ('11111111-bbbb-4bbb-8bbb-000000000001', 'ticket', 'https://example.com/approved');
insert into public.event_links (event_revision_id, label, url)
values ('11111111-bbbb-4bbb-8bbb-000000000001', 'Approved link', 'https://example.com/approved-info');

update public.event_revisions
  set status = 'approved'
  where id = '11111111-bbbb-4bbb-8bbb-000000000001';
update public.events
  set published_revision_id = '11111111-bbbb-4bbb-8bbb-000000000001'
  where id = '11111111-aaaa-4aaa-8aaa-000000000001';

-- A second Revision of the same Event, submitted for review. Its content must
-- stay private while the previously approved Revision keeps being served.
insert into public.event_revisions (id, event_id, created_by, status, title, description, event_type)
values (
  '11111111-bbbb-4bbb-8bbb-000000000002',
  '11111111-aaaa-4aaa-8aaa-000000000001',
  '33333333-3333-4333-8333-333333333333',
  'draft',
  'In-review revision title',
  'In-review revision description',
  'performance'
);
insert into public.event_media (event_revision_id, object_key, content_type, alt_text, is_main)
values (
  '11111111-bbbb-4bbb-8bbb-000000000002',
  'in-review/main.jpg',
  'image/jpeg',
  'In-review main image',
  true
);
insert into public.event_schedules (event_revision_id, venue_id, starts_at)
values (
  '11111111-bbbb-4bbb-8bbb-000000000002',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '2030-05-01T10:00:00Z'
);
update public.event_revisions
  set status = 'in_review'
  where id = '11111111-bbbb-4bbb-8bbb-000000000002';

-- An Event that has never been published at all.
insert into public.events (id, owner_organization_id)
values ('11111111-aaaa-4aaa-8aaa-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.event_revisions (id, event_id, created_by, status, title, event_type)
values (
  '11111111-bbbb-4bbb-8bbb-000000000003',
  '11111111-aaaa-4aaa-8aaa-000000000002',
  '33333333-3333-4333-8333-333333333333',
  'draft',
  'Unpublished draft title',
  'performance'
);
insert into public.event_media (event_revision_id, object_key, content_type, alt_text, is_main)
values (
  '11111111-bbbb-4bbb-8bbb-000000000003',
  'draft/main.jpg',
  'image/jpeg',
  'Draft main image',
  true
);

set local role anon;

select is(
  (select count(*)::integer from public.events
    where id in (
      '11111111-aaaa-4aaa-8aaa-000000000001',
      '11111111-aaaa-4aaa-8aaa-000000000002'
    )),
  1,
  'a Visitor sees the published Event and not the unpublished one'
);
select is_empty(
  $$select id from public.events where id = '11111111-aaaa-4aaa-8aaa-000000000002'$$,
  'an Event with no approved Revision is invisible'
);

select is(
  (select count(*)::integer from public.event_revisions
    where event_id = '11111111-aaaa-4aaa-8aaa-000000000001'),
  1,
  'only the published Revision of a published Event is readable'
);
select is(
  (select title from public.event_revisions
    where event_id = '11111111-aaaa-4aaa-8aaa-000000000001'),
  'Approved revision title',
  'the Revision a Visitor reads is the approved one'
);
select is_empty(
  $$select id from public.event_revisions
      where id = '11111111-bbbb-4bbb-8bbb-000000000002'$$,
  'an in-review Revision is invisible while it is being reviewed'
);
select is_empty(
  $$select id from public.event_revisions
      where id = '11111111-bbbb-4bbb-8bbb-000000000003'$$,
  'a draft Revision of an unpublished Event is invisible'
);

select is(
  (select count(*)::integer from public.event_schedules where event_revision_id in (
      '11111111-bbbb-4bbb-8bbb-000000000001',
      '11111111-bbbb-4bbb-8bbb-000000000002',
      '11111111-bbbb-4bbb-8bbb-000000000003'
    )),
  1,
  'only Schedules of the approved Revision are readable'
);
select is(
  (select count(*)::integer from public.event_schedules
    where event_revision_id = '11111111-bbbb-4bbb-8bbb-000000000002'),
  0,
  'in-review Schedules do not leak the next set of dates'
);

select is(
  (select count(*)::integer from public.event_media where event_revision_id in (
      '11111111-bbbb-4bbb-8bbb-000000000001',
      '11111111-bbbb-4bbb-8bbb-000000000002',
      '11111111-bbbb-4bbb-8bbb-000000000003'
    )),
  1,
  'only media of the approved Revision are readable'
);
select is(
  (select object_key from public.event_media where event_revision_id in (
      '11111111-bbbb-4bbb-8bbb-000000000001',
      '11111111-bbbb-4bbb-8bbb-000000000002',
      '11111111-bbbb-4bbb-8bbb-000000000003'
    )),
  'approved/main.jpg',
  'an unapproved storage key is never disclosed'
);

select is(
  (select count(*)::integer from public.event_artists where event_revision_id in (
      '11111111-bbbb-4bbb-8bbb-000000000001',
      '11111111-bbbb-4bbb-8bbb-000000000002',
      '11111111-bbbb-4bbb-8bbb-000000000003'
    )),
  1,
  'only credits of the approved Revision are readable'
);
select is(
  (select count(*)::integer from public.event_ticket_offers where event_revision_id in (
      '11111111-bbbb-4bbb-8bbb-000000000001',
      '11111111-bbbb-4bbb-8bbb-000000000002',
      '11111111-bbbb-4bbb-8bbb-000000000003'
    )),
  1,
  'only Ticket Offers of the approved Revision are readable'
);
select is(
  (select count(*)::integer from public.event_ticket_links where event_revision_id in (
      '11111111-bbbb-4bbb-8bbb-000000000001',
      '11111111-bbbb-4bbb-8bbb-000000000002',
      '11111111-bbbb-4bbb-8bbb-000000000003'
    )),
  1,
  'only Ticket Links of the approved Revision are readable'
);
select is(
  (select count(*)::integer from public.event_links where event_revision_id in (
      '11111111-bbbb-4bbb-8bbb-000000000001',
      '11111111-bbbb-4bbb-8bbb-000000000002',
      '11111111-bbbb-4bbb-8bbb-000000000003'
    )),
  1,
  'only external links of the approved Revision are readable'
);

reset role;

select * from finish();
rollback;
