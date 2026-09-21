-- Follow-up grants and trusted state transition. Kept separate so existing
-- local development databases can receive it without a reset.
grant insert (contact_kind, contact_value) on public.event_revisions to authenticated;
grant update (contact_kind, contact_value) on public.event_revisions to authenticated;

create function public.guard_listing_origin()
returns trigger
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if new.listing_origin is distinct from old.listing_origin
    and not public.is_platform_admin() then
    raise exception 'platform admin required to change listing origin';
  end if;
  return new;
end;
$$;
create trigger guard_listing_origin_trigger
before update of listing_origin on public.events
for each row execute function public.guard_listing_origin();

create function public.mark_event_as_proxy(target_event_id uuid)
returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if not public.is_platform_admin() then raise exception 'platform admin required'; end if;
  if exists (
    select 1 from public.event_revisions revision
    join public.event_media media on media.event_revision_id = revision.id
    where revision.event_id = target_event_id
  ) then raise exception 'proxy listings cannot include images'; end if;
  update public.events set listing_origin = 'proxy' where id = target_event_id;
  if not found then raise exception 'event not found'; end if;
end;
$$;
revoke all on function public.mark_event_as_proxy(uuid) from public;
grant execute on function public.mark_event_as_proxy(uuid) to authenticated;
