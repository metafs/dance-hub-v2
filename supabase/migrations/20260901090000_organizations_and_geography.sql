create type public.organization_role as enum ('owner', 'admin', 'editor');
create type public.application_status as enum ('submitted', 'approved', 'rejected');
create type public.prefecture_code as enum ('TOKYO', 'KANAGAWA');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.organization_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles (id),
  name text not null check (char_length(trim(name)) between 1 and 160),
  website_url text,
  status public.application_status not null default 'submitted',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  check ((status = 'submitted' and reviewed_by is null and reviewed_at is null) or status <> 'submitted')
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  website_url text,
  created_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.organization_role not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.platform_admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  prefecture public.prefecture_code not null,
  address_line1 text not null,
  address_line2 text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  website_url text,
  created_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null)),
  check (latitude between -90 and 90),
  check (longitude between -180 and 180)
);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.profiles (id) values (new.id); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create function public.is_platform_admin(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.platform_admins where user_id = check_user) $$;

alter table public.profiles enable row level security;
alter table public.organization_applications enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.platform_admins enable row level security;
alter table public.venues enable row level security;

create policy "users read their profile" on public.profiles for select using (id = auth.uid());
create policy "users create their profile" on public.profiles for insert with check (id = auth.uid());
create policy "applicants submit applications" on public.organization_applications for insert with check (applicant_id = auth.uid() and status = 'submitted');
create policy "applicants read own applications" on public.organization_applications for select using (applicant_id = auth.uid() or public.is_platform_admin());
create policy "admins review applications" on public.organization_applications for update using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "members read organizations" on public.organizations for select using (exists (select 1 from public.organization_memberships m where m.organization_id = id and m.user_id = auth.uid()) or public.is_platform_admin());
create policy "members read memberships" on public.organization_memberships for select using (user_id = auth.uid() or public.is_platform_admin() or exists (select 1 from public.organization_memberships mine where mine.organization_id = organization_memberships.organization_id and mine.user_id = auth.uid()));
create policy "admins manage platform admins" on public.platform_admins for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "public reads venues" on public.venues for select using (true);

create function public.approve_organization_application(application_id uuid, decision_reason text default null)
returns uuid language plpgsql security definer set search_path = public
as $$
declare application public.organization_applications; organization_id uuid;
begin
  if not public.is_platform_admin() then raise exception 'platform admin required'; end if;
  select * into application from public.organization_applications where id = application_id for update;
  if not found or application.status <> 'submitted' then raise exception 'application is not reviewable'; end if;
  insert into public.organizations (name, website_url) values (application.name, application.website_url) returning id into organization_id;
  insert into public.organization_memberships (organization_id, user_id, role) values (organization_id, application.applicant_id, 'owner');
  update public.organization_applications set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), decision_reason = approve_organization_application.decision_reason where id = application_id;
  return organization_id;
end;
$$;
revoke all on function public.approve_organization_application(uuid, text) from public;
grant execute on function public.approve_organization_application(uuid, text) to authenticated;
