begin;

create extension if not exists pgtap with schema extensions;
select plan(26);

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

select col_is_pk('public', 'organizations', 'id', 'organization id is primary key');
select col_is_pk('public', 'events', 'id', 'event id is primary key');
select col_is_fk('public', 'event_revisions', 'event_id', 'revision references event');
select col_is_fk('public', 'event_schedules', 'venue_id', 'schedule references venue');
select col_is_fk('public', 'event_schedules', 'event_revision_id', 'schedule references revision');

select policies_are('public', 'organization_applications', array[
  'admins review applications',
  'applicants read own applications',
  'applicants submit applications'
], 'application policies are explicit');
select policies_are('public', 'artists', array['public reads artists'], 'artist public policy is explicit');
select policies_are('public', 'venues', array['public reads venues'], 'venue public policy is explicit');
select policies_are('public', 'event_revisions', array[
  'members create revisions',
  'members read revisions'
], 'revision policies are explicit');

select * from finish();
rollback;
