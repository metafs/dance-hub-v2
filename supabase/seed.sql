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
