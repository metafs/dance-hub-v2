-- Understood as: persist review outcomes in a first-party inbox for the user
-- who submitted the reviewed application, revision, or cancellation request.
-- Audit-log triggers keep notification creation in the trusted transition's
-- transaction and prevent application code from forging moderation outcomes.

create type public.review_notification_kind as enum (
  'organization_application_approved',
  'organization_application_rejected',
  'event_revision_approved',
  'event_revision_changes_requested',
  'event_cancellation_approved',
  'event_cancellation_changes_requested'
);

create table public.review_notifications (
  id bigint generated always as identity primary key,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.review_notification_kind not null,
  subject text not null check (char_length(trim(subject)) between 1 and 200),
  decision_reason text,
  organization_application_id uuid references public.organization_applications (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  event_revision_id uuid references public.event_revisions (id) on delete set null,
  cancellation_request_id uuid references public.event_cancellation_requests (id) on delete set null,
  organization_audit_log_id bigint unique references public.organization_audit_log (id) on delete set null,
  event_revision_audit_log_id bigint unique references public.event_revision_audit_log (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (num_nonnulls(organization_audit_log_id, event_revision_audit_log_id) = 1),
  check (
    (kind in ('organization_application_approved', 'organization_application_rejected')
      and organization_application_id is not null)
    or
    (kind in ('event_revision_approved', 'event_revision_changes_requested')
      and event_id is not null and event_revision_id is not null)
    or
    (kind in ('event_cancellation_approved', 'event_cancellation_changes_requested')
      and event_id is not null and cancellation_request_id is not null)
  )
);

create index review_notifications_recipient_created_idx
  on public.review_notifications (recipient_user_id, created_at desc, id desc);

create index review_notifications_recipient_unread_idx
  on public.review_notifications (recipient_user_id, created_at desc)
  where read_at is null;

alter table public.review_notifications enable row level security;

create policy "users read own review notifications"
  on public.review_notifications for select to authenticated
  using (recipient_user_id = auth.uid());

create policy "users update own review notification read state"
  on public.review_notifications for update to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

revoke all on table public.review_notifications from public, anon, authenticated;
grant select on table public.review_notifications to authenticated;
grant update (read_at) on table public.review_notifications to authenticated;

create function public.guard_review_notification_content()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.id is distinct from old.id
    or new.recipient_user_id is distinct from old.recipient_user_id
    or new.kind is distinct from old.kind
    or new.subject is distinct from old.subject
    or new.decision_reason is distinct from old.decision_reason
    or new.organization_application_id is distinct from old.organization_application_id
    or new.event_id is distinct from old.event_id
    or new.event_revision_id is distinct from old.event_revision_id
    or new.cancellation_request_id is distinct from old.cancellation_request_id
    or new.organization_audit_log_id is distinct from old.organization_audit_log_id
    or new.event_revision_audit_log_id is distinct from old.event_revision_audit_log_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'review notification content is immutable';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_review_notification_content() from public;

create trigger guard_review_notification_content_trigger
before update on public.review_notifications
for each row execute function public.guard_review_notification_content();

create function public.notify_organization_application_outcome()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  application public.organization_applications;
begin
  if new.action not in ('application_approved', 'application_rejected') then
    return new;
  end if;

  select candidate.* into application
  from public.organization_applications candidate
  where candidate.id = new.application_id;

  if not found then
    raise exception 'reviewed organization application not found';
  end if;

  insert into public.review_notifications (
    recipient_user_id,
    kind,
    subject,
    decision_reason,
    organization_application_id,
    organization_audit_log_id
  ) values (
    application.applicant_id,
    case new.action
      when 'application_approved' then 'organization_application_approved'::public.review_notification_kind
      else 'organization_application_rejected'::public.review_notification_kind
    end,
    application.name,
    new.reason,
    application.id,
    new.id
  );

  return new;
end;
$$;

revoke all on function public.notify_organization_application_outcome() from public;

create trigger notify_organization_application_outcome_trigger
after insert on public.organization_audit_log
for each row execute function public.notify_organization_application_outcome();

create function public.notify_event_review_outcome()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  recipient_id uuid;
  notification_kind public.review_notification_kind;
  notification_subject text;
begin
  if new.action in ('revision_approved', 'revision_changes_requested') then
    select submission.actor_id
      into recipient_id
    from public.event_revision_audit_log submission
    where submission.event_revision_id = new.event_revision_id
      and submission.action = 'revision_submitted'
      and submission.id < new.id
    order by submission.id desc
    limit 1;

    select revision.title
      into notification_subject
    from public.event_revisions revision
    where revision.id = new.event_revision_id;

    notification_kind := case new.action
      when 'revision_approved' then 'event_revision_approved'::public.review_notification_kind
      else 'event_revision_changes_requested'::public.review_notification_kind
    end;
  elsif new.action in ('cancellation_approved', 'cancellation_changes_requested') then
    select request.requested_by, revision.title
      into recipient_id, notification_subject
    from public.event_cancellation_requests request
    join public.events event on event.id = request.event_id
    join public.event_revisions revision on revision.id = event.published_revision_id
    where request.id = new.cancellation_request_id;

    notification_kind := case new.action
      when 'cancellation_approved' then 'event_cancellation_approved'::public.review_notification_kind
      else 'event_cancellation_changes_requested'::public.review_notification_kind
    end;
  else
    return new;
  end if;

  if recipient_id is null or notification_subject is null then
    raise exception 'review outcome notification recipient or subject not found';
  end if;

  insert into public.review_notifications (
    recipient_user_id,
    kind,
    subject,
    decision_reason,
    event_id,
    event_revision_id,
    cancellation_request_id,
    event_revision_audit_log_id
  ) values (
    recipient_id,
    notification_kind,
    notification_subject,
    new.reason,
    new.event_id,
    new.event_revision_id,
    new.cancellation_request_id,
    new.id
  );

  return new;
end;
$$;

revoke all on function public.notify_event_review_outcome() from public;

create trigger notify_event_review_outcome_trigger
after insert on public.event_revision_audit_log
for each row execute function public.notify_event_review_outcome();

comment on table public.review_notifications is
  'Immutable in-app review outcomes. Only read_at is mutable by the recipient.';
