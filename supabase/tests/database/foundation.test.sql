begin;

create extension if not exists pgtap with schema extensions;
select plan(81);

select has_type('public', 'organization_role', 'organization role enum exists');
select has_type('public', 'application_status', 'application status enum exists');
select has_type('public', 'prefecture_code', 'prefecture enum exists');
select has_type('public', 'candidate_status', 'candidate status enum exists');
select has_type('public', 'event_revision_status', 'revision status enum exists');
select has_type('public', 'event_type', 'event type enum exists');
select has_type('public', 'shared_entity_change_status', 'shared entity change status enum exists');
select has_type('public', 'shared_entity_resource_type', 'shared entity resource type enum exists');
select has_type('public', 'shared_entity_moderation_action', 'shared entity moderation action enum exists');
select has_type('public', 'event_access_link_kind', 'event access link kind enum exists');
select has_type('public', 'event_cancellation_status', 'event cancellation status enum exists');
select has_type('public', 'event_review_action', 'event review action enum exists');
select has_type('public', 'event_ticket_price_type', 'ticket offer price type enum exists');

select has_table('public', 'organization_applications', 'organization applications exist');
select has_table('public', 'organizations', 'organizations exist');
select has_table('public', 'organization_memberships', 'memberships exist');
select has_table('public', 'platform_admins', 'platform admins exist');
select has_table('public', 'venues', 'venues exist');
select has_table('public', 'artists', 'artists exist');
select has_table('public', 'artist_candidates', 'artist candidates exist');
select has_table('public', 'venue_candidates', 'venue candidates exist');
select has_table('public', 'events', 'events exist');
select has_table('public', 'event_revisions', 'event revisions exist');
select has_table('public', 'event_schedules', 'event schedules exist');
select has_table('public', 'organization_audit_log', 'organization audit log exists');
select has_table('public', 'artist_change_requests', 'artist change requests exist');
select has_table('public', 'venue_change_requests', 'venue change requests exist');
select has_table('public', 'shared_entity_moderation_audit', 'shared entity moderation audit exists');
select has_table('public', 'event_artists', 'event artist credits exist');
select has_table('public', 'event_ticket_links', 'event ticket links exist');
select has_table('public', 'event_ticket_offers', 'event ticket offers exist');
select has_table('public', 'event_links', 'event external links exist');
select has_table('public', 'event_media', 'event media exists');
select has_table('public', 'event_content_audit_log', 'event content audit exists');
select has_table('public', 'event_cancellation_requests', 'event cancellation requests exist');
select has_table('public', 'event_revision_audit_log', 'event revision audit exists');

select ok(
  to_regprocedure('public.approve_organization_application(uuid,text)') is not null,
  'organization approval transition exists'
);
select ok(
  to_regprocedure('public.reject_organization_application(uuid,text)') is not null,
  'organization rejection transition exists'
);
select ok(
  to_regprocedure('public.set_organization_member_role(uuid,uuid,public.organization_role)') is not null,
  'organization role transition exists'
);
select ok(
  to_regprocedure('public.remove_organization_member(uuid,uuid)') is not null,
  'organization member removal transition exists'
);
select ok(
  to_regprocedure('public.is_organization_member(uuid,uuid)') is not null,
  'non-recursive organization membership predicate exists'
);
select ok(
  to_regprocedure('public.approve_artist_change_request(uuid,text)') is not null,
  'artist change approval transition exists'
);
select ok(
  to_regprocedure('public.approve_venue_change_request(uuid,text)') is not null,
  'venue change approval transition exists'
);
select ok(
  to_regprocedure('public.submit_event_revision(uuid)') is not null,
  'event submission transition exists'
);
select ok(
  to_regprocedure('public.approve_event_revision(uuid,text)') is not null,
  'event approval transition exists'
);
select ok(
  to_regprocedure('public.request_event_cancellation(uuid,text)') is not null,
  'event cancellation request transition exists'
);
select ok(
  to_regprocedure('public.approve_event_cancellation(uuid,text)') is not null,
  'event cancellation approval transition exists'
);

select ok(
  to_regprocedure('public.create_event_revision_draft(uuid)') is not null,
  'published event revision can be copied into an organizer draft'
);

select col_is_pk('public', 'organizations', 'id', 'organization id is primary key');
select col_is_pk('public', 'events', 'id', 'event id is primary key');
select col_is_fk('public', 'event_revisions', 'event_id', 'revision references event');
select col_is_fk('public', 'event_schedules', 'venue_id', 'schedule references venue');
select col_is_fk('public', 'event_schedules', 'event_revision_id', 'schedule references revision');
select has_column('public', 'event_revisions', 'no_registration_required', 'registration opt-out exists');
select has_column('public', 'event_revisions', 'proposed_parent_event_id', 'festival parent proposal exists');
select has_column('public', 'events', 'parent_event_id', 'canonical festival parent exists');
select has_trigger('public', 'artist_change_requests', 'audit_artist_change_request_submission', 'artist request audit trigger exists');
select has_trigger('public', 'venue_change_requests', 'audit_venue_change_request_submission', 'venue request audit trigger exists');
select has_trigger('public', 'event_media', 'assert_event_media_editable_trigger', 'event media edit guard exists');
select has_trigger('public', 'event_schedules', 'guard_mutable_event_schedule', 'event schedule edit guard exists');
select has_trigger('public', 'event_ticket_offers', 'guard_mutable_event_ticket_offer', 'event ticket offer edit guard exists');
select ok(exists (
  select 1 from pg_indexes where schemaname = 'public'
    and indexname = 'event_media_one_main_per_revision_idx'
), 'one-main-image index exists');
select ok(exists (
  select 1 from pg_indexes where schemaname = 'public'
    and indexname = 'organization_applications_one_submitted_per_applicant_idx'
), 'one submitted application per applicant index exists');

select ok(exists (
  select 1 from pg_policies where schemaname = 'public'
    and tablename = 'organization_applications'
    and policyname = 'applicants submit applications'
), 'application submission policy exists');
select ok(exists (
  select 1 from pg_policies where schemaname = 'public'
    and tablename = 'artists' and policyname = 'public reads artists'
), 'artist public policy exists');
select ok(exists (
  select 1 from pg_policies where schemaname = 'public'
    and tablename = 'venues' and policyname = 'public reads venues'
), 'venue public policy exists');
select ok(exists (
  select 1 from pg_policies where schemaname = 'public'
    and tablename = 'event_revisions'
    and policyname in ('members create revisions', 'members create draft revisions')
), 'revision creation policy exists');
select ok(exists (
  select 1 from pg_policies where schemaname = 'public'
    and tablename = 'organization_audit_log'
    and policyname = 'owners read their organization audit log'
), 'organization audit read policy exists');
select ok(exists (
  select 1 from pg_policies where schemaname = 'public'
    and tablename = 'event_artists'
    and policyname = 'members create editable event artists'
), 'event artist write policy exists');
select ok(exists (
  select 1 from pg_policies where schemaname = 'public'
    and tablename = 'event_media'
    and policyname = 'public reads published event media'
), 'published event media policy exists');
select ok(exists (
  select 1 from pg_policies where schemaname = 'public'
    and tablename = 'event_ticket_offers'
    and policyname = 'public reads published event ticket offers'
), 'published ticket offer policy exists');
select ok(exists (
  select 1 from pg_policies where schemaname = 'public'
    and tablename = 'events'
    and policyname = 'public reads published events'
), 'published event policy exists');
select ok(
  has_column_privilege(
    'authenticated',
    'public.event_artists',
    'event_revision_id',
    'INSERT'
  ),
  'authenticated members can attempt artist-credit inserts through RLS'
);
select ok(
  not has_table_privilege('anon', 'public.event_artists', 'INSERT'),
  'anonymous users cannot insert artist credits'
);
select ok(
  not has_table_privilege('anon', 'public.event_ticket_offers', 'INSERT'),
  'anonymous users cannot insert ticket offers'
);
select ok(
  has_column_privilege(
    'authenticated',
    'public.event_revisions',
    'no_registration_required',
    'UPDATE'
  ),
  'authenticated members can update registration opt-out through RLS'
);
select ok(
  not has_column_privilege(
    'anon',
    'public.event_revisions',
    'no_registration_required',
    'UPDATE'
  ),
  'anonymous users cannot update registration opt-out'
);
select ok(
  has_column_privilege(
    'authenticated',
    'public.organization_applications',
    'applicant_id',
    'INSERT'
  ),
  'authenticated users can create their applications through RLS'
);
select ok(
  not has_column_privilege(
    'authenticated',
    'public.organization_applications',
    'status',
    'UPDATE'
  ),
  'authenticated users cannot update application review state directly'
);
select ok(
  not has_table_privilege('anon', 'public.organization_applications', 'SELECT'),
  'anonymous users cannot read organization applications'
);
select ok(
  has_table_privilege('authenticated', 'public.organization_memberships', 'SELECT'),
  'authenticated users can read organization memberships through RLS'
);

select * from finish();
rollback;
