-- DEC-R7 (2026-09-24): a published Revision's review memo is not shown to
-- signed-in users outside the Organization that owns the Event.
--
-- 20260923000000 closed decision_reason to anon. Signed-in users kept a
-- table-wide SELECT on event_revisions, and the "public reads published
-- revisions" policy admits every signed-in user, so any account — a member
-- of another Organization included — could read the Platform Admin's memo on
-- every published Revision.
--
-- Column privileges belong to a role, not to a row, so the memo cannot be
-- opened to members only through a grant. It leaves authenticated's grants
-- altogether. Nothing is lost: no application query reads
-- event_revisions.decision_reason. The people entitled to the memo already
-- receive it elsewhere — the submitter through review_notifications
-- (recipient only), members through event_revision_audit_log (members and
-- Platform Admins only) — and the trusted review functions write it as their
-- owner. A new column on event_revisions that signed-in users should read
-- needs a grant here (docs/architecture/security.md).
revoke select on public.event_revisions from authenticated;
grant select (
  id,
  event_id,
  created_by,
  status,
  title,
  description,
  event_type,
  application_deadline,
  proposed_parent_event_id,
  created_at,
  reviewed_at,
  reviewed_by,
  no_registration_required,
  contact_kind,
  contact_value
) on public.event_revisions to authenticated;

-- save_event_revision_with_content runs as the caller and returned the whole
-- saved row (`returning revision.*`), which now needs the memo column. It
-- returns every column the caller may read instead; the memo stays null in the
-- returned row. The application reads only `id` from it. Unchanged otherwise
-- from 20260921000000_listing_policy_followups.sql; privileges are kept by
-- create or replace.
create or replace function public.save_event_revision_with_content(
  target_event_id uuid, target_revision_id uuid, revision_fields jsonb,
  revision_content jsonb, submit_for_review boolean
)
returns setof public.event_revisions
language plpgsql security invoker set search_path = pg_catalog, public
as $$
declare saved_revision public.event_revisions;
begin
  update public.event_revisions revision
  set title = revision_fields->>'title',
      description = nullif(revision_fields->>'description', ''),
      event_type = nullif(revision_fields->>'event_type', '')::public.event_type,
      application_deadline = nullif(revision_fields->>'application_deadline', '')::timestamptz,
      proposed_parent_event_id = nullif(revision_fields->>'proposed_parent_event_id', '')::uuid,
      no_registration_required = coalesce((revision_fields->>'no_registration_required')::boolean, false),
      contact_kind = nullif(revision_fields->>'contact_kind', '')::public.event_contact_kind,
      contact_value = nullif(revision_fields->>'contact_value', '')
  where revision.id = target_revision_id and revision.event_id = target_event_id
  returning
    revision.id, revision.event_id, revision.created_by, revision.status,
    revision.title, revision.description, revision.event_type,
    revision.application_deadline, revision.proposed_parent_event_id,
    revision.created_at, revision.reviewed_at, revision.reviewed_by,
    revision.no_registration_required, revision.contact_kind, revision.contact_value
  into
    saved_revision.id, saved_revision.event_id, saved_revision.created_by, saved_revision.status,
    saved_revision.title, saved_revision.description, saved_revision.event_type,
    saved_revision.application_deadline, saved_revision.proposed_parent_event_id,
    saved_revision.created_at, saved_revision.reviewed_at, saved_revision.reviewed_by,
    saved_revision.no_registration_required, saved_revision.contact_kind, saved_revision.contact_value;
  if not found then return; end if;
  perform public.replace_event_revision_content(target_revision_id, revision_content);
  if submit_for_review then perform public.submit_event_revision(target_revision_id); end if;
  return next saved_revision;
end;
$$;
