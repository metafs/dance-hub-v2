-- ADR-0018 defined three publication states and left the migration to a later
-- change. This is that change: `withdrawn` becomes a real state instead of a
-- documented promise.
--
-- Until now a takedown meant clearing events.published_revision_id by hand, and
-- approve_event_revision sets that column unconditionally, so the next approval
-- silently put the Event back on the public surface. A separate column cannot be
-- overwritten by the review workflow, which is the point.

alter table public.events
  add column withdrawn_at timestamptz,
  add column withdrawal_reason text,
  add column withdrawn_by uuid references public.profiles (id),
  add constraint events_withdrawal_reason_present check (
    (withdrawn_at is null and withdrawal_reason is null and withdrawn_by is null)
    or (withdrawn_at is not null and char_length(trim(withdrawal_reason)) > 0)
  );

comment on column public.events.withdrawn_at is
  'Set when the Event is removed from every public surface under listing-policy F. The record is retained: ADR-0018 keeps the approval history and the statistical population.';

-- Every public read path already funnels through this helper, so excluding
-- withdrawn Events here hides the Event, its Revision, and all of its child
-- content in one place. A policy added later inherits the rule for free.
create or replace function public.is_current_published_event_revision(target_revision_id uuid)
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
      and event.withdrawn_at is null
  );
$$;

-- listing-policy F is answered by a Platform Admin, not by the Organization, so
-- these are admin-only. Both demand a reason for the same reason every other
-- moderation function does: the decision has to be explainable later.
alter type public.event_review_action add value if not exists 'event_withdrawn';
alter type public.event_review_action add value if not exists 'event_restored';

create function public.withdraw_event(target_event_id uuid, withdrawal_reason text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_event public.events;
begin
  if not public.is_platform_admin() then
    raise exception 'platform admin required';
  end if;

  if withdrawal_reason is null or char_length(trim(withdrawal_reason)) = 0 then
    raise exception 'withdrawal reason is required';
  end if;

  select event.* into target_event
  from public.events event
  where event.id = target_event_id
  for update;

  if not found then
    raise exception 'event not found';
  end if;

  if target_event.withdrawn_at is not null then
    raise exception 'event is already withdrawn';
  end if;

  update public.events
  set withdrawn_at = now(),
      withdrawal_reason = trim(withdraw_event.withdrawal_reason),
      withdrawn_by = auth.uid()
  where id = target_event.id;

  -- The reason is internal. Unlike a cancellation, nothing about a withdrawal
  -- is shown to the public: the Event simply stops being reachable.
  insert into public.event_revision_audit_log (
    event_id,
    event_revision_id,
    cancellation_request_id,
    action,
    actor_id,
    from_status,
    to_status,
    reason
  ) values (
    target_event.id,
    target_event.published_revision_id,
    null,
    'event_withdrawn',
    auth.uid(),
    'published',
    'withdrawn',
    trim(withdraw_event.withdrawal_reason)
  );
end;
$$;

-- A withdrawal answers a request from outside, so it can be made in error or on
-- a claim that is later dropped. Without this, undoing one means direct SQL,
-- which is the state ADR-0018 set out to end.
create function public.restore_event(target_event_id uuid, restoration_reason text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_event public.events;
begin
  if not public.is_platform_admin() then
    raise exception 'platform admin required';
  end if;

  if restoration_reason is null or char_length(trim(restoration_reason)) = 0 then
    raise exception 'restoration reason is required';
  end if;

  select event.* into target_event
  from public.events event
  where event.id = target_event_id
  for update;

  if not found then
    raise exception 'event not found';
  end if;

  if target_event.withdrawn_at is null then
    raise exception 'event is not withdrawn';
  end if;

  update public.events
  set withdrawn_at = null,
      withdrawal_reason = null,
      withdrawn_by = null
  where id = target_event.id;

  insert into public.event_revision_audit_log (
    event_id,
    event_revision_id,
    cancellation_request_id,
    action,
    actor_id,
    from_status,
    to_status,
    reason
  ) values (
    target_event.id,
    target_event.published_revision_id,
    null,
    'event_restored',
    auth.uid(),
    'withdrawn',
    'published',
    trim(restore_event.restoration_reason)
  );
end;
$$;

revoke all on function public.withdraw_event(uuid, text) from public;
revoke all on function public.restore_event(uuid, text) from public;
grant execute on function public.withdraw_event(uuid, text) to authenticated;
grant execute on function public.restore_event(uuid, text) to authenticated;

-- Approving or submitting a Revision for a withdrawn Event would write a
-- published pointer nobody can see and quietly contradict the decision. A
-- trigger enforces this wherever the status changes, rather than inside any one
-- review function.
create function public.assert_event_not_withdrawn()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.status in ('in_review', 'approved')
    and old.status is distinct from new.status
    and exists (
      select 1 from public.events event
      where event.id = new.event_id and event.withdrawn_at is not null
    )
  then
    raise exception 'a withdrawn event cannot publish revisions';
  end if;

  return new;
end;
$$;

revoke all on function public.assert_event_not_withdrawn() from public;

create trigger assert_event_not_withdrawn_trigger
before update of status on public.event_revisions
for each row execute function public.assert_event_not_withdrawn();

-- Note for whoever needs it: withdrawing the only child of a published Festival
-- leaves that Festival with an empty programme.
-- validate_published_festival_after_child_change is not extended to withdrawal
-- on purpose, because listing-policy F-1 undertakes to honour an Organizer's
-- request whatever the reason, and a Festival constraint must not override that.
-- Whether the parent should then be withdrawn too is a product question that
-- ADR-0018 does not answer.
