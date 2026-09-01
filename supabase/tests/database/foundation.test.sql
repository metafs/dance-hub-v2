begin;

create extension if not exists pgtap with schema extensions;
select plan(32);

select has_type('public', 'organization_role', 'organization role enum exists');
select has_type('public', 'application_status', 'application status enum exists');
select has_type('public', 'prefecture_code', 'prefecture enum exists');
select has_type('public', 'candidate_status', 'candidate status enum exists');
select has_type('public', 'event_revision_status', 'revision status enum exists');
select has_type('public', 'event_type', 'event type enum exists');

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

select col_is_pk('public', 'organizations', 'id', 'organization id is primary key');
select col_is_pk('public', 'events', 'id', 'event id is primary key');
select col_is_fk('public', 'event_revisions', 'event_id', 'revision references event');
select col_is_fk('public', 'event_schedules', 'venue_id', 'schedule references venue');
select col_is_fk('public', 'event_schedules', 'event_revision_id', 'schedule references revision');

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
    and policyname = 'organization members read audit log'
), 'organization audit read policy exists');

select * from finish();
rollback;
