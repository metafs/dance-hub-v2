-- Understood as: make Event publication and cancellation reachable only through
-- audited trusted transitions, while keeping unapproved revisions private.

create type public.event_cancellation_status as enum (
  'in_review',
  'changes_requested',
  'approved'
);

create type public.event_review_action as enum (
  'revision_submitted',
  'revision_changes_requested',
  'revision_approved',
  'revision_superseded',
  'cancellation_requested',
  'cancellation_resubmitted',
  'cancellation_changes_requested',
  'cancellation_approved'
);

create table public.event_cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  requested_reason text not null check (char_length(trim(requested_reason)) between 1 and 2000),
  status public.event_cancellation_status not null default 'in_review',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'in_review' and reviewed_by is null and reviewed_at is null and decision_reason is null)
    or
    (status <> 'in_review' and reviewed_by is not null and reviewed_at is not null)
  )
);

create unique index event_cancellation_requests_one_open_per_event
  on public.event_cancellation_requests (event_id)
  where status in ('in_review', 'changes_requested');

create table public.event_revision_audit_log (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  event_revision_id uuid references public.event_revisions (id) on delete set null,
  cancellation_request_id uuid references public.event_cancellation_requests (id) on delete set null,
  action public.event_review_action not null,
  actor_id uuid not null references public.profiles (id),
  from_status text,
  to_status text not null,
  reason text,
  created_at timestamptz not null default now(),
  check (event_revision_id is not null or cancellation_request_id is not null)
);

alter table public.event_cancellation_requests enable row level security;
alter table public.event_revision_audit_log enable row level security;

-- Members may create only ordinary draft identities. Publication and cancellation
-- columns remain writable only by the trusted functions below.
drop policy "members create organization events" on public.events;
create policy "members create organization events"
  on public.events
  for insert
  to authenticated
  with check (
    published_revision_id is null
    and cancelled_at is null
    and cancellation_reason is null
    and exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id = owner_organization_id
        and membership.user_id = auth.uid()
    )
  );

-- Public readers can see only stable Events that point at an approved Revision.
create policy "public reads published events"
  on public.events
  for select
  to anon, authenticated
  using (
    published_revision_id is not null
    and exists (
      select 1
      from public.event_revisions revision
      where revision.id = published_revision_id
        and revision.event_id = events.id
        and revision.status = 'approved'
    )
  );

drop policy "members create revisions" on public.event_revisions;
create policy "members create draft revisions"
  on public.event_revisions
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and status = 'draft'
    and reviewed_at is null
    and reviewed_by is null
    and decision_reason is null
    and exists (
      select 1
      from public.events event
      join public.organization_memberships membership
        on membership.organization_id = event.owner_organization_id
      where event.id = event_id
        and event.cancelled_at is null
        and membership.user_id = auth.uid()
    )
  );

create policy "members edit mutable revisions"
  on public.event_revisions
  for update
  to authenticated
  using (
    status in ('draft', 'changes_requested')
    and exists (
      select 1
      from public.events event
      join public.organization_memberships membership
        on membership.organization_id = event.owner_organization_id
      where event.id = event_id
        and event.cancelled_at is null
        and membership.user_id = auth.uid()
    )
  )
  with check (
    status in ('draft', 'changes_requested')
    and exists (
      select 1
      from public.events event
      join public.organization_memberships membership
        on membership.organization_id = event.owner_organization_id
      where event.id = event_id
        and event.cancelled_at is null
        and membership.user_id = auth.uid()
    )
  );

create policy "public reads published revisions"
  on public.event_revisions
  for select
  to anon, authenticated
  using (
    status = 'approved'
    and exists (
      select 1
      from public.events event
      where event.id = event_id
        and event.published_revision_id = event_revisions.id
    )
  );

create policy "members create schedules for mutable revisions"
  on public.event_schedules
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.event_revisions revision
      join public.events event on event.id = revision.event_id
      join public.organization_memberships membership
        on membership.organization_id = event.owner_organization_id
      where revision.id = event_revision_id
        and revision.status in ('draft', 'changes_requested')
        and event.cancelled_at is null
        and membership.user_id = auth.uid()
    )
  );

create policy "members edit schedules for mutable revisions"
  on public.event_schedules
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.event_revisions revision
      join public.events event on event.id = revision.event_id
      join public.organization_memberships membership
        on membership.organization_id = event.owner_organization_id
      where revision.id = event_revision_id
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
      where revision.id = event_revision_id
        and revision.status in ('draft', 'changes_requested')
        and event.cancelled_at is null
        and membership.user_id = auth.uid()
    )
  );

create policy "members delete schedules from mutable revisions"
  on public.event_schedules
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.event_revisions revision
      join public.events event on event.id = revision.event_id
      join public.organization_memberships membership
        on membership.organization_id = event.owner_organization_id
      where revision.id = event_revision_id
        and revision.status in ('draft', 'changes_requested')
        and event.cancelled_at is null
        and membership.user_id = auth.uid()
    )
  );

create policy "public reads published schedules"
  on public.event_schedules
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.event_revisions revision
      join public.events event on event.id = revision.event_id
      where revision.id = event_revision_id
        and revision.status = 'approved'
        and event.published_revision_id = revision.id
    )
  );

create policy "members read cancellation requests"
  on public.event_cancellation_requests
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.events event
      join public.organization_memberships membership
        on membership.organization_id = event.owner_organization_id
      where event.id = event_id
        and membership.user_id = auth.uid()
    )
  );

create policy "members read event audit"
  on public.event_revision_audit_log
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.events event
      join public.organization_memberships membership
        on membership.organization_id = event.owner_organization_id
      where event.id = event_id
        and membership.user_id = auth.uid()
    )
  );

-- Column grants make immutable identity and workflow fields unreachable through
-- ordinary PostgREST updates even when a row satisfies its RLS policy.
revoke insert, update, delete on public.events, public.event_revisions,
  public.event_schedules, public.event_artists, public.event_ticket_links,
  public.event_links, public.event_media, public.event_cancellation_requests,
  public.event_revision_audit_log from public, anon;

revoke insert, update, delete on public.events from authenticated;
grant insert (owner_organization_id) on public.events to authenticated;

revoke insert, update, delete on public.event_revisions from authenticated;
grant insert (
  event_id,
  created_by,
  title,
  description,
  event_type,
  application_deadline,
  proposed_parent_event_id,
  no_registration_required
) on public.event_revisions to authenticated;
grant update (
  title,
  description,
  event_type,
  application_deadline,
  proposed_parent_event_id,
  no_registration_required
) on public.event_revisions to authenticated;

grant select on public.events, public.event_revisions, public.event_schedules
  to anon, authenticated;
grant insert, update, delete on public.event_schedules to authenticated;
revoke insert, update, delete on public.event_artists, public.event_ticket_links,
  public.event_links, public.event_media from authenticated;
grant insert (event_revision_id, artist_id, role, display_order)
  on public.event_artists to authenticated;
grant update (artist_id, role, display_order)
  on public.event_artists to authenticated;
grant delete on public.event_artists to authenticated;
grant insert (event_revision_id, kind, label, url, display_order)
  on public.event_ticket_links to authenticated;
grant update (kind, label, url, display_order)
  on public.event_ticket_links to authenticated;
grant delete on public.event_ticket_links to authenticated;
grant insert (event_revision_id, label, url, display_order)
  on public.event_links to authenticated;
grant update (label, url, display_order)
  on public.event_links to authenticated;
grant delete on public.event_links to authenticated;
grant insert (
  event_revision_id,
  object_key,
  content_type,
  alt_text,
  is_main,
  display_order
) on public.event_media to authenticated;
grant update (object_key, content_type, alt_text, is_main, display_order)
  on public.event_media to authenticated;
grant delete on public.event_media to authenticated;
grant select on public.event_cancellation_requests, public.event_revision_audit_log
  to authenticated;
revoke insert, update, delete on public.event_cancellation_requests from authenticated;
revoke insert, update, delete on public.event_revision_audit_log from authenticated;

create or replace function public.assert_event_revision_content_editable()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_revision_id uuid;
  target_event_id uuid;
  target_status public.event_revision_status;
  target_cancelled_at timestamptz;
begin
  if tg_op = 'DELETE' then
    target_revision_id := old.event_revision_id;
  else
    target_revision_id := new.event_revision_id;
  end if;

  if tg_op = 'UPDATE'
    and old.event_revision_id is distinct from new.event_revision_id
  then
    raise exception 'event revision content cannot be moved between revisions';
  end if;

  select revision.event_id, revision.status
    into target_event_id, target_status
  from public.event_revisions revision
  where revision.id = target_revision_id
  for update;

  if not found and tg_op = 'DELETE' then
    return old;
  elsif not found then
    raise exception 'event revision not found';
  end if;

  select event.cancelled_at
    into target_cancelled_at
  from public.events event
  where event.id = target_event_id
  for update;

  if not found and tg_op = 'DELETE' then
    return old;
  elsif not found then
    raise exception 'event not found';
  end if;

  if target_status not in ('draft', 'changes_requested') then
    raise exception 'event revision content is immutable in status %', target_status;
  end if;

  if target_cancelled_at is not null then
    raise exception 'cancelled event content is immutable';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.assert_event_revision_content_editable() from public;

create trigger guard_mutable_event_schedule
before insert or update or delete on public.event_schedules
for each row execute function public.assert_event_revision_content_editable();

create function public.validate_published_festival_after_child_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  affected_parent_id uuid;
  current_parent_id uuid;
begin
  if tg_op <> 'DELETE' then
    current_parent_id := new.parent_event_id;
  end if;

  for affected_parent_id in
    select distinct candidate.parent_id
    from unnest(array[
      old.parent_event_id,
      current_parent_id
    ]) as candidate(parent_id)
    where candidate.parent_id is not null
    order by candidate.parent_id
  loop
    perform 1
    from public.events parent_event
    where parent_event.id = affected_parent_id
    for update;

    if exists (
      select 1
      from public.events parent_event
      join public.event_revisions parent_revision
        on parent_revision.id = parent_event.published_revision_id
      where parent_event.id = affected_parent_id
        and parent_event.cancelled_at is null
        and parent_revision.status = 'approved'
        and parent_revision.event_type = 'festival'
    ) and not exists (
      select 1
      from public.events child_event
      join public.event_revisions child_revision
        on child_revision.id = child_event.published_revision_id
      join public.event_schedules child_schedule
        on child_schedule.event_revision_id = child_revision.id
      where child_event.parent_event_id = affected_parent_id
        and child_event.cancelled_at is null
        and child_revision.status = 'approved'
    ) then
      raise exception 'a published festival must retain an approved child event with a schedule';
    end if;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_published_festival_after_child_change()
  from public;

create constraint trigger validate_published_festival_after_child_update
after update of parent_event_id, published_revision_id, cancelled_at on public.events
deferrable initially deferred
for each row execute function public.validate_published_festival_after_child_change();

create constraint trigger validate_published_festival_after_child_delete
after delete on public.events
deferrable initially deferred
for each row execute function public.validate_published_festival_after_child_change();

create function public.validate_festival_parent_has_type_source()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_event_id uuid;
  target_event public.events;
begin
  target_event_id := old.event_id;

  select event.* into target_event
  from public.events event
  where event.id = target_event_id
  for update;

  if not found then
    return old;
  end if;

  if not exists (
    select 1
    from public.events child_event
    where child_event.parent_event_id = target_event.id
  ) then
    return old;
  end if;

  if exists (
    select 1
    from public.event_revisions published_revision
    where published_revision.id = target_event.published_revision_id
      and published_revision.status = 'approved'
      and published_revision.event_type = 'festival'
  ) then
    return old;
  end if;

  if exists (
    select 1
    from public.event_revisions candidate_revision
    where candidate_revision.event_id = target_event.id
      and candidate_revision.status in ('draft', 'in_review', 'changes_requested')
      and candidate_revision.event_type = 'festival'
  ) then
    return old;
  end if;

  raise exception 'an event with children must retain a festival revision';
end;
$$;

revoke all on function public.validate_festival_parent_has_type_source()
  from public;

create constraint trigger validate_festival_parent_revision_update
after update of event_type, status on public.event_revisions
deferrable initially deferred
for each row execute function public.validate_festival_parent_has_type_source();

create constraint trigger validate_festival_parent_revision_delete
after delete on public.event_revisions
deferrable initially deferred
for each row execute function public.validate_festival_parent_has_type_source();

create function public.assert_event_revision_reviewable(target_revision_id uuid)
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

  if not revision.no_registration_required and not exists (
    select 1
    from public.event_ticket_links access_link
    where access_link.event_revision_id = revision.id
  ) then
    raise exception 'a ticket or registration link is required for review';
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

comment on function public.assert_event_revision_reviewable(uuid) is
  'Validates the complete MVP publication contract for an Event Revision.';

revoke all on function public.assert_event_revision_reviewable(uuid) from public;

create function public.submit_event_revision(target_revision_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  revision public.event_revisions;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select candidate.* into revision
  from public.event_revisions candidate
  where candidate.id = target_revision_id
  for update;

  if not found then
    raise exception 'event revision not found';
  end if;

  if revision.status not in ('draft', 'changes_requested') then
    raise exception 'event revision is not submittable';
  end if;

  if not exists (
    select 1
    from public.events event
    join public.organization_memberships membership
      on membership.organization_id = event.owner_organization_id
    where event.id = revision.event_id
      and membership.user_id = auth.uid()
  ) then
    raise exception 'organization membership required';
  end if;

  perform public.assert_event_revision_reviewable(revision.id);

  update public.event_revisions
  set status = 'in_review',
      reviewed_by = null,
      reviewed_at = null,
      decision_reason = null
  where id = revision.id;

  insert into public.event_revision_audit_log (
    event_id,
    event_revision_id,
    action,
    actor_id,
    from_status,
    to_status
  ) values (
    revision.event_id,
    revision.id,
    'revision_submitted',
    auth.uid(),
    revision.status::text,
    'in_review'
  );
end;
$$;

create function public.request_event_revision_changes(
  target_revision_id uuid,
  review_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  revision public.event_revisions;
begin
  if not public.is_platform_admin() then
    raise exception 'platform admin required';
  end if;

  if review_reason is null or char_length(trim(review_reason)) = 0 then
    raise exception 'review reason is required';
  end if;

  select candidate.* into revision
  from public.event_revisions candidate
  where candidate.id = target_revision_id
  for update;

  if not found or revision.status <> 'in_review' then
    raise exception 'event revision is not reviewable';
  end if;

  update public.event_revisions
  set status = 'changes_requested',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      decision_reason = trim(review_reason)
  where id = revision.id;

  insert into public.event_revision_audit_log (
    event_id,
    event_revision_id,
    action,
    actor_id,
    from_status,
    to_status,
    reason
  ) values (
    revision.event_id,
    revision.id,
    'revision_changes_requested',
    auth.uid(),
    'in_review',
    'changes_requested',
    trim(review_reason)
  );
end;
$$;

create function public.approve_event_revision(
  target_revision_id uuid,
  review_reason text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  revision public.event_revisions;
  parent_event public.events;
  previous_revision_id uuid;
  superseded_count integer;
begin
  if not public.is_platform_admin() then
    raise exception 'platform admin required';
  end if;

  select candidate.* into revision
  from public.event_revisions candidate
  where candidate.id = target_revision_id
  for update;

  if not found or revision.status <> 'in_review' then
    raise exception 'event revision is not reviewable';
  end if;

  select event.* into parent_event
  from public.events event
  where event.id = revision.event_id
  for update;

  if not found then
    raise exception 'event not found';
  end if;

  perform 1
  from public.events related_event
  where related_event.id in (
    parent_event.parent_event_id,
    revision.proposed_parent_event_id
  )
  order by related_event.id
  for update;

  perform public.assert_event_revision_reviewable(revision.id);
  previous_revision_id := parent_event.published_revision_id;

  if previous_revision_id is not null then
    update public.event_revisions
    set status = 'superseded'
    where id = previous_revision_id
      and status = 'approved';

    get diagnostics superseded_count = row_count;

    if superseded_count = 1 then
      insert into public.event_revision_audit_log (
        event_id,
        event_revision_id,
        action,
        actor_id,
        from_status,
        to_status,
        reason
      ) values (
        revision.event_id,
        previous_revision_id,
        'revision_superseded',
        auth.uid(),
        'approved',
        'superseded',
        nullif(trim(review_reason), '')
      );
    else
      raise exception 'published revision is not approved';
    end if;
  end if;

  update public.event_revisions
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      decision_reason = nullif(trim(review_reason), '')
  where id = revision.id;

  update public.events
  set published_revision_id = revision.id,
      parent_event_id = revision.proposed_parent_event_id
  where id = revision.event_id;

  insert into public.event_revision_audit_log (
    event_id,
    event_revision_id,
    action,
    actor_id,
    from_status,
    to_status,
    reason
  ) values (
    revision.event_id,
    revision.id,
    'revision_approved',
    auth.uid(),
    'in_review',
    'approved',
    nullif(trim(review_reason), '')
  );
end;
$$;

create function public.request_event_cancellation(
  target_event_id uuid,
  requested_reason text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_event public.events;
  request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if requested_reason is null or char_length(trim(requested_reason)) = 0 then
    raise exception 'cancellation reason is required';
  end if;

  select event.* into target_event
  from public.events event
  where event.id = target_event_id
  for update;

  if not found or target_event.published_revision_id is null then
    raise exception 'only published events can be cancelled';
  end if;

  if target_event.cancelled_at is not null then
    raise exception 'event is already cancelled';
  end if;

  if not exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_event.owner_organization_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  ) then
    raise exception 'owner or admin membership required';
  end if;

  insert into public.event_cancellation_requests (
    event_id,
    requested_by,
    requested_reason
  ) values (
    target_event.id,
    auth.uid(),
    trim(requested_reason)
  ) returning id into request_id;

  insert into public.event_revision_audit_log (
    event_id,
    cancellation_request_id,
    action,
    actor_id,
    from_status,
    to_status,
    reason
  ) values (
    target_event.id,
    request_id,
    'cancellation_requested',
    auth.uid(),
    null,
    'in_review',
    trim(requested_reason)
  );

  return request_id;
end;
$$;

create function public.request_event_cancellation_changes(
  target_request_id uuid,
  review_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  cancellation_request public.event_cancellation_requests;
begin
  if not public.is_platform_admin() then
    raise exception 'platform admin required';
  end if;

  if review_reason is null or char_length(trim(review_reason)) = 0 then
    raise exception 'review reason is required';
  end if;

  select request.* into cancellation_request
  from public.event_cancellation_requests request
  where request.id = target_request_id
  for update;

  if not found or cancellation_request.status <> 'in_review' then
    raise exception 'cancellation request is not reviewable';
  end if;

  update public.event_cancellation_requests
  set status = 'changes_requested',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      decision_reason = trim(review_reason),
      updated_at = now()
  where id = cancellation_request.id;

  insert into public.event_revision_audit_log (
    event_id,
    cancellation_request_id,
    action,
    actor_id,
    from_status,
    to_status,
    reason
  ) values (
    cancellation_request.event_id,
    cancellation_request.id,
    'cancellation_changes_requested',
    auth.uid(),
    'in_review',
    'changes_requested',
    trim(review_reason)
  );
end;
$$;

create function public.resubmit_event_cancellation_request(
  target_request_id uuid,
  requested_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  cancellation_request public.event_cancellation_requests;
  target_event public.events;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if requested_reason is null or char_length(trim(requested_reason)) = 0 then
    raise exception 'cancellation reason is required';
  end if;

  select request.* into cancellation_request
  from public.event_cancellation_requests request
  where request.id = target_request_id
  for update;

  if not found or cancellation_request.status <> 'changes_requested' then
    raise exception 'cancellation request is not resubmittable';
  end if;

  select event.* into target_event
  from public.events event
  where event.id = cancellation_request.event_id
  for update;

  if target_event.cancelled_at is not null then
    raise exception 'event is already cancelled';
  end if;

  if not exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_event.owner_organization_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  ) then
    raise exception 'owner or admin membership required';
  end if;

  update public.event_cancellation_requests
  set requested_reason = trim(requested_reason),
      status = 'in_review',
      reviewed_by = null,
      reviewed_at = null,
      decision_reason = null,
      updated_at = now()
  where id = cancellation_request.id;

  insert into public.event_revision_audit_log (
    event_id,
    cancellation_request_id,
    action,
    actor_id,
    from_status,
    to_status,
    reason
  ) values (
    cancellation_request.event_id,
    cancellation_request.id,
    'cancellation_resubmitted',
    auth.uid(),
    'changes_requested',
    'in_review',
    trim(requested_reason)
  );
end;
$$;

create function public.approve_event_cancellation(
  target_request_id uuid,
  public_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  cancellation_request public.event_cancellation_requests;
  target_event public.events;
begin
  if not public.is_platform_admin() then
    raise exception 'platform admin required';
  end if;

  if public_reason is null or char_length(trim(public_reason)) = 0 then
    raise exception 'public cancellation reason is required';
  end if;

  select request.* into cancellation_request
  from public.event_cancellation_requests request
  where request.id = target_request_id
  for update;

  if not found or cancellation_request.status <> 'in_review' then
    raise exception 'cancellation request is not reviewable';
  end if;

  select event.* into target_event
  from public.events event
  where event.id = cancellation_request.event_id
  for update;

  if target_event.cancelled_at is not null then
    raise exception 'event is already cancelled';
  end if;

  update public.events
  set cancelled_at = now(),
      cancellation_reason = trim(public_reason)
  where id = target_event.id;

  update public.event_cancellation_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      decision_reason = trim(public_reason),
      updated_at = now()
  where id = cancellation_request.id;

  insert into public.event_revision_audit_log (
    event_id,
    cancellation_request_id,
    action,
    actor_id,
    from_status,
    to_status,
    reason
  ) values (
    cancellation_request.event_id,
    cancellation_request.id,
    'cancellation_approved',
    auth.uid(),
    'in_review',
    'approved',
    trim(public_reason)
  );
end;
$$;

revoke all on function public.submit_event_revision(uuid) from public;
revoke all on function public.request_event_revision_changes(uuid, text) from public;
revoke all on function public.approve_event_revision(uuid, text) from public;
revoke all on function public.request_event_cancellation(uuid, text) from public;
revoke all on function public.request_event_cancellation_changes(uuid, text) from public;
revoke all on function public.resubmit_event_cancellation_request(uuid, text) from public;
revoke all on function public.approve_event_cancellation(uuid, text) from public;

grant execute on function public.submit_event_revision(uuid) to authenticated;
grant execute on function public.request_event_revision_changes(uuid, text) to authenticated;
grant execute on function public.approve_event_revision(uuid, text) to authenticated;
grant execute on function public.request_event_cancellation(uuid, text) to authenticated;
grant execute on function public.request_event_cancellation_changes(uuid, text) to authenticated;
grant execute on function public.resubmit_event_cancellation_request(uuid, text) to authenticated;
grant execute on function public.approve_event_cancellation(uuid, text) to authenticated;
