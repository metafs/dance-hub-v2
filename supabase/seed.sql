-- PR3 introduces the domain schema and development fixtures.
-- Deterministic M2 identities. Local and CI only.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'applicant@example.com', crypt('DanceHub123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'admin@example.com', crypt('DanceHub123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'owner@example.com', crypt('DanceHub123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'editor@example.com', crypt('DanceHub123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
  ,('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'other@example.com', crypt('DanceHub123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '{"sub":"11111111-1111-4111-8111-111111111111","email":"applicant@example.com"}', 'email', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '{"sub":"22222222-2222-4222-8222-222222222222","email":"admin@example.com"}', 'email', now(), now(), now()),
  ('33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '{"sub":"33333333-3333-4333-8333-333333333333","email":"owner@example.com"}', 'email', now(), now(), now()),
  ('44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', '{"sub":"44444444-4444-4444-8444-444444444444","email":"editor@example.com"}', 'email', now(), now(), now())
  ,('55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', '{"sub":"55555555-5555-4555-8555-555555555555","email":"other@example.com"}', 'email', now(), now(), now())
on conflict (provider, provider_id) do nothing;

insert into public.profiles (id)
values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222'),
  ('33333333-3333-4333-8333-333333333333'),
  ('44444444-4444-4444-8444-444444444444')
  ,('55555555-5555-4555-8555-555555555555')
on conflict (id) do nothing;

insert into public.platform_admins (user_id)
values ('22222222-2222-4222-8222-222222222222')
on conflict (user_id) do nothing;

insert into public.organizations (id, name, website_url)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Fixture Dance Organization', 'https://example.com')
on conflict (id) do nothing;

insert into public.organizations (id, name, website_url)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Other Dance Organization', 'https://other.example.com')
on conflict (id) do nothing;

insert into public.organization_memberships (organization_id, user_id, role)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'owner'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '44444444-4444-4444-8444-444444444444', 'editor')
  ,('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '55555555-5555-4555-8555-555555555555', 'owner')
on conflict (organization_id, user_id) do nothing;

-- Canonical content used to exercise the Event aggregate flow locally and in CI.
insert into public.artists (id, name, artist_type)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Fixture Dance Artist', 'individual')
on conflict (id) do nothing;

insert into public.venues (id, name, prefecture, address_line1)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Fixture Dance Venue', 'TOKYO', '東京都渋谷区 fixture 1-1')
on conflict (id) do nothing;

-- Published Event fixtures for the anonymous discovery journey. M1.3 asks the
-- deterministic seed to cover both Prefectures, `apply`, and Festival; these add
-- the published side of that, which the earlier fixtures did not have.
--
-- These rows are written directly rather than through the review workflow, so
-- they do not exercise the submission gate — tests/e2e/m4-event-review.spec.ts
-- covers that path. They carry no event_media for the same reason: nothing has
-- been uploaded to the bucket, and a row would point at an object that is not
-- there.
insert into public.venues (id, name, prefecture, address_line1)
values ('dddd0002-dddd-4ddd-8ddd-dddddddddddd', 'Fixture Kanagawa Venue', 'KANAGAWA', '神奈川県横浜市 fixture 2-2')
on conflict (id) do nothing;

insert into public.artists (id, name, artist_type)
values ('cccc0002-cccc-4ccc-8ccc-cccccccccccc', 'Fixture Dance Collective', 'collective')
on conflict (id) do nothing;

insert into public.events (id, owner_organization_id, cancelled_at, cancellation_reason)
values
  ('e0000001-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, null),
  ('e0000002-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, null),
  ('e0000003-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, null),
  ('e0000004-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, null),
  ('e0000005-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, null),
  ('e0000006-0000-4000-8000-000000000006', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '2030-01-10T00:00:00Z', '会場の都合により中止します。')
on conflict (id) do nothing;

insert into public.event_revisions (
  id, event_id, created_by, status, title, description, event_type,
  application_deadline, no_registration_required
)
values
  ('e0000001-0000-4000-8000-0000000000a1', 'e0000001-0000-4000-8000-000000000001',
   '33333333-3333-4333-8333-333333333333', 'approved',
   'フィクスチャ 複数会場公演', '東京と神奈川の2会場で上演します。', 'performance', null, false),
  ('e0000002-0000-4000-8000-0000000000a2', 'e0000002-0000-4000-8000-000000000002',
   '33333333-3333-4333-8333-333333333333', 'approved',
   'フィクスチャ 公募', '開催日未定の公募です。', 'open_call', '2030-06-30T14:59:00Z', true),
  ('e0000003-0000-4000-8000-0000000000a3', 'e0000003-0000-4000-8000-000000000003',
   '33333333-3333-4333-8333-333333333333', 'approved',
   'フィクスチャ フェスティバル', '子Eventから会期を導出します。', 'festival', null, true),
  ('e0000004-0000-4000-8000-0000000000a4', 'e0000004-0000-4000-8000-000000000004',
   '33333333-3333-4333-8333-333333333333', 'approved',
   'フィクスチャ フェスティバル参加公演', 'フェスティバルのプログラムです。', 'performance', null, true),
  ('e0000005-0000-4000-8000-0000000000a5', 'e0000005-0000-4000-8000-000000000005',
   '33333333-3333-4333-8333-333333333333', 'approved',
   'フィクスチャ 過去公演', '終了したEventもアーカイブとして公開し続けます。', 'performance', null, true),
  ('e0000006-0000-4000-8000-0000000000a6', 'e0000006-0000-4000-8000-000000000006',
   '33333333-3333-4333-8333-333333333333', 'approved',
   'フィクスチャ 中止公演', '中止したEventも公開し続けます。', 'performance', null, true)
on conflict (id) do nothing;

-- REQ-DISCOVERY-002: an Event with Schedules in both Prefectures appears once in
-- each region filter. REQ-EVENT-003: an `apply` Event may publish with none.
insert into public.event_schedules (event_revision_id, venue_id, starts_at, ends_at)
values
  ('e0000001-0000-4000-8000-0000000000a1', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
   '2030-05-01T10:00:00Z', '2030-05-01T12:00:00Z'),
  ('e0000001-0000-4000-8000-0000000000a1', 'dddd0002-dddd-4ddd-8ddd-dddddddddddd',
   '2030-05-08T10:00:00Z', '2030-05-08T12:00:00Z'),
  ('e0000004-0000-4000-8000-0000000000a4', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
   '2030-07-03T10:00:00Z', '2030-07-03T12:00:00Z'),
  ('e0000005-0000-4000-8000-0000000000a5', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
   '2020-03-01T10:00:00Z', '2020-03-01T12:00:00Z'),
  ('e0000006-0000-4000-8000-0000000000a6', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
   '2030-09-01T10:00:00Z', '2030-09-01T12:00:00Z')
on conflict do nothing;

insert into public.event_artists (event_revision_id, artist_id, role)
values
  ('e0000001-0000-4000-8000-0000000000a1', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '振付・出演'),
  ('e0000004-0000-4000-8000-0000000000a4', 'cccc0002-cccc-4ccc-8ccc-cccccccccccc', '出演')
on conflict do nothing;

insert into public.event_ticket_offers (event_revision_id, price_type, label, currency, amount_minor)
values ('e0000001-0000-4000-8000-0000000000a1', 'fixed', '一般', 'JPY', 3500)
on conflict do nothing;

-- ADR-0009: a Festival is a one-level parent whose child belongs to the same
-- Organization. The parent pointer is set after both Events exist.
update public.events
  set parent_event_id = 'e0000003-0000-4000-8000-000000000003'
  where id = 'e0000004-0000-4000-8000-000000000004';

update public.events e
  set published_revision_id = r.id
  from public.event_revisions r
  where r.event_id = e.id
    and e.id in (
      'e0000001-0000-4000-8000-000000000001',
      'e0000002-0000-4000-8000-000000000002',
      'e0000003-0000-4000-8000-000000000003',
      'e0000004-0000-4000-8000-000000000004',
      'e0000005-0000-4000-8000-000000000005',
      'e0000006-0000-4000-8000-000000000006'
    );
