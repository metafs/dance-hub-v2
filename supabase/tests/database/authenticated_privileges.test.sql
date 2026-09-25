-- The complete privilege surface of a signed-in user, the counterpart of
-- anonymous_privileges.test.sql.
--
-- RLS decides which rows a signed-in user reaches; these grants decide which
-- operations and columns are on the table at all. Pinning them means a
-- migration cannot widen what `authenticated` may write, or hand back the
-- TRUNCATE that RLS does not govern, without this file changing in the same
-- pull request.

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


select plan(14);

-- Tables and columns ---------------------------------------------------------

select set_eq(
  $$
    select table_name || ':' || privilege_type
    from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
  $$,
  array[
    'artist_candidates:SELECT',
    'artist_change_requests:SELECT',
    'artists:SELECT',
    'event_artists:DELETE',
    'event_artists:SELECT',
    'event_cancellation_requests:SELECT',
    'event_content_audit_log:SELECT',
    'event_links:DELETE',
    'event_links:SELECT',
    'event_media:DELETE',
    'event_media:SELECT',
    'event_revision_audit_log:SELECT',
    'event_schedules:DELETE',
    'event_schedules:INSERT',
    'event_schedules:SELECT',
    'event_schedules:UPDATE',
    'event_ticket_links:DELETE',
    'event_ticket_links:SELECT',
    'event_ticket_offers:DELETE',
    'event_ticket_offers:SELECT',
    'events:SELECT',
    'listing_requests:SELECT',
    'listing_requests:UPDATE',
    'organization_applications:SELECT',
    'organization_audit_log:SELECT',
    'organization_memberships:SELECT',
    'organizations:SELECT',
    'platform_admins:SELECT',
    'profiles:INSERT',
    'profiles:SELECT',
    'review_notifications:SELECT',
    'shared_entity_moderation_audit:SELECT',
    'venue_candidates:SELECT',
    'venue_change_requests:SELECT',
    'venues:SELECT'
  ],
  'authenticated holds only the listed table privileges'
);

-- Column grants are how most writes are allowed: a policy admits the row, the
-- grant names the columns a client may set.
select set_eq(
  $$
    select class.relname || '.' || attribute.attname || ':' || privilege.privilege_type
    from pg_catalog.pg_attribute attribute
    join pg_catalog.pg_class class on class.oid = attribute.attrelid
    cross join lateral aclexplode(attribute.attacl) privilege
    where class.relnamespace = 'public'::regnamespace
      and privilege.grantee = 'authenticated'::regrole
      and privilege.privilege_type <> 'SELECT'
  $$,
  array[
    'artist_candidates.artist_type:INSERT',
    'artist_candidates.artist_type:UPDATE',
    'artist_candidates.creator_organization_id:INSERT',
    'artist_candidates.name:INSERT',
    'artist_candidates.name:UPDATE',
    'artist_candidates.profile:INSERT',
    'artist_candidates.profile:UPDATE',
    'artist_candidates.website_url:INSERT',
    'artist_candidates.website_url:UPDATE',
    'artist_change_requests.artist_id:INSERT',
    'artist_change_requests.creator_organization_id:INSERT',
    'artist_change_requests.proposed_artist_type:INSERT',
    'artist_change_requests.proposed_artist_type:UPDATE',
    'artist_change_requests.proposed_name:INSERT',
    'artist_change_requests.proposed_name:UPDATE',
    'artist_change_requests.proposed_profile:INSERT',
    'artist_change_requests.proposed_profile:UPDATE',
    'artist_change_requests.proposed_website_url:INSERT',
    'artist_change_requests.proposed_website_url:UPDATE',
    'artist_change_requests.submitted_by:INSERT',
    'event_artists.artist_id:INSERT',
    'event_artists.artist_id:UPDATE',
    'event_artists.display_order:INSERT',
    'event_artists.display_order:UPDATE',
    'event_artists.event_revision_id:INSERT',
    'event_artists.role:INSERT',
    'event_artists.role:UPDATE',
    'event_links.display_order:INSERT',
    'event_links.display_order:UPDATE',
    'event_links.event_revision_id:INSERT',
    'event_links.label:INSERT',
    'event_links.label:UPDATE',
    'event_links.url:INSERT',
    'event_links.url:UPDATE',
    'event_media.alt_text:INSERT',
    'event_media.alt_text:UPDATE',
    'event_media.content_type:INSERT',
    'event_media.content_type:UPDATE',
    'event_media.display_order:INSERT',
    'event_media.display_order:UPDATE',
    'event_media.event_revision_id:INSERT',
    'event_media.is_main:INSERT',
    'event_media.is_main:UPDATE',
    'event_media.object_key:INSERT',
    'event_media.object_key:UPDATE',
    'event_revisions.application_deadline:INSERT',
    'event_revisions.application_deadline:UPDATE',
    'event_revisions.contact_kind:INSERT',
    'event_revisions.contact_kind:UPDATE',
    'event_revisions.contact_value:INSERT',
    'event_revisions.contact_value:UPDATE',
    'event_revisions.created_by:INSERT',
    'event_revisions.description:INSERT',
    'event_revisions.description:UPDATE',
    'event_revisions.event_id:INSERT',
    'event_revisions.event_type:INSERT',
    'event_revisions.event_type:UPDATE',
    'event_revisions.no_registration_required:INSERT',
    'event_revisions.no_registration_required:UPDATE',
    'event_revisions.proposed_parent_event_id:INSERT',
    'event_revisions.proposed_parent_event_id:UPDATE',
    'event_revisions.title:INSERT',
    'event_revisions.title:UPDATE',
    'event_ticket_links.display_order:INSERT',
    'event_ticket_links.display_order:UPDATE',
    'event_ticket_links.event_revision_id:INSERT',
    'event_ticket_links.kind:INSERT',
    'event_ticket_links.kind:UPDATE',
    'event_ticket_links.label:INSERT',
    'event_ticket_links.label:UPDATE',
    'event_ticket_links.url:INSERT',
    'event_ticket_links.url:UPDATE',
    'event_ticket_offers.amount_minor:INSERT',
    'event_ticket_offers.amount_minor:UPDATE',
    'event_ticket_offers.currency:INSERT',
    'event_ticket_offers.currency:UPDATE',
    'event_ticket_offers.display_order:INSERT',
    'event_ticket_offers.display_order:UPDATE',
    'event_ticket_offers.event_revision_id:INSERT',
    'event_ticket_offers.label:INSERT',
    'event_ticket_offers.label:UPDATE',
    'event_ticket_offers.max_amount_minor:INSERT',
    'event_ticket_offers.max_amount_minor:UPDATE',
    'event_ticket_offers.min_amount_minor:INSERT',
    'event_ticket_offers.min_amount_minor:UPDATE',
    'event_ticket_offers.notes:INSERT',
    'event_ticket_offers.notes:UPDATE',
    'event_ticket_offers.price_type:INSERT',
    'event_ticket_offers.price_type:UPDATE',
    'events.owner_organization_id:INSERT',
    'organization_applications.activity_url:INSERT',
    'organization_applications.applicant_id:INSERT',
    'organization_applications.contact:INSERT',
    'organization_applications.name:INSERT',
    'organization_applications.responsible_party:INSERT',
    'organization_applications.website_url:INSERT',
    'review_notifications.read_at:UPDATE',
    'venue_candidates.address_line1:INSERT',
    'venue_candidates.address_line1:UPDATE',
    'venue_candidates.address_line2:INSERT',
    'venue_candidates.address_line2:UPDATE',
    'venue_candidates.creator_organization_id:INSERT',
    'venue_candidates.latitude:INSERT',
    'venue_candidates.latitude:UPDATE',
    'venue_candidates.longitude:INSERT',
    'venue_candidates.longitude:UPDATE',
    'venue_candidates.name:INSERT',
    'venue_candidates.name:UPDATE',
    'venue_candidates.prefecture:INSERT',
    'venue_candidates.prefecture:UPDATE',
    'venue_candidates.website_url:INSERT',
    'venue_candidates.website_url:UPDATE',
    'venue_change_requests.creator_organization_id:INSERT',
    'venue_change_requests.proposed_address_line1:INSERT',
    'venue_change_requests.proposed_address_line1:UPDATE',
    'venue_change_requests.proposed_address_line2:INSERT',
    'venue_change_requests.proposed_address_line2:UPDATE',
    'venue_change_requests.proposed_latitude:INSERT',
    'venue_change_requests.proposed_latitude:UPDATE',
    'venue_change_requests.proposed_longitude:INSERT',
    'venue_change_requests.proposed_longitude:UPDATE',
    'venue_change_requests.proposed_name:INSERT',
    'venue_change_requests.proposed_name:UPDATE',
    'venue_change_requests.proposed_prefecture:INSERT',
    'venue_change_requests.proposed_prefecture:UPDATE',
    'venue_change_requests.proposed_website_url:INSERT',
    'venue_change_requests.proposed_website_url:UPDATE',
    'venue_change_requests.submitted_by:INSERT',
    'venue_change_requests.venue_id:INSERT'
  ],
  'authenticated writes only the listed columns'
);

select is_empty(
  $$
    select grantee || ' ' || table_name || ':' || privilege_type
    from information_schema.role_table_grants
    where grantee in ('anon', 'authenticated')
      and table_schema = 'public'
      and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
  $$,
  'no client role can truncate, reference or trigger on a public table'
);

-- A table added later starts without the privileges Supabase would grant.
create table public.privilege_probe (id integer);

select is_empty(
  $$
    select grantee || ':' || privilege_type
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'privilege_probe'
      and (
        (grantee = 'anon' and privilege_type <> 'SELECT')
        or (grantee = 'authenticated' and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER'))
      )
  $$,
  'a new table gives anon no writes and authenticated no truncate, reference or trigger'
);

drop table public.privilege_probe;

-- Membership helpers ---------------------------------------------------------

select ok(
  not has_function_privilege('anon', 'public.is_platform_admin(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.is_organization_member(uuid,uuid)', 'EXECUTE'),
  'a Visitor cannot call the membership helpers'
);

set local role authenticated;

-- other@example.com: signed in, not an admin, not a member of the fixture
-- Organization.
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);

select is(
  public.is_platform_admin('22222222-2222-4222-8222-222222222222'),
  false,
  'a signed-in user cannot learn whether someone else is a Platform Admin'
);

select is(
  public.is_organization_member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333'),
  false,
  'a signed-in user cannot learn whether someone else is a member of an Organization'
);

select throws_ok(
  $$truncate public.platform_admins$$,
  '42501',
  null,
  'a signed-in user cannot truncate a table'
);

select throws_ok(
  $$delete from public.profiles$$,
  '42501',
  null,
  'a signed-in user cannot delete profiles'
);

select throws_ok(
  $$update public.organization_audit_log set reason = reason$$,
  '42501',
  null,
  'a signed-in user cannot rewrite the organization audit log'
);

-- The helpers still answer about the caller, which is how every policy and
-- the application use them.
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select ok(public.is_platform_admin(), 'a Platform Admin is recognised through the default argument');
select ok(
  public.is_platform_admin('22222222-2222-4222-8222-222222222222'),
  'a Platform Admin is recognised when passing their own id, as the application does'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select ok(
  public.is_organization_member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'an Owner is recognised as a member of their Organization'
);
select is(
  (select count(*)::integer from public.organization_memberships where organization_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') > 0,
  true,
  'an Owner still reads their Organization''s memberships through the policy'
);

reset role;

select * from finish();
rollback;
