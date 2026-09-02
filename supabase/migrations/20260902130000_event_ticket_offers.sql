-- Ticket Offers describe Revision-owned prices. Ticket Links remain independent
-- external sales or registration destinations.

create type public.event_ticket_price_type as enum (
  'fixed',
  'free',
  'range',
  'donation',
  'pay_what_you_can',
  'sliding_scale',
  'dynamic',
  'included'
);

create table public.event_ticket_offers (
  id uuid primary key default gen_random_uuid(),
  event_revision_id uuid not null references public.event_revisions (id) on delete cascade,
  price_type public.event_ticket_price_type not null,
  label text check (label is null or char_length(trim(label)) between 1 and 120),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  amount_minor bigint check (amount_minor is null or amount_minor >= 0),
  min_amount_minor bigint check (min_amount_minor is null or min_amount_minor >= 0),
  max_amount_minor bigint check (max_amount_minor is null or max_amount_minor >= 0),
  notes text check (notes is null or char_length(trim(notes)) > 0),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (event_revision_id, display_order),
  check (
    (
      price_type = 'fixed'
      and currency is not null
      and amount_minor is not null
      and min_amount_minor is null
      and max_amount_minor is null
    )
    or (
      price_type in ('free', 'donation', 'dynamic', 'included')
      and currency is null
      and amount_minor is null
      and min_amount_minor is null
      and max_amount_minor is null
    )
    or (
      price_type = 'range'
      and currency is not null
      and amount_minor is null
      and min_amount_minor is not null
      and max_amount_minor is not null
      and min_amount_minor <= max_amount_minor
    )
    or (
      price_type = 'pay_what_you_can'
      and amount_minor is null
      and max_amount_minor is null
      and (
        (currency is null and min_amount_minor is null)
        or (currency is not null and min_amount_minor is not null)
      )
    )
    or (
      price_type = 'sliding_scale'
      and label is not null
      and currency is not null
      and amount_minor is not null
      and min_amount_minor is null
      and max_amount_minor is null
    )
  )
);

alter table public.event_ticket_offers enable row level security;

-- Public Event and EventRevision policies reference each other. This helper
-- evaluates the published pointer as the table owner, so the Ticket Offer
-- policy does not re-enter that RLS cycle.
create function public.is_current_published_event_revision(target_revision_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.events event
    join public.event_revisions revision
      on revision.id = event.published_revision_id
    where revision.id = target_revision_id
      and revision.status = 'approved'
  );
$$;

revoke all on function public.is_current_published_event_revision(uuid) from public;
grant execute on function public.is_current_published_event_revision(uuid) to anon, authenticated;

-- The two original public policies reference each other's RLS-protected table.
-- Rebuild them on the helper so public Event, Revision, and child-content
-- reads all use the same non-recursive published-pointer check.
drop policy "public reads published events" on public.events;
create policy "public reads published events"
  on public.events
  for select
  to anon, authenticated
  using (
    published_revision_id is not null
    and public.is_current_published_event_revision(published_revision_id)
  );

drop policy "public reads published revisions" on public.event_revisions;
create policy "public reads published revisions"
  on public.event_revisions
  for select
  to anon, authenticated
  using (
    status = 'approved'
    and public.is_current_published_event_revision(id)
  );

-- Older Event content migrations created several member-only policies without
-- an explicit role. PostgreSQL therefore also evaluates them for anon reads,
-- which makes a public query attempt to read the private membership table.
-- Restrict those predicates to authenticated users and make each public
-- content policy explicit about the PostgREST roles it serves.
alter policy "members read organization events"
  on public.events to authenticated;
alter policy "members read revisions"
  on public.event_revisions to authenticated;
alter policy "members read schedules"
  on public.event_schedules to authenticated;

alter policy "members and admins read event artists"
  on public.event_artists to authenticated;
alter policy "members create editable event artists"
  on public.event_artists to authenticated;
alter policy "members update editable event artists"
  on public.event_artists to authenticated;
alter policy "members delete editable event artists"
  on public.event_artists to authenticated;
alter policy "public reads published event artists"
  on public.event_artists to anon, authenticated;

alter policy "members and admins read event ticket links"
  on public.event_ticket_links to authenticated;
alter policy "members create editable event ticket links"
  on public.event_ticket_links to authenticated;
alter policy "members update editable event ticket links"
  on public.event_ticket_links to authenticated;
alter policy "members delete editable event ticket links"
  on public.event_ticket_links to authenticated;
alter policy "public reads published event ticket links"
  on public.event_ticket_links to anon, authenticated;

alter policy "members and admins read event links"
  on public.event_links to authenticated;
alter policy "members create editable event links"
  on public.event_links to authenticated;
alter policy "members update editable event links"
  on public.event_links to authenticated;
alter policy "members delete editable event links"
  on public.event_links to authenticated;
alter policy "public reads published event links"
  on public.event_links to anon, authenticated;

alter policy "members and admins read event media"
  on public.event_media to authenticated;
alter policy "members create editable event media"
  on public.event_media to authenticated;
alter policy "members update editable event media"
  on public.event_media to authenticated;
alter policy "members delete editable event media"
  on public.event_media to authenticated;
alter policy "public reads published event media"
  on public.event_media to anon, authenticated;

alter policy "platform admins read event content audit"
  on public.event_content_audit_log to authenticated;

create policy "members and admins read event ticket offers"
on public.event_ticket_offers for select
to authenticated
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where revision.id = event_ticket_offers.event_revision_id
      and membership.user_id = auth.uid()
  )
);

create policy "public reads published event ticket offers"
on public.event_ticket_offers for select
to anon, authenticated
using (
  public.is_current_published_event_revision(event_ticket_offers.event_revision_id)
);

create policy "members create editable event ticket offers"
on public.event_ticket_offers for insert
to authenticated
with check (
  exists (
    select 1
    from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where revision.id = event_ticket_offers.event_revision_id
      and revision.status in ('draft', 'changes_requested')
      and event.cancelled_at is null
      and membership.user_id = auth.uid()
  )
);

create policy "members update editable event ticket offers"
on public.event_ticket_offers for update
to authenticated
using (
  exists (
    select 1
    from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where revision.id = event_ticket_offers.event_revision_id
      and revision.status in ('draft', 'changes_requested')
      and event.cancelled_at is null
      and membership.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where revision.id = event_ticket_offers.event_revision_id
      and revision.status in ('draft', 'changes_requested')
      and event.cancelled_at is null
      and membership.user_id = auth.uid()
  )
);

create policy "members delete editable event ticket offers"
on public.event_ticket_offers for delete
to authenticated
using (
  exists (
    select 1
    from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where revision.id = event_ticket_offers.event_revision_id
      and revision.status in ('draft', 'changes_requested')
      and event.cancelled_at is null
      and membership.user_id = auth.uid()
  )
);

create trigger guard_mutable_event_ticket_offer
before insert or update or delete on public.event_ticket_offers
for each row execute function public.assert_event_revision_content_editable();

revoke all on table public.event_ticket_offers from public, anon, authenticated;
grant select on table public.event_ticket_offers to anon, authenticated;
grant insert (
  event_revision_id, price_type, label, currency, amount_minor,
  min_amount_minor, max_amount_minor, notes, display_order
) on public.event_ticket_offers to authenticated;
grant update (
  price_type, label, currency, amount_minor,
  min_amount_minor, max_amount_minor, notes, display_order
) on public.event_ticket_offers to authenticated;
grant delete on table public.event_ticket_offers to authenticated;

create or replace function public.assert_event_revision_reviewable(target_revision_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  revision public.event_revisions;
  parent_event public.events;
  proposed_parent public.events;
  main_image_count integer;
begin
  select * into revision
  from public.event_revisions
  where id = target_revision_id;

  if not found then
    raise exception 'event revision not found';
  end if;

  select * into parent_event
  from public.events
  where id = revision.event_id;

  if parent_event.cancelled_at is not null then
    raise exception 'cancelled events cannot publish revisions';
  end if;

  if revision.title is null or char_length(trim(revision.title)) = 0 then
    raise exception 'title is required for review';
  end if;

  if revision.description is null or char_length(trim(revision.description)) = 0 then
    raise exception 'description is required for review';
  end if;

  if revision.event_type is null then
    raise exception 'event type is required for review';
  end if;

  if not exists (
    select 1
    from public.event_artists artist_credit
    where artist_credit.event_revision_id = revision.id
  ) then
    raise exception 'at least one artist credit is required for review';
  end if;

  if not revision.no_registration_required
    and not exists (
      select 1
      from public.event_ticket_offers offer
      where offer.event_revision_id = revision.id
    )
    and not exists (
      select 1
      from public.event_ticket_links access_link
      where access_link.event_revision_id = revision.id
    )
  then
    raise exception 'a ticket offer, ticket link, or no-registration value is required for review';
  end if;

  select count(*)
    into main_image_count
  from public.event_media media
  where media.event_revision_id = revision.id
    and media.is_main
    and char_length(trim(media.alt_text)) > 0;

  if main_image_count <> 1 then
    raise exception 'exactly one main image with alt text is required for review';
  end if;

  if revision.event_type in ('audition', 'open_call', 'residency') then
    if revision.application_deadline is null then
      raise exception 'application deadline is required for apply events';
    end if;
  elsif revision.event_type <> 'festival' and not exists (
    select 1
    from public.event_schedules schedule
    where schedule.event_revision_id = revision.id
  ) then
    raise exception 'a schedule is required for non-apply events';
  end if;

  if revision.event_type = 'festival' then
    if revision.proposed_parent_event_id is not null then
      raise exception 'a festival revision cannot propose a parent';
    end if;

    if not exists (
      select 1
      from public.events child_event
      join public.event_revisions child_revision
        on child_revision.id = child_event.published_revision_id
      join public.event_schedules child_schedule
        on child_schedule.event_revision_id = child_revision.id
      where child_event.parent_event_id = revision.event_id
        and child_event.cancelled_at is null
        and child_revision.status = 'approved'
    ) then
      raise exception 'a festival requires an approved child event with a schedule';
    end if;
  elsif exists (
    select 1
    from public.events child_event
    where child_event.parent_event_id = revision.event_id
  ) then
    raise exception 'an event with children must have event type festival';
  end if;

  if revision.proposed_parent_event_id is not null then
    select proposed.* into proposed_parent
    from public.events proposed
    where proposed.id = revision.proposed_parent_event_id;

    if not found then
      raise exception 'proposed festival parent does not exist';
    end if;

    if proposed_parent.owner_organization_id <> parent_event.owner_organization_id then
      raise exception 'proposed festival parent and child must share an organization';
    end if;

    if proposed_parent.parent_event_id is not null then
      raise exception 'festival nesting is limited to one level';
    end if;

    if proposed_parent.cancelled_at is not null then
      raise exception 'proposed festival parent is cancelled';
    end if;

    if proposed_parent.published_revision_id is not null then
      if not exists (
        select 1
        from public.event_revisions proposed_parent_revision
        where proposed_parent_revision.id = proposed_parent.published_revision_id
          and proposed_parent_revision.status = 'approved'
          and proposed_parent_revision.event_type = 'festival'
      ) then
        raise exception 'proposed parent must be a published festival';
      end if;
    elsif not exists (
      select 1
      from public.event_revisions proposed_parent_revision
      where proposed_parent_revision.event_id = proposed_parent.id
        and proposed_parent_revision.status in (
          'draft',
          'in_review',
          'changes_requested'
        )
        and proposed_parent_revision.event_type = 'festival'
    ) then
      raise exception 'unpublished proposed parent must have a festival revision';
    end if;
  end if;
end;
$$;

revoke all on function public.assert_event_revision_reviewable(uuid) from public;

create or replace function public.create_event_revision_draft(target_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_event public.events;
  source_revision public.event_revisions;
  next_revision_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select event.* into target_event
  from public.events event
  where event.id = target_event_id
  for update;

  if not found or target_event.cancelled_at is not null then
    raise exception 'active event not found';
  end if;

  if not exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_event.owner_organization_id
      and membership.user_id = auth.uid()
  ) then
    raise exception 'organization membership required';
  end if;

  select revision.* into source_revision
  from public.event_revisions revision
  where revision.id = target_event.published_revision_id
    and revision.event_id = target_event.id
    and revision.status = 'approved';

  if not found then
    raise exception 'published revision not found';
  end if;

  if exists (
    select 1
    from public.event_revisions revision
    where revision.event_id = target_event.id
      and revision.status in ('draft', 'in_review', 'changes_requested')
  ) then
    raise exception 'an open event revision already exists';
  end if;

  insert into public.event_revisions (
    event_id, created_by, status, title, description, event_type,
    application_deadline, proposed_parent_event_id, no_registration_required
  ) values (
    target_event.id, auth.uid(), 'draft', source_revision.title,
    source_revision.description, source_revision.event_type,
    source_revision.application_deadline, target_event.parent_event_id,
    source_revision.no_registration_required
  ) returning id into next_revision_id;

  insert into public.event_schedules (event_revision_id, venue_id, starts_at, ends_at, all_day)
  select next_revision_id, venue_id, starts_at, ends_at, all_day
  from public.event_schedules
  where event_revision_id = source_revision.id;

  insert into public.event_artists (event_revision_id, artist_id, role, display_order)
  select next_revision_id, artist_id, role, display_order
  from public.event_artists
  where event_revision_id = source_revision.id;

  insert into public.event_ticket_offers (
    event_revision_id, price_type, label, currency, amount_minor,
    min_amount_minor, max_amount_minor, notes, display_order
  )
  select next_revision_id, price_type, label, currency, amount_minor,
    min_amount_minor, max_amount_minor, notes, display_order
  from public.event_ticket_offers
  where event_revision_id = source_revision.id;

  insert into public.event_ticket_links (event_revision_id, kind, label, url, display_order)
  select next_revision_id, kind, label, url, display_order
  from public.event_ticket_links
  where event_revision_id = source_revision.id;

  insert into public.event_links (event_revision_id, label, url, display_order)
  select next_revision_id, label, url, display_order
  from public.event_links
  where event_revision_id = source_revision.id;

  insert into public.event_media (
    event_revision_id, object_key, content_type, alt_text, is_main, display_order
  )
  select next_revision_id, object_key, content_type, alt_text, is_main, display_order
  from public.event_media
  where event_revision_id = source_revision.id;

  return next_revision_id;
end;
$$;

revoke all on function public.create_event_revision_draft(uuid) from public;
grant execute on function public.create_event_revision_draft(uuid) to authenticated;

comment on table public.event_ticket_offers is
  'Structured Event Revision pricing, independent from external ticket and registration links.';
