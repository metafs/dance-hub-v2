create type public.candidate_status as enum ('pending', 'activated', 'rejected', 'merged');
create type public.artist_type as enum ('individual', 'company', 'collective', 'other');

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  artist_type public.artist_type not null,
  profile text, website_url text, created_at timestamptz not null default now()
);
create table public.artist_candidates (
  id uuid primary key default gen_random_uuid(), creator_organization_id uuid not null references public.organizations (id),
  name text not null, artist_type public.artist_type not null, profile text, website_url text,
  status public.candidate_status not null default 'pending', canonical_artist_id uuid references public.artists (id),
  reviewed_by uuid references public.profiles (id), reviewed_at timestamptz, decision_reason text,
  created_at timestamptz not null default now()
);
create table public.venue_candidates (
  id uuid primary key default gen_random_uuid(), creator_organization_id uuid not null references public.organizations (id),
  name text not null, prefecture public.prefecture_code not null, address_line1 text not null, address_line2 text, latitude numeric(9,6), longitude numeric(9,6), website_url text,
  status public.candidate_status not null default 'pending', canonical_venue_id uuid references public.venues (id),
  reviewed_by uuid references public.profiles (id), reviewed_at timestamptz, decision_reason text,
  created_at timestamptz not null default now(), check ((latitude is null) = (longitude is null))
);
alter table public.artists enable row level security;
alter table public.artist_candidates enable row level security;
alter table public.venue_candidates enable row level security;
create policy "public reads artists" on public.artists for select using (true);
create policy "members create artist candidates" on public.artist_candidates for insert with check (exists (select 1 from public.organization_memberships m where m.organization_id = creator_organization_id and m.user_id = auth.uid()));
create policy "creator org and admins read artist candidates" on public.artist_candidates for select using (public.is_platform_admin() or exists (select 1 from public.organization_memberships m where m.organization_id = creator_organization_id and m.user_id = auth.uid()));
create policy "creator edits pending artist candidates" on public.artist_candidates for update using (status = 'pending' and exists (select 1 from public.organization_memberships m where m.organization_id = creator_organization_id and m.user_id = auth.uid())) with check (status = 'pending');
create policy "members create venue candidates" on public.venue_candidates for insert with check (exists (select 1 from public.organization_memberships m where m.organization_id = creator_organization_id and m.user_id = auth.uid()));
create policy "creator org and admins read venue candidates" on public.venue_candidates for select using (public.is_platform_admin() or exists (select 1 from public.organization_memberships m where m.organization_id = creator_organization_id and m.user_id = auth.uid()));
create policy "creator edits pending venue candidates" on public.venue_candidates for update using (status = 'pending' and exists (select 1 from public.organization_memberships m where m.organization_id = creator_organization_id and m.user_id = auth.uid())) with check (status = 'pending');
