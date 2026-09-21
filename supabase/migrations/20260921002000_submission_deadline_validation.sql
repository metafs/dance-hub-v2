-- B-7 is a submission-time requirement. Approval may happen inside the final
-- week, so use the trusted revision_submitted audit timestamp when it exists.
create or replace function public.assert_event_revision_reviewable(target_revision_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  revision public.event_revisions; parent_event public.events; proposed_parent public.events;
  main_image_count integer; first_schedule_at timestamptz; submission_at timestamptz;
begin
  select * into revision from public.event_revisions where id = target_revision_id;
  if not found then raise exception 'event revision not found'; end if;
  select * into parent_event from public.events where id = revision.event_id;
  if parent_event.cancelled_at is not null then raise exception 'cancelled events cannot publish revisions'; end if;
  if revision.title is null or char_length(trim(revision.title)) = 0 then raise exception 'title is required for review'; end if;
  if revision.description is null or char_length(trim(revision.description)) = 0 then raise exception 'description is required for review'; end if;
  if revision.event_type is null then raise exception 'event type is required for review'; end if;
  if revision.contact_kind is null or revision.contact_value is null then raise exception 'a contact method is required for review'; end if;
  if revision.contact_kind in ('website', 'social') and revision.contact_value !~ '^https?://' then raise exception 'contact URL must be HTTP(S)'; end if;
  if revision.contact_kind = 'email' and revision.contact_value !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'contact email is invalid'; end if;
  if not revision.no_registration_required and not exists (select 1 from public.event_ticket_offers offer where offer.event_revision_id = revision.id) and not exists (select 1 from public.event_ticket_links access_link where access_link.event_revision_id = revision.id) then raise exception 'a ticket offer, ticket link, or no-registration value is required for review'; end if;
  select count(*) into main_image_count from public.event_media media where media.event_revision_id = revision.id and media.is_main and char_length(trim(media.alt_text)) > 0;
  if main_image_count > 1 then raise exception 'at most one main image is allowed for review'; end if;
  if parent_event.listing_origin = 'proxy' and main_image_count > 0 then raise exception 'proxy listings cannot include images'; end if;
  if revision.event_type in ('audition', 'open_call', 'residency') then
    if revision.application_deadline is null then raise exception 'application deadline is required for apply events'; end if;
  elsif revision.event_type <> 'festival' and not exists (select 1 from public.event_schedules schedule where schedule.event_revision_id = revision.id) then raise exception 'a schedule is required for non-apply events'; end if;
  select min(schedule.starts_at) into first_schedule_at from public.event_schedules schedule where schedule.event_revision_id = revision.id;
  select audit.created_at into submission_at from public.event_revision_audit_log audit where audit.event_revision_id = revision.id and audit.action = 'revision_submitted' order by audit.created_at desc limit 1;
  if first_schedule_at is not null and (first_schedule_at at time zone 'Asia/Tokyo')::date < (coalesce(submission_at, now()) at time zone 'Asia/Tokyo')::date + 7 then raise exception 'physical events must be submitted at least 7 Tokyo calendar days before the first schedule'; end if;
  if revision.event_type = 'festival' then
    if revision.proposed_parent_event_id is not null then raise exception 'a festival revision cannot propose a parent'; end if;
    if not exists (select 1 from public.events child_event join public.event_revisions child_revision on child_revision.id = child_event.published_revision_id join public.event_schedules child_schedule on child_schedule.event_revision_id = child_revision.id where child_event.parent_event_id = revision.event_id and child_event.cancelled_at is null and child_revision.status = 'approved') then raise exception 'a festival requires an approved child event with a schedule'; end if;
  elsif exists (select 1 from public.events child_event where child_event.parent_event_id = revision.event_id) then raise exception 'an event with children must have event type festival'; end if;
  if revision.proposed_parent_event_id is not null then
    select proposed.* into proposed_parent from public.events proposed where proposed.id = revision.proposed_parent_event_id;
    if not found then raise exception 'proposed festival parent does not exist'; end if;
    if proposed_parent.owner_organization_id <> parent_event.owner_organization_id then raise exception 'proposed festival parent and child must share an organization'; end if;
    if proposed_parent.parent_event_id is not null then raise exception 'festival nesting is limited to one level'; end if;
    if proposed_parent.cancelled_at is not null then raise exception 'proposed festival parent is cancelled'; end if;
    if proposed_parent.published_revision_id is not null then
      if not exists (select 1 from public.event_revisions proposed_parent_revision where proposed_parent_revision.id = proposed_parent.published_revision_id and proposed_parent_revision.status = 'approved' and proposed_parent_revision.event_type = 'festival') then raise exception 'proposed parent must be a published festival'; end if;
    elsif not exists (select 1 from public.event_revisions proposed_parent_revision where proposed_parent_revision.event_id = proposed_parent.id and proposed_parent_revision.status in ('draft','in_review','changes_requested') and proposed_parent_revision.event_type = 'festival') then
      raise exception 'unpublished proposed parent must have a festival revision';
    end if;
  end if;
end;
$$;
