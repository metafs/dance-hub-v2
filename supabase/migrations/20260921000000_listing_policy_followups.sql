-- Listing-policy follow-ups: optional media, contact validation, proxy listings,
-- organization evidence, and the private queue for public correction requests.

create type public.event_contact_kind as enum ('website', 'social', 'email');
create type public.listing_origin as enum ('organizer', 'proxy');
create type public.listing_request_kind as enum ('withdrawal', 'correction');

alter table public.organization_applications
  add column responsible_party text,
  add column contact text,
  add column activity_url text;

alter table public.organization_applications
  add constraint organization_applications_responsible_party_check
    check (char_length(trim(responsible_party)) between 1 and 200),
  add constraint organization_applications_contact_check
    check (char_length(trim(contact)) between 1 and 500),
  add constraint organization_applications_activity_url_check
    check (activity_url ~ '^https?://');

alter table public.event_revisions
  add column contact_kind public.event_contact_kind,
  add column contact_value text;

alter table public.event_revisions
  add constraint event_revisions_contact_pair_check
    check ((contact_kind is null) = (contact_value is null)),
  add constraint event_revisions_contact_value_check
    check (contact_value is null or char_length(trim(contact_value)) between 1 and 500);

alter table public.events
  add column listing_origin public.listing_origin not null default 'organizer';

create table public.listing_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id),
  kind public.listing_request_kind not null,
  requester_contact text not null check (char_length(trim(requester_contact)) between 1 and 500),
  message text not null check (char_length(trim(message)) between 1 and 4000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id),
  resolution_note text,
  check ((resolved_at is null and resolved_by is null and resolution_note is null)
    or (resolved_at is not null and resolved_by is not null))
);

alter table public.listing_requests enable row level security;
revoke all on table public.listing_requests from public, anon, authenticated;
grant select, update on public.listing_requests to authenticated;

create policy "platform admins manage listing requests"
  on public.listing_requests for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create or replace function public.assert_event_revision_reviewable(target_revision_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  revision public.event_revisions;
  parent_event public.events;
  proposed_parent public.events;
  main_image_count integer;
  first_schedule_at timestamptz;
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
  elsif revision.event_type <> 'festival' and not exists (select 1 from public.event_schedules schedule where schedule.event_revision_id = revision.id) then
    raise exception 'a schedule is required for non-apply events';
  end if;

  select min(schedule.starts_at) into first_schedule_at from public.event_schedules schedule where schedule.event_revision_id = revision.id;
  if first_schedule_at is not null and (first_schedule_at at time zone 'Asia/Tokyo')::date < (now() at time zone 'Asia/Tokyo')::date + 7 then
    raise exception 'physical events must be submitted at least 7 Tokyo calendar days before the first schedule';
  end if;

  if revision.event_type = 'festival' then
    if revision.proposed_parent_event_id is not null then raise exception 'a festival revision cannot propose a parent'; end if;
    if not exists (select 1 from public.events child_event join public.event_revisions child_revision on child_revision.id = child_event.published_revision_id join public.event_schedules child_schedule on child_schedule.event_revision_id = child_revision.id where child_event.parent_event_id = revision.event_id and child_event.cancelled_at is null and child_revision.status = 'approved') then raise exception 'a festival requires an approved child event with a schedule'; end if;
  elsif exists (select 1 from public.events child_event where child_event.parent_event_id = revision.event_id) then
    raise exception 'an event with children must have event type festival';
  end if;

  if revision.proposed_parent_event_id is not null then
    select proposed.* into proposed_parent from public.events proposed where proposed.id = revision.proposed_parent_event_id;
    if not found then raise exception 'proposed festival parent does not exist'; end if;
    if proposed_parent.owner_organization_id <> parent_event.owner_organization_id then raise exception 'proposed festival parent and child must share an organization'; end if;
    if proposed_parent.parent_event_id is not null then raise exception 'festival nesting is limited to one level'; end if;
    if proposed_parent.cancelled_at is not null then raise exception 'proposed festival parent is cancelled'; end if;
    if proposed_parent.published_revision_id is not null then
      if not exists (select 1 from public.event_revisions proposed_parent_revision where proposed_parent_revision.id = proposed_parent.published_revision_id and proposed_parent_revision.status = 'approved' and proposed_parent_revision.event_type = 'festival') then
        raise exception 'proposed parent must be a published festival';
      end if;
    elsif not exists (select 1 from public.event_revisions proposed_parent_revision where proposed_parent_revision.event_id = proposed_parent.id and proposed_parent_revision.status in ('draft', 'in_review', 'changes_requested') and proposed_parent_revision.event_type = 'festival') then
      raise exception 'unpublished proposed parent must have a festival revision';
    end if;
  end if;
end;
$$;

create or replace function public.assert_proxy_event_has_no_media()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1 from public.event_revisions revision
    join public.events event on event.id = revision.event_id
    where revision.id = coalesce(new.event_revision_id, old.event_revision_id)
      and event.listing_origin = 'proxy'
  ) then
    raise exception 'proxy listings cannot include images';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger assert_proxy_event_has_no_media_trigger
before insert or update on public.event_media
for each row execute function public.assert_proxy_event_has_no_media();

create function public.mark_listing_request_resolved(target_request_id uuid, note text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_platform_admin() then raise exception 'platform admin required'; end if;
  update public.listing_requests
  set resolved_at = now(), resolved_by = auth.uid(), resolution_note = nullif(trim(note), '')
  where id = target_request_id and resolved_at is null;
  if not found then raise exception 'listing request is not open'; end if;
end;
$$;
revoke all on function public.mark_listing_request_resolved(uuid, text) from public;
grant execute on function public.mark_listing_request_resolved(uuid, text) to authenticated;

create or replace function public.create_event_draft_with_content(
  target_organization_id uuid,
  revision_fields jsonb,
  revision_content jsonb
)
returns uuid
language plpgsql security invoker set search_path = pg_catalog, public
as $$
declare new_event_id uuid; new_revision_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.events (owner_organization_id) values (target_organization_id) returning id into new_event_id;
  insert into public.event_revisions (event_id, created_by, title, description, event_type, application_deadline, proposed_parent_event_id, no_registration_required, contact_kind, contact_value)
  values (new_event_id, auth.uid(), revision_fields->>'title', nullif(revision_fields->>'description', ''), nullif(revision_fields->>'event_type', '')::public.event_type, nullif(revision_fields->>'application_deadline', '')::timestamptz, nullif(revision_fields->>'proposed_parent_event_id', '')::uuid, coalesce((revision_fields->>'no_registration_required')::boolean, false), nullif(revision_fields->>'contact_kind', '')::public.event_contact_kind, nullif(revision_fields->>'contact_value', ''))
  returning id into new_revision_id;
  perform public.replace_event_revision_content(new_revision_id, revision_content);
  return new_event_id;
end;
$$;

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
  returning revision.* into saved_revision;
  if not found then return; end if;
  perform public.replace_event_revision_content(target_revision_id, revision_content);
  if submit_for_review then perform public.submit_event_revision(target_revision_id); end if;
  return next saved_revision;
end;
$$;

comment on table public.listing_requests is 'Private queue of anonymous public correction and withdrawal requests.';
