-- An Organizer may prepare a new Revision without disturbing the Revision that
-- is currently public.  Copying aggregate content belongs in one trusted,
-- auditable transaction so browser code never needs elevated write access.

create function public.create_event_revision_draft(target_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_event public.events;
  source_revision public.event_revisions;
  next_revision_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select event.* into target_event
  from public.events event
  where event.id = target_event_id
  for update;

  if not found or target_event.cancelled_at is not null then
    raise exception 'active event not found';
  end if;

  if not exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_event.owner_organization_id
      and membership.user_id = auth.uid()
  ) then
    raise exception 'organization membership required';
  end if;

  select revision.* into source_revision
  from public.event_revisions revision
  where revision.id = target_event.published_revision_id
    and revision.event_id = target_event.id
    and revision.status = 'approved';

  if not found then
    raise exception 'published revision not found';
  end if;

  if exists (
    select 1
    from public.event_revisions revision
    where revision.event_id = target_event.id
      and revision.status in ('draft', 'in_review', 'changes_requested')
  ) then
    raise exception 'an open event revision already exists';
  end if;

  insert into public.event_revisions (
    event_id, created_by, status, title, description, event_type,
    application_deadline, proposed_parent_event_id, no_registration_required
  ) values (
    target_event.id, auth.uid(), 'draft', source_revision.title,
    source_revision.description, source_revision.event_type,
    source_revision.application_deadline, target_event.parent_event_id,
    source_revision.no_registration_required
  ) returning id into next_revision_id;

  insert into public.event_schedules (event_revision_id, venue_id, starts_at, ends_at, all_day)
  select next_revision_id, venue_id, starts_at, ends_at, all_day
  from public.event_schedules
  where event_revision_id = source_revision.id;

  insert into public.event_artists (event_revision_id, artist_id, role, display_order)
  select next_revision_id, artist_id, role, display_order
  from public.event_artists
  where event_revision_id = source_revision.id;

  insert into public.event_ticket_links (event_revision_id, kind, label, url, display_order)
  select next_revision_id, kind, label, url, display_order
  from public.event_ticket_links
  where event_revision_id = source_revision.id;

  insert into public.event_links (event_revision_id, label, url, display_order)
  select next_revision_id, label, url, display_order
  from public.event_links
  where event_revision_id = source_revision.id;

  insert into public.event_media (
    event_revision_id, object_key, content_type, alt_text, is_main, display_order
  )
  select next_revision_id, object_key, content_type, alt_text, is_main, display_order
  from public.event_media
  where event_revision_id = source_revision.id;

  return next_revision_id;
end;
$$;

revoke all on function public.create_event_revision_draft(uuid) from public;
grant execute on function public.create_event_revision_draft(uuid) to authenticated;

comment on function public.create_event_revision_draft(uuid) is
  'Creates one editable copy of the current approved Event Revision for an Organization member.';
