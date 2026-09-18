-- Keep each organizer edit to a Revision aggregate in one database transaction.

create function public.replace_event_revision_content(
  target_revision_id uuid,
  revision_content jsonb
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  offer jsonb;
begin
  if jsonb_typeof(revision_content) <> 'object' then
    raise exception 'event revision content must be an object';
  end if;

  if (revision_content->>'venueId' is null) <> (revision_content->>'startsAt' is null) then
    raise exception 'a schedule requires both venue and start time';
  end if;
  if jsonb_typeof(coalesce(revision_content->'ticketOffers', '[]'::jsonb)) <> 'array' then
    raise exception 'ticket offers must be an array';
  end if;

  delete from public.event_artists where event_revision_id = target_revision_id;
  delete from public.event_schedules where event_revision_id = target_revision_id;
  delete from public.event_ticket_offers where event_revision_id = target_revision_id;
  delete from public.event_ticket_links where event_revision_id = target_revision_id;
  delete from public.event_links where event_revision_id = target_revision_id;
  delete from public.event_media where event_revision_id = target_revision_id;

  if nullif(revision_content->>'artistId', '') is not null then
    insert into public.event_artists (event_revision_id, artist_id, role, display_order)
    values (
      target_revision_id,
      (revision_content->>'artistId')::uuid,
      coalesce(nullif(revision_content->>'artistRole', ''), '出演'),
      0
    );
  end if;

  if nullif(revision_content->>'venueId', '') is not null then
    insert into public.event_schedules (event_revision_id, venue_id, starts_at, ends_at, all_day)
    values (
      target_revision_id,
      (revision_content->>'venueId')::uuid,
      (revision_content->>'startsAt')::timestamptz,
      nullif(revision_content->>'endsAt', '')::timestamptz,
      coalesce((revision_content->>'allDay')::boolean, false)
    );
  end if;

  if nullif(revision_content->>'ticketUrl', '') is not null then
    insert into public.event_ticket_links (event_revision_id, kind, label, url, display_order)
    values (
      target_revision_id,
      coalesce(nullif(revision_content->>'ticketKind', ''), 'ticket')::public.event_access_link_kind,
      nullif(revision_content->>'ticketLabel', ''),
      revision_content->>'ticketUrl',
      0
    );
  end if;

  for offer in select value from jsonb_array_elements(coalesce(revision_content->'ticketOffers', '[]'::jsonb))
  loop
    insert into public.event_ticket_offers (
      event_revision_id, price_type, label, currency, amount_minor,
      min_amount_minor, max_amount_minor, notes, display_order
    ) values (
      target_revision_id,
      (offer->>'price_type')::public.event_ticket_price_type,
      nullif(offer->>'label', ''),
      nullif(offer->>'currency', ''),
      nullif(offer->>'amount_minor', '')::bigint,
      nullif(offer->>'min_amount_minor', '')::bigint,
      nullif(offer->>'max_amount_minor', '')::bigint,
      nullif(offer->>'notes', ''),
      coalesce((offer->>'display_order')::integer, 0)
    );
  end loop;

  if nullif(revision_content->>'externalUrl', '') is not null then
    insert into public.event_links (event_revision_id, label, url, display_order)
    values (
      target_revision_id,
      coalesce(nullif(revision_content->>'externalLabel', ''), '公式サイト'),
      revision_content->>'externalUrl',
      0
    );
  end if;

  if nullif(revision_content->>'imageObjectKey', '') is not null
    or nullif(revision_content->>'imageContentType', '') is not null
    or nullif(revision_content->>'imageAlt', '') is not null
  then
    insert into public.event_media (
      event_revision_id, object_key, content_type, alt_text, is_main, display_order
    ) values (
      target_revision_id,
      revision_content->>'imageObjectKey',
      revision_content->>'imageContentType',
      revision_content->>'imageAlt',
      true,
      0
    );
  end if;
end;
$$;

create function public.create_event_draft_with_content(
  target_organization_id uuid,
  revision_fields jsonb,
  revision_content jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  new_event_id uuid;
  new_revision_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.events (owner_organization_id)
  values (target_organization_id)
  returning id into new_event_id;

  insert into public.event_revisions (
    event_id, created_by, title, description, event_type, application_deadline,
    proposed_parent_event_id, no_registration_required
  ) values (
    new_event_id,
    auth.uid(),
    revision_fields->>'title',
    nullif(revision_fields->>'description', ''),
    nullif(revision_fields->>'event_type', '')::public.event_type,
    nullif(revision_fields->>'application_deadline', '')::timestamptz,
    nullif(revision_fields->>'proposed_parent_event_id', '')::uuid,
    coalesce((revision_fields->>'no_registration_required')::boolean, false)
  ) returning id into new_revision_id;

  perform public.replace_event_revision_content(new_revision_id, revision_content);
  return new_event_id;
end;
$$;

create function public.save_event_revision_with_content(
  target_event_id uuid,
  target_revision_id uuid,
  revision_fields jsonb,
  revision_content jsonb,
  submit_for_review boolean
)
returns setof public.event_revisions
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  saved_revision public.event_revisions;
begin
  update public.event_revisions revision
  set title = revision_fields->>'title',
      description = nullif(revision_fields->>'description', ''),
      event_type = nullif(revision_fields->>'event_type', '')::public.event_type,
      application_deadline = nullif(revision_fields->>'application_deadline', '')::timestamptz,
      proposed_parent_event_id = nullif(revision_fields->>'proposed_parent_event_id', '')::uuid,
      no_registration_required = coalesce((revision_fields->>'no_registration_required')::boolean, false)
  where revision.id = target_revision_id
    and revision.event_id = target_event_id
  returning revision.* into saved_revision;

  if not found then
    return;
  end if;

  perform public.replace_event_revision_content(target_revision_id, revision_content);

  if submit_for_review then
    perform public.submit_event_revision(target_revision_id);
  end if;

  return next saved_revision;
end;
$$;

revoke all on function public.replace_event_revision_content(uuid, jsonb) from public, anon;
revoke all on function public.create_event_draft_with_content(uuid, jsonb, jsonb) from public, anon;
revoke all on function public.save_event_revision_with_content(uuid, uuid, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.replace_event_revision_content(uuid, jsonb) to authenticated;
grant execute on function public.create_event_draft_with_content(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.save_event_revision_with_content(uuid, uuid, jsonb, jsonb, boolean) to authenticated;

comment on function public.replace_event_revision_content(uuid, jsonb) is
  'Replaces an editable Event Revision aggregate in one transaction under caller RLS.';
comment on function public.create_event_draft_with_content(uuid, jsonb, jsonb) is
  'Creates an Event, its initial Revision, and aggregate content atomically for an authorized Organization member.';
comment on function public.save_event_revision_with_content(uuid, uuid, jsonb, jsonb, boolean) is
  'Updates an editable Event Revision, replaces its aggregate content, and optionally submits it atomically.';
