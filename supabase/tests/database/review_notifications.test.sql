begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to anon, authenticated;
do $$
declare
  assertion_function record;
begin
  for assertion_function in
    select procedure.oid::regprocedure as signature
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_depend dependency
      on dependency.classid = 'pg_catalog.pg_proc'::regclass
      and dependency.objid = procedure.oid
      and dependency.deptype = 'e'
    join pg_catalog.pg_extension extension
      on extension.oid = dependency.refobjid
    where extension.extname = 'pgtap'
  loop
    execute format('grant execute on function %s to anon, authenticated', assertion_function.signature);
  end loop;
end;
$$;

select plan(22);

select has_type('public', 'review_notification_kind', 'review notification kind exists');
select has_table('public', 'review_notifications', 'review notification inbox exists');
select has_trigger(
  'public',
  'organization_audit_log',
  'notify_organization_application_outcome_trigger',
  'organization decisions create notifications from their audit record'
);
select has_trigger(
  'public',
  'event_revision_audit_log',
  'notify_event_review_outcome_trigger',
  'event decisions create notifications from their audit record'
);
select has_trigger(
  'public',
  'review_notifications',
  'guard_review_notification_content_trigger',
  'notification content has an immutability guard'
);

insert into public.organization_applications (id, applicant_id, name)
values (
  '99999999-9999-4999-8999-999999999991',
  '11111111-1111-4111-8111-111111111111',
  'Notification Test Organization'
);

insert into public.organization_audit_log (
  application_id, target_user_id, actor_id, action, reason
) values (
  '99999999-9999-4999-8999-999999999991',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'application_rejected',
  'Please provide a verifiable website.'
);

select is(
  (select count(*)::integer from public.review_notifications
    where kind = 'organization_application_rejected'),
  1,
  'application rejection creates one notification'
);
select is(
  (select subject from public.review_notifications
    where kind = 'organization_application_rejected'),
  'Notification Test Organization',
  'application notification snapshots the reviewed subject'
);

insert into public.events (id, owner_organization_id)
values ('99999999-9999-4999-8999-999999999992', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.event_revisions (
  id, event_id, created_by, title, description, event_type
) values (
  '99999999-9999-4999-8999-999999999993',
  '99999999-9999-4999-8999-999999999992',
  '33333333-3333-4333-8333-333333333333',
  'Notification Test Event',
  'Notification test description',
  'performance'
);

insert into public.event_revision_audit_log (
  event_id, event_revision_id, action, actor_id, from_status, to_status
) values (
  '99999999-9999-4999-8999-999999999992',
  '99999999-9999-4999-8999-999999999993',
  'revision_submitted',
  '44444444-4444-4444-8444-444444444444',
  'draft',
  'in_review'
);
insert into public.event_revision_audit_log (
  event_id, event_revision_id, action, actor_id, from_status, to_status, reason
) values (
  '99999999-9999-4999-8999-999999999992',
  '99999999-9999-4999-8999-999999999993',
  'revision_changes_requested',
  '22222222-2222-4222-8222-222222222222',
  'in_review',
  'changes_requested',
  'Please update the description.'
);

select is(
  (select recipient_user_id from public.review_notifications
    where kind = 'event_revision_changes_requested'),
  '44444444-4444-4444-8444-444444444444'::uuid,
  'revision outcome goes to the user who submitted that revision'
);
select is(
  (select decision_reason from public.review_notifications
    where kind = 'event_revision_changes_requested'),
  'Please update the description.',
  'revision notification snapshots the decision reason'
);

update public.event_revisions
set status = 'approved'
where id = '99999999-9999-4999-8999-999999999993';
update public.events
set published_revision_id = '99999999-9999-4999-8999-999999999993'
where id = '99999999-9999-4999-8999-999999999992';
insert into public.event_cancellation_requests (
  id, event_id, requested_by, requested_reason
) values (
  '99999999-9999-4999-8999-999999999994',
  '99999999-9999-4999-8999-999999999992',
  '33333333-3333-4333-8333-333333333333',
  'Venue unavailable'
);
insert into public.event_revision_audit_log (
  event_id, cancellation_request_id, action, actor_id, from_status, to_status, reason
) values (
  '99999999-9999-4999-8999-999999999992',
  '99999999-9999-4999-8999-999999999994',
  'cancellation_approved',
  '22222222-2222-4222-8222-222222222222',
  'in_review',
  'approved',
  'Cancellation is public.'
);

select is(
  (select recipient_user_id from public.review_notifications
    where kind = 'event_cancellation_approved'),
  '33333333-3333-4333-8333-333333333333'::uuid,
  'cancellation outcome goes to the requesting organizer'
);
select is(
  (select subject from public.review_notifications
    where kind = 'event_cancellation_approved'),
  'Notification Test Event',
  'cancellation notification snapshots the event title'
);
select ok(
  (select organization_audit_log_id is not null from public.review_notifications
    where kind = 'organization_application_rejected'),
  'application notification retains its trustworthy audit source'
);
select ok(
  (select event_revision_audit_log_id is not null from public.review_notifications
    where kind = 'event_cancellation_approved'),
  'event notification retains its trustworthy audit source'
);

select ok(
  not has_table_privilege('authenticated', 'public.review_notifications', 'INSERT'),
  'authenticated users cannot forge notifications'
);
select ok(
  not has_table_privilege('authenticated', 'public.review_notifications', 'DELETE'),
  'authenticated users cannot delete notifications'
);
select ok(
  has_column_privilege('authenticated', 'public.review_notifications', 'read_at', 'UPDATE'),
  'authenticated users can update only notification read state'
);
select ok(
  not has_column_privilege('authenticated', 'public.review_notifications', 'subject', 'UPDATE'),
  'authenticated users cannot update notification content'
);
select ok(
  not has_table_privilege('anon', 'public.review_notifications', 'SELECT'),
  'anonymous users cannot read notifications'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select is(
  (select count(*)::integer from public.review_notifications),
  1,
  'a user sees only their own notification'
);
select lives_ok(
  $$update public.review_notifications set read_at = now() where kind = 'organization_application_rejected'$$,
  'a recipient can mark their notification read'
);
select ok(
  (select read_at is not null from public.review_notifications
    where kind = 'organization_application_rejected'),
  'read state is persisted'
);

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select is(
  (select count(*)::integer from public.review_notifications),
  0,
  'another user cannot see notification content'
);
reset role;

select * from finish();
rollback;
