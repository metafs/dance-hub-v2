create type public.event_revision_status as enum ('draft', 'in_review', 'changes_requested', 'approved', 'superseded');
create type public.event_type as enum ('performance', 'open_studio', 'talk', 'workshop', 'audition', 'open_call', 'residency', 'festival', 'other');
create table public.events (
  id uuid primary key default gen_random_uuid(), owner_organization_id uuid not null references public.organizations (id),
  published_revision_id uuid, cancelled_at timestamptz, cancellation_reason text, created_at timestamptz not null default now()
);
create table public.event_revisions (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events (id) on delete cascade,
  created_by uuid not null references public.profiles (id), status public.event_revision_status not null default 'draft',
  title text not null, description text, event_type public.event_type, application_deadline timestamptz,
  proposed_parent_event_id uuid references public.events (id), created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid references public.profiles (id), decision_reason text
);
alter table public.events add constraint events_published_revision_fk foreign key (published_revision_id) references public.event_revisions (id) deferrable initially deferred;
create table public.event_schedules (
  id uuid primary key default gen_random_uuid(), event_revision_id uuid not null references public.event_revisions (id) on delete cascade,
  venue_id uuid not null references public.venues (id), starts_at timestamptz not null, ends_at timestamptz, all_day boolean not null default false,
  check (ends_at is null or ends_at > starts_at)
);
alter table public.events enable row level security;
alter table public.event_revisions enable row level security;
alter table public.event_schedules enable row level security;
create policy "members read organization events" on public.events for select using (exists (select 1 from public.organization_memberships m where m.organization_id = owner_organization_id and m.user_id = auth.uid()) or public.is_platform_admin());
create policy "members create organization events" on public.events for insert with check (exists (select 1 from public.organization_memberships m where m.organization_id = owner_organization_id and m.user_id = auth.uid()));
create policy "members read revisions" on public.event_revisions for select using (public.is_platform_admin() or exists (select 1 from public.events e join public.organization_memberships m on m.organization_id = e.owner_organization_id where e.id = event_id and m.user_id = auth.uid()));
create policy "members create revisions" on public.event_revisions for insert with check (exists (select 1 from public.events e join public.organization_memberships m on m.organization_id = e.owner_organization_id where e.id = event_id and m.user_id = auth.uid()));
create policy "members read schedules" on public.event_schedules for select using (exists (select 1 from public.event_revisions r join public.events e on e.id = r.event_id join public.organization_memberships m on m.organization_id = e.owner_organization_id where r.id = event_revision_id and m.user_id = auth.uid()) or public.is_platform_admin());
