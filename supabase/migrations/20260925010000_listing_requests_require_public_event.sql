-- A withdrawal or correction request (listing policy F, G-6) concerns an Event
-- a Visitor can see.
--
-- The public form inserts with the service role, so RLS does not stand between
-- it and the table, and the only check on event_id was the foreign key. A
-- request naming a draft, an in-review or a withdrawn Event was accepted, while
-- a request naming no Event failed: the form's answer told anyone who solved
-- the bot check whether an unpublished Event with that id existed. The request
-- is now accepted only for an Event whose current Revision is public, which is
-- the same test the public read policies apply, so every other id fails the
-- same way.

create or replace function public.assert_listing_request_event_is_public()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1
    from public.events event
    where event.id = new.event_id
      and event.published_revision_id is not null
      and public.is_current_published_event_revision(event.published_revision_id)
  ) then
    raise exception 'listing requests concern a public event'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.assert_listing_request_event_is_public() from public, anon, authenticated;

create trigger assert_listing_request_event_is_public
before insert on public.listing_requests
for each row execute function public.assert_listing_request_event_is_public();
