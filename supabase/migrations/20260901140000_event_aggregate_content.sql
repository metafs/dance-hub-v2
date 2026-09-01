create type public.event_access_link_kind as enum ('ticket', 'registration');

alter table public.event_revisions
  add column no_registration_required boolean not null default false,
  add constraint event_revisions_event_and_id_unique unique (event_id, id),
  add constraint event_revisions_parent_is_not_self
    check (proposed_parent_event_id is null or proposed_parent_event_id <> event_id);

alter table public.events
  add column parent_event_id uuid references public.events (id),
  add constraint events_parent_is_not_self
    check (parent_event_id is null or parent_event_id <> id),
  add constraint events_published_revision_belongs_to_event
    foreign key (id, published_revision_id)
    references public.event_revisions (event_id, id)
    deferrable initially deferred;

create index events_parent_event_id_idx
  on public.events (parent_event_id)
  where parent_event_id is not null;

create table public.event_artists (
  id uuid primary key default gen_random_uuid(),
  event_revision_id uuid not null references public.event_revisions (id) on delete cascade,
  artist_id uuid not null references public.artists (id),
  role text not null check (char_length(trim(role)) between 1 and 120),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (event_revision_id, artist_id, role),
  unique (event_revision_id, display_order)
);

create table public.event_ticket_links (
  id uuid primary key default gen_random_uuid(),
  event_revision_id uuid not null references public.event_revisions (id) on delete cascade,
  kind public.event_access_link_kind not null,
  label text check (label is null or char_length(trim(label)) between 1 and 120),
  url text not null check (
    char_length(trim(url)) between 1 and 2048
    and trim(url) ~* '^https?://'
  ),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (event_revision_id, display_order)
);

create table public.event_links (
  id uuid primary key default gen_random_uuid(),
  event_revision_id uuid not null references public.event_revisions (id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 120),
  url text not null check (
    char_length(trim(url)) between 1 and 2048
    and trim(url) ~* '^https?://'
  ),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (event_revision_id, display_order)
);

create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_revision_id uuid not null references public.event_revisions (id) on delete cascade,
  object_key text not null check (char_length(trim(object_key)) between 1 and 1024),
  content_type text not null check (
    char_length(trim(content_type)) between 1 and 255
    and lower(trim(content_type)) like 'image/%'
  ),
  alt_text text not null check (char_length(trim(alt_text)) between 1 and 500),
  is_main boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (event_revision_id, object_key),
  unique (event_revision_id, display_order)
);

create unique index event_media_one_main_per_revision_idx
  on public.event_media (event_revision_id)
  where is_main;

create table public.event_content_audit_log (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id),
  event_revision_id uuid references public.event_revisions (id),
  actor_id uuid references public.profiles (id),
  action text not null check (char_length(trim(action)) between 1 and 120),
  reason text,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (event_id, event_revision_id)
    references public.event_revisions (event_id, id)
);

create index event_content_audit_log_event_created_at_idx
  on public.event_content_audit_log (event_id, created_at desc);

create function public.validate_festival_event_relation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_organization_id uuid;
  parent_parent_event_id uuid;
  parent_type public.event_type;
  child_type public.event_type;
begin
  if new.parent_event_id is null then
    return new;
  end if;

  select owner_organization_id, parent_event_id
    into parent_organization_id, parent_parent_event_id
    from public.events
    where id = new.parent_event_id;

  if parent_organization_id is null then
    raise exception 'festival parent does not exist';
  end if;

  if parent_organization_id <> new.owner_organization_id then
    raise exception 'festival parent and child must share an organization';
  end if;

  if parent_parent_event_id is not null then
    raise exception 'festival nesting is limited to one level';
  end if;

  if exists (
    select 1 from public.events child where child.parent_event_id = new.id
  ) then
    raise exception 'an event with children cannot have a parent';
  end if;

  select revision.event_type
    into parent_type
    from public.events event
    join public.event_revisions revision on revision.id = event.published_revision_id
    where event.id = new.parent_event_id;

  if parent_type is not null and parent_type <> 'festival' then
    raise exception 'festival parent must have event type festival';
  end if;

  select revision.event_type
    into child_type
    from public.event_revisions revision
    where revision.id = new.published_revision_id;

  if child_type = 'festival' then
    raise exception 'a festival event cannot have a parent';
  end if;

  return new;
end;
$$;

create function public.validate_festival_parent_children()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  published_type public.event_type;
begin
  if not exists (
    select 1 from public.events child where child.parent_event_id = new.id
  ) then
    return new;
  end if;

  if new.parent_event_id is not null then
    raise exception 'an event with children cannot have a parent';
  end if;

  select revision.event_type
    into published_type
    from public.event_revisions revision
    where revision.id = new.published_revision_id;

  if published_type is not null and published_type <> 'festival' then
    raise exception 'an event with children must have event type festival';
  end if;

  return new;
end;
$$;

create constraint trigger validate_festival_event_relation_trigger
after insert or update
on public.events
deferrable initially deferred
for each row execute function public.validate_festival_event_relation();

create constraint trigger validate_festival_parent_children_trigger
after insert or update
on public.events
deferrable initially deferred
for each row execute function public.validate_festival_parent_children();

create function public.validate_proposed_festival_parent()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  child_organization_id uuid;
  parent_organization_id uuid;
  parent_parent_event_id uuid;
  parent_type public.event_type;
begin
  if new.proposed_parent_event_id is null then
    return new;
  end if;

  if new.event_type = 'festival' then
    raise exception 'a festival revision cannot propose a parent';
  end if;

  select owner_organization_id
    into child_organization_id
    from public.events
    where id = new.event_id;

  select owner_organization_id, parent_event_id
    into parent_organization_id, parent_parent_event_id
    from public.events
    where id = new.proposed_parent_event_id;

  if parent_organization_id is null then
    raise exception 'proposed festival parent does not exist';
  end if;

  if parent_organization_id <> child_organization_id then
    raise exception 'proposed festival parent and child must share an organization';
  end if;

  if parent_parent_event_id is not null then
    raise exception 'festival nesting is limited to one level';
  end if;

  if exists (
    select 1 from public.events child where child.parent_event_id = new.event_id
  ) then
    raise exception 'an event with children cannot propose a parent';
  end if;

  select revision.event_type
    into parent_type
    from public.events event
    join public.event_revisions revision on revision.id = event.published_revision_id
    where event.id = new.proposed_parent_event_id;

  if parent_type is not null and parent_type <> 'festival' then
    raise exception 'proposed parent must have event type festival';
  end if;

  return new;
end;
$$;

create trigger validate_proposed_festival_parent_trigger
before insert or update of event_id, event_type, proposed_parent_event_id
on public.event_revisions
for each row execute function public.validate_proposed_festival_parent();

create function public.audit_festival_parent_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_event_id is not distinct from old.parent_event_id then
    return new;
  end if;

  insert into public.event_content_audit_log (
    event_id,
    event_revision_id,
    actor_id,
    action,
    details
  ) values (
    new.id,
    new.published_revision_id,
    auth.uid(),
    'festival_parent_changed',
    jsonb_build_object(
      'previous_parent_event_id', old.parent_event_id,
      'parent_event_id', new.parent_event_id
    )
  );

  return new;
end;
$$;

create trigger audit_festival_parent_change_trigger
after update of parent_event_id on public.events
for each row execute function public.audit_festival_parent_change();

alter table public.event_artists enable row level security;
alter table public.event_ticket_links enable row level security;
alter table public.event_links enable row level security;
alter table public.event_media enable row level security;
alter table public.event_content_audit_log enable row level security;

create policy "members and admins read event artists"
on public.event_artists for select
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where revision.id = event_revision_id
      and membership.user_id = auth.uid()
  )
);

create policy "public reads published event artists"
on public.event_artists for select
using (
  exists (
    select 1 from public.events event
    where event.published_revision_id = event_revision_id
  )
);

create policy "members and admins read event ticket links"
on public.event_ticket_links for select
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where revision.id = event_revision_id
      and membership.user_id = auth.uid()
  )
);

create policy "public reads published event ticket links"
on public.event_ticket_links for select
using (
  exists (
    select 1 from public.events event
    where event.published_revision_id = event_revision_id
  )
);

create policy "members and admins read event links"
on public.event_links for select
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where revision.id = event_revision_id
      and membership.user_id = auth.uid()
  )
);

create policy "public reads published event links"
on public.event_links for select
using (
  exists (
    select 1 from public.events event
    where event.published_revision_id = event_revision_id
  )
);

create policy "members and admins read event media"
on public.event_media for select
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where revision.id = event_revision_id
      and membership.user_id = auth.uid()
  )
);

create policy "public reads published event media"
on public.event_media for select
using (
  exists (
    select 1 from public.events event
    where event.published_revision_id = event_revision_id
  )
);

create policy "platform admins read event content audit"
on public.event_content_audit_log for select
using (public.is_platform_admin());

revoke all on function public.audit_festival_parent_change() from public;
