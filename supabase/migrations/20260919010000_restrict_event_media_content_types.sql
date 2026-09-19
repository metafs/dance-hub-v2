-- ADR-0016 permits only the formats the delivery route can safely serve.

update public.event_media
set content_type = lower(trim(content_type))
where lower(trim(content_type)) in ('image/jpeg', 'image/png', 'image/webp');

alter table public.event_media
  drop constraint event_media_content_type_check;

alter table public.event_media
  add constraint event_media_content_type_check
  check (content_type in ('image/jpeg', 'image/png', 'image/webp')) not valid;

-- Existing unsupported metadata is retained for manual replacement, but the
-- application never reuses or delivers it and all new writes must pass this check.
