-- DH-16: an anonymous Visitor reads published content and nothing else
-- (REQ-AUTH-001).
--
-- Supabase gives anon every privilege on new tables and functions in `public`
-- by default. Most migrations take those grants back, but some revoked only
-- from PUBLIC, which leaves the explicit grant anon holds in place. Nothing
-- below was reachable as a data change — RLS and each function's own
-- authorization check stop anon — except one read: every published Revision's
-- review memo, reviewer and author were readable anonymously through the API.

-- 1. Writes. anon keeps only the SELECT grants the public read policies need.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon;

-- 2. Tables whose policies admit only signed-in users. anon read no rows from
--    them, but held the grant.
revoke select on public.profiles from anon;
revoke select on public.organization_audit_log from anon;
revoke select on public.event_revision_audit_log from anon;
revoke select on public.event_cancellation_requests from anon;

-- 3. Published Events and Revisions are public, but not how they were
--    reviewed. The Platform Admin's review memo (decision_reason), who
--    reviewed it and who wrote it stay internal; so do a withdrawal's reason
--    and actor, which restore_event clears anyway. A new public column needs a
--    grant here in the same migration that adds it (docs/architecture/security.md).
revoke select on public.event_revisions from anon;
grant select (
  id,
  event_id,
  status,
  title,
  description,
  event_type,
  application_deadline,
  proposed_parent_event_id,
  created_at,
  reviewed_at,
  no_registration_required,
  contact_kind,
  contact_value
) on public.event_revisions to anon;

revoke select on public.events from anon;
grant select (
  id,
  owner_organization_id,
  published_revision_id,
  cancelled_at,
  cancellation_reason,
  created_at,
  parent_event_id,
  listing_origin
) on public.events to anon;

-- 4. Trusted transitions are for signed-in users. Each already rejects anon
--    itself; this makes the grant say the same thing, as
--    20260902150000_atomic_event_revision_edits.sql already does for its
--    functions. The RLS helpers is_current_published_event_revision,
--    is_platform_admin and is_organization_member stay executable: policies
--    evaluated for anon call them.
revoke execute on function public.approve_organization_application(uuid, text) from anon;
revoke execute on function public.reject_organization_application(uuid, text) from anon;
revoke execute on function public.set_organization_member_role(uuid, uuid, public.organization_role) from anon;
revoke execute on function public.remove_organization_member(uuid, uuid) from anon;
revoke execute on function public.require_moderation_reason(text) from anon;
revoke execute on function public.correct_artist_candidate(uuid, text, public.artist_type, text, text, text) from anon;
revoke execute on function public.activate_artist_candidate(uuid, text) from anon;
revoke execute on function public.reject_artist_candidate(uuid, text) from anon;
revoke execute on function public.merge_artist_candidate(uuid, uuid, text) from anon;
revoke execute on function public.correct_venue_candidate(uuid, text, public.prefecture_code, text, text, numeric, numeric, text, text) from anon;
revoke execute on function public.activate_venue_candidate(uuid, text) from anon;
revoke execute on function public.reject_venue_candidate(uuid, text) from anon;
revoke execute on function public.merge_venue_candidate(uuid, uuid, text) from anon;
revoke execute on function public.approve_artist_change_request(uuid, text) from anon;
revoke execute on function public.reject_artist_change_request(uuid, text) from anon;
revoke execute on function public.approve_venue_change_request(uuid, text) from anon;
revoke execute on function public.reject_venue_change_request(uuid, text) from anon;
revoke execute on function public.correct_artist(uuid, text, public.artist_type, text, text, text) from anon;
revoke execute on function public.correct_venue(uuid, text, public.prefecture_code, text, text, numeric, numeric, text, text) from anon;
revoke execute on function public.create_event_revision_draft(uuid) from anon;
revoke execute on function public.assert_event_revision_reviewable(uuid) from anon;
revoke execute on function public.submit_event_revision(uuid) from anon;
revoke execute on function public.request_event_revision_changes(uuid, text) from anon;
revoke execute on function public.approve_event_revision(uuid, text) from anon;
revoke execute on function public.request_event_cancellation(uuid, text) from anon;
revoke execute on function public.request_event_cancellation_changes(uuid, text) from anon;
revoke execute on function public.resubmit_event_cancellation_request(uuid, text) from anon;
revoke execute on function public.approve_event_cancellation(uuid, text) from anon;
revoke execute on function public.withdraw_event(uuid, text) from anon;
revoke execute on function public.restore_event(uuid, text) from anon;
revoke execute on function public.mark_listing_request_resolved(uuid, text) from anon;
revoke execute on function public.mark_event_as_proxy(uuid) from anon;
