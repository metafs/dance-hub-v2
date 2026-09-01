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
  proposed_parent_event_id
) on public.event_revisions to authenticated;
grant update (
  title,
  description,
  event_type,
  application_deadline,
  proposed_parent_event_id
) on public.event_revisions to authenticated;

grant select on public.events, public.event_revisions, public.event_schedules
  to anon, authenticated;
grant insert, update, delete on public.event_schedules to authenticated;
grant select on public.event_cancellation_requests, public.event_revision_audit_log
  to authenticated;
revoke insert, update, delete on public.event_cancellation_requests from authenticated;
revoke insert, update, delete on public.event_revision_audit_log from authenticated;

create function public.assert_event_revision_reviewable(target_revision_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  revision public.event_revisions;
  parent_event public.events;
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
end;
$$;

comment on function public.assert_event_revision_reviewable(uuid) is
  'Validates review fields present in the base Event Revision schema. Later aggregate migrations must extend this function with credits, ticket/participation, media, and Festival-child validation.';

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

  perform public.assert_event_revision_reviewable(revision.id);
  previous_revision_id := parent_event.published_revision_id;

  if previous_revision_id is not null then
    update public.event_revisions
    set status = 'superseded'
    where id = previous_revision_id
      and status = 'approved';

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
  end if;

  update public.event_revisions
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      decision_reason = nullif(trim(review_reason), '')
  where id = revision.id;

  update public.events
  set published_revision_id = revision.id
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
