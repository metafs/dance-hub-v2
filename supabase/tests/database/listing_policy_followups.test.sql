-- The listing-policy follow-ups are enforced below the UI: a valid image-free
-- Event can enter review, a second main image cannot, and proxy listings never
-- accept copied media (REQ-EVENT-008, REQ-MEDIA-001, C-8, B-7).
begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

select ok(
  not has_table_privilege('anon', 'public.listing_requests', 'select, insert, update, delete'),
  'anonymous users cannot bypass Turnstile by reading or writing the request queue'
);
select ok(
  not has_table_privilege('authenticated', 'public.listing_requests', 'insert'),
  'authenticated users cannot bypass the server-side Turnstile gate either'
);

insert into public.events (id, owner_organization_id)
values ('12121212-aaaa-4aaa-8aaa-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.event_revisions (id, event_id, created_by, status, title, description, event_type, contact_kind, contact_value, no_registration_required)
values ('12121212-bbbb-4bbb-8bbb-000000000001', '12121212-aaaa-4aaa-8aaa-000000000001', '33333333-3333-4333-8333-333333333333', 'draft', '画像なしの公演', '画像がなくても公開できる', 'performance', 'website', 'https://example.com/contact', true);
insert into public.event_schedules (event_revision_id, venue_id, starts_at)
values ('12121212-bbbb-4bbb-8bbb-000000000001', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', now() + interval '8 days');

select lives_ok(
  $$select public.assert_event_revision_reviewable('12121212-bbbb-4bbb-8bbb-000000000001')$$,
  'an image-free Event with a contact method is reviewable'
);
select is(
  (select count(*)::integer from public.event_media where event_revision_id = '12121212-bbbb-4bbb-8bbb-000000000001'),
  0,
  'the image-free Event has no media row'
);

insert into public.event_media (event_revision_id, object_key, content_type, alt_text, is_main)
values ('12121212-bbbb-4bbb-8bbb-000000000001', 'events/optional-main.jpg', 'image/jpeg', '任意画像', true);
select throws_ok(
  $$insert into public.event_media (event_revision_id, object_key, content_type, alt_text, is_main) values ('12121212-bbbb-4bbb-8bbb-000000000001', 'events/second-main.jpg', 'image/jpeg', '二枚目', true)$$,
  '23505', null,
  'a Revision cannot hold more than one main image'
);

insert into public.events (id, owner_organization_id, listing_origin)
values ('12121212-aaaa-4aaa-8aaa-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'proxy');
insert into public.event_revisions (id, event_id, created_by, status, title)
values ('12121212-bbbb-4bbb-8bbb-000000000002', '12121212-aaaa-4aaa-8aaa-000000000002', '33333333-3333-4333-8333-333333333333', 'draft', '代理入力の公演');
select throws_ok(
  $$insert into public.event_media (event_revision_id, object_key, content_type, alt_text, is_main) values ('12121212-bbbb-4bbb-8bbb-000000000002', 'events/proxy.jpg', 'image/jpeg', '転記してはいけない画像', true)$$,
  'P0001', null,
  'a proxy Event cannot receive an image'
);
select throws_ok(
  $$update public.event_schedules set starts_at = now() + interval '6 days' where event_revision_id = '12121212-bbbb-4bbb-8bbb-000000000001'; select public.assert_event_revision_reviewable('12121212-bbbb-4bbb-8bbb-000000000001')$$,
  'P0001', 'physical events must be submitted at least 7 Tokyo calendar days before the first schedule',
  'a physical Event inside the seven-day window is not reviewable'
);

select * from finish();
rollback;
