create type public.shared_entity_change_status as enum ('pending', 'approved', 'rejected');
create type public.shared_entity_resource_type as enum (
  'artist_candidate',
  'venue_candidate',
  'artist',
  'venue',
  'artist_change_request',
  'venue_change_request'
);
create type public.shared_entity_moderation_action as enum (
  'candidate_corrected',
  'candidate_activated',
  'candidate_rejected',
  'candidate_merged',
  'change_requested',
  'change_approved',
  'change_rejected',
  'canonical_corrected'
);

alter table public.artists
  add column updated_at timestamptz not null default now();

alter table public.venues
  add column updated_at timestamptz not null default now();

alter table public.artist_candidates
  add constraint artist_candidates_name_check
    check (char_length(trim(name)) between 1 and 160),
  add constraint artist_candidates_review_state_check check (
    (
      status = 'pending'
      and canonical_artist_id is null
      and reviewed_by is null
      and reviewed_at is null
      and decision_reason is null
    )
    or (
      status in ('activated', 'merged')
      and canonical_artist_id is not null
      and reviewed_by is not null
      and reviewed_at is not null
      and char_length(trim(decision_reason)) > 0
    )
    or (
      status = 'rejected'
      and canonical_artist_id is null
      and reviewed_by is not null
      and reviewed_at is not null
      and char_length(trim(decision_reason)) > 0
    )
  );

alter table public.venue_candidates
  add constraint venue_candidates_name_check
    check (char_length(trim(name)) between 1 and 160),
  add constraint venue_candidates_latitude_check
    check (latitude between -90 and 90),
  add constraint venue_candidates_longitude_check
    check (longitude between -180 and 180),
  add constraint venue_candidates_review_state_check check (
    (
      status = 'pending'
      and canonical_venue_id is null
      and reviewed_by is null
      and reviewed_at is null
      and decision_reason is null
    )
    or (
      status in ('activated', 'merged')
      and canonical_venue_id is not null
      and reviewed_by is not null
      and reviewed_at is not null
      and char_length(trim(decision_reason)) > 0
    )
    or (
      status = 'rejected'
      and canonical_venue_id is null
      and reviewed_by is not null
      and reviewed_at is not null
      and char_length(trim(decision_reason)) > 0
    )
  );

create table public.artist_change_requests (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id),
  creator_organization_id uuid not null references public.organizations (id),
  submitted_by uuid not null references public.profiles (id),
  proposed_name text not null check (char_length(trim(proposed_name)) between 1 and 160),
  proposed_artist_type public.artist_type not null,
  proposed_profile text,
  proposed_website_url text,
  status public.shared_entity_change_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  check (
    (
      status = 'pending'
      and reviewed_by is null
      and reviewed_at is null
      and decision_reason is null
    )
    or (
      status <> 'pending'
      and reviewed_by is not null
      and reviewed_at is not null
      and char_length(trim(decision_reason)) > 0
    )
  )
);

create table public.venue_change_requests (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id),
  creator_organization_id uuid not null references public.organizations (id),
  submitted_by uuid not null references public.profiles (id),
  proposed_name text not null check (char_length(trim(proposed_name)) between 1 and 160),
  proposed_prefecture public.prefecture_code not null,
  proposed_address_line1 text not null,
  proposed_address_line2 text,
  proposed_latitude numeric(9,6),
  proposed_longitude numeric(9,6),
  proposed_website_url text,
  status public.shared_entity_change_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  check ((proposed_latitude is null) = (proposed_longitude is null)),
  check (proposed_latitude between -90 and 90),
  check (proposed_longitude between -180 and 180),
  check (
    (
      status = 'pending'
      and reviewed_by is null
      and reviewed_at is null
      and decision_reason is null
    )
    or (
      status <> 'pending'
      and reviewed_by is not null
      and reviewed_at is not null
      and char_length(trim(decision_reason)) > 0
    )
  )
);

create table public.shared_entity_moderation_audit (
  id bigint generated always as identity primary key,
  resource_type public.shared_entity_resource_type not null,
  resource_id uuid not null,
  canonical_id uuid,
  creator_organization_id uuid references public.organizations (id),
  action public.shared_entity_moderation_action not null,
  actor_id uuid not null references public.profiles (id),
  reason text not null check (char_length(trim(reason)) > 0),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index artist_change_requests_creator_organization_idx
  on public.artist_change_requests (creator_organization_id, status);
create index venue_change_requests_creator_organization_idx
  on public.venue_change_requests (creator_organization_id, status);
create index shared_entity_moderation_audit_resource_idx
  on public.shared_entity_moderation_audit (resource_type, resource_id, created_at);

alter table public.artist_change_requests enable row level security;
alter table public.venue_change_requests enable row level security;
alter table public.shared_entity_moderation_audit enable row level security;

create policy "members submit artist change requests"
on public.artist_change_requests for insert
with check (
  submitted_by = auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = creator_organization_id
      and membership.user_id = auth.uid()
  )
);

create policy "creator org and admins read artist change requests"
on public.artist_change_requests for select
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = creator_organization_id
      and membership.user_id = auth.uid()
  )
);

create policy "creator edits pending artist change requests"
on public.artist_change_requests for update
using (
  status = 'pending'
  and submitted_by = auth.uid()
  and exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = creator_organization_id
      and membership.user_id = auth.uid()
  )
)
with check (
  status = 'pending'
  and submitted_by = auth.uid()
);

create policy "members submit venue change requests"
on public.venue_change_requests for insert
with check (
  submitted_by = auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = creator_organization_id
      and membership.user_id = auth.uid()
  )
);

create policy "creator org and admins read venue change requests"
on public.venue_change_requests for select
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = creator_organization_id
      and membership.user_id = auth.uid()
  )
);

create policy "creator edits pending venue change requests"
on public.venue_change_requests for update
using (
  status = 'pending'
  and submitted_by = auth.uid()
  and exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = creator_organization_id
      and membership.user_id = auth.uid()
  )
)
with check (
  status = 'pending'
  and submitted_by = auth.uid()
);

create policy "platform admins read shared entity audit"
on public.shared_entity_moderation_audit for select
using (public.is_platform_admin());

-- Candidate creators may change only submitted content while a candidate remains
-- pending. Review state and canonical links are writable only through the trusted
-- moderation functions below.
revoke insert, update on public.artist_candidates from authenticated;
grant insert (
  creator_organization_id,
  name,
  artist_type,
  profile,
  website_url
) on public.artist_candidates to authenticated;
grant update (name, artist_type, profile, website_url)
  on public.artist_candidates to authenticated;

revoke insert, update on public.venue_candidates from authenticated;
grant insert (
  creator_organization_id,
  name,
  prefecture,
  address_line1,
  address_line2,
  latitude,
  longitude,
  website_url
) on public.venue_candidates to authenticated;
grant update (
  name,
  prefecture,
  address_line1,
  address_line2,
  latitude,
  longitude,
  website_url
) on public.venue_candidates to authenticated;

revoke insert, update, delete on public.artist_change_requests from authenticated;
grant insert (
  artist_id,
  creator_organization_id,
  submitted_by,
  proposed_name,
  proposed_artist_type,
  proposed_profile,
  proposed_website_url
) on public.artist_change_requests to authenticated;
grant update (
  proposed_name,
  proposed_artist_type,
  proposed_profile,
  proposed_website_url
) on public.artist_change_requests to authenticated;

revoke insert, update, delete on public.venue_change_requests from authenticated;
grant insert (
  venue_id,
  creator_organization_id,
  submitted_by,
  proposed_name,
  proposed_prefecture,
  proposed_address_line1,
  proposed_address_line2,
  proposed_latitude,
  proposed_longitude,
  proposed_website_url
) on public.venue_change_requests to authenticated;
grant update (
  proposed_name,
  proposed_prefecture,
  proposed_address_line1,
  proposed_address_line2,
  proposed_latitude,
  proposed_longitude,
  proposed_website_url
) on public.venue_change_requests to authenticated;

revoke insert, update, delete on public.artists from authenticated;
revoke insert, update, delete on public.venues from authenticated;
revoke insert, update, delete on public.shared_entity_moderation_audit from authenticated;

create function public.require_moderation_reason(reason text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if reason is null or char_length(trim(reason)) = 0 then
    raise exception 'moderation reason required';
  end if;
  return trim(reason);
end;
$$;

revoke all on function public.require_moderation_reason(text) from public;

create function public.correct_artist_candidate(
  candidate_id uuid,
  corrected_name text,
  corrected_artist_type public.artist_type,
  corrected_profile text,
  corrected_website_url text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate public.artist_candidates;
  updated_candidate public.artist_candidates;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into candidate
  from public.artist_candidates
  where id = candidate_id
  for update;
  if not found or candidate.status <> 'pending' then
    raise exception 'artist candidate is not reviewable';
  end if;

  update public.artist_candidates
  set name = corrected_name,
      artist_type = corrected_artist_type,
      profile = corrected_profile,
      website_url = corrected_website_url
  where id = candidate_id
  returning * into updated_candidate;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, creator_organization_id, action, actor_id,
    reason, before_data, after_data
  ) values (
    'artist_candidate', candidate.id, candidate.creator_organization_id,
    'candidate_corrected', auth.uid(), normalized_reason,
    to_jsonb(candidate), to_jsonb(updated_candidate)
  );
end;
$$;

create function public.activate_artist_candidate(candidate_id uuid, reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate public.artist_candidates;
  canonical_id uuid;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into candidate
  from public.artist_candidates
  where id = candidate_id
  for update;
  if not found or candidate.status <> 'pending' then
    raise exception 'artist candidate is not reviewable';
  end if;

  insert into public.artists (name, artist_type, profile, website_url)
  values (candidate.name, candidate.artist_type, candidate.profile, candidate.website_url)
  returning id into canonical_id;

  update public.artist_candidates
  set status = 'activated',
      canonical_artist_id = canonical_id,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      decision_reason = normalized_reason
  where id = candidate_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, creator_organization_id,
    action, actor_id, reason, before_data, after_data
  )
  select
    'artist_candidate', candidate.id, canonical_id, candidate.creator_organization_id,
    'candidate_activated', auth.uid(), normalized_reason,
    to_jsonb(candidate), to_jsonb(current_candidate)
  from public.artist_candidates current_candidate
  where current_candidate.id = candidate.id;

  return canonical_id;
end;
$$;

create function public.reject_artist_candidate(candidate_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate public.artist_candidates;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into candidate
  from public.artist_candidates
  where id = candidate_id
  for update;
  if not found or candidate.status <> 'pending' then
    raise exception 'artist candidate is not reviewable';
  end if;

  update public.artist_candidates
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
      decision_reason = normalized_reason
  where id = candidate_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, creator_organization_id, action, actor_id,
    reason, before_data, after_data
  )
  select
    'artist_candidate', candidate.id, candidate.creator_organization_id,
    'candidate_rejected', auth.uid(), normalized_reason,
    to_jsonb(candidate), to_jsonb(current_candidate)
  from public.artist_candidates current_candidate
  where current_candidate.id = candidate.id;
end;
$$;

create function public.merge_artist_candidate(
  candidate_id uuid,
  survivor_artist_id uuid,
  reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate public.artist_candidates;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into candidate
  from public.artist_candidates
  where id = candidate_id
  for update;
  if not found or candidate.status <> 'pending' then
    raise exception 'artist candidate is not reviewable';
  end if;
  if not exists (select 1 from public.artists where id = survivor_artist_id) then
    raise exception 'survivor artist does not exist';
  end if;

  update public.artist_candidates
  set status = 'merged',
      canonical_artist_id = survivor_artist_id,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      decision_reason = normalized_reason
  where id = candidate_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, creator_organization_id,
    action, actor_id, reason, before_data, after_data
  )
  select
    'artist_candidate', candidate.id, survivor_artist_id,
    candidate.creator_organization_id, 'candidate_merged', auth.uid(),
    normalized_reason, to_jsonb(candidate), to_jsonb(current_candidate)
  from public.artist_candidates current_candidate
  where current_candidate.id = candidate.id;

  return survivor_artist_id;
end;
$$;

create function public.correct_venue_candidate(
  candidate_id uuid,
  corrected_name text,
  corrected_prefecture public.prefecture_code,
  corrected_address_line1 text,
  corrected_address_line2 text,
  corrected_latitude numeric,
  corrected_longitude numeric,
  corrected_website_url text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate public.venue_candidates;
  updated_candidate public.venue_candidates;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into candidate
  from public.venue_candidates
  where id = candidate_id
  for update;
  if not found or candidate.status <> 'pending' then
    raise exception 'venue candidate is not reviewable';
  end if;

  update public.venue_candidates
  set name = corrected_name,
      prefecture = corrected_prefecture,
      address_line1 = corrected_address_line1,
      address_line2 = corrected_address_line2,
      latitude = corrected_latitude,
      longitude = corrected_longitude,
      website_url = corrected_website_url
  where id = candidate_id
  returning * into updated_candidate;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, creator_organization_id, action, actor_id,
    reason, before_data, after_data
  ) values (
    'venue_candidate', candidate.id, candidate.creator_organization_id,
    'candidate_corrected', auth.uid(), normalized_reason,
    to_jsonb(candidate), to_jsonb(updated_candidate)
  );
end;
$$;

create function public.activate_venue_candidate(candidate_id uuid, reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate public.venue_candidates;
  canonical_id uuid;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into candidate
  from public.venue_candidates
  where id = candidate_id
  for update;
  if not found or candidate.status <> 'pending' then
    raise exception 'venue candidate is not reviewable';
  end if;

  insert into public.venues (
    name, prefecture, address_line1, address_line2, latitude, longitude, website_url
  ) values (
    candidate.name, candidate.prefecture, candidate.address_line1,
    candidate.address_line2, candidate.latitude, candidate.longitude,
    candidate.website_url
  ) returning id into canonical_id;

  update public.venue_candidates
  set status = 'activated',
      canonical_venue_id = canonical_id,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      decision_reason = normalized_reason
  where id = candidate_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, creator_organization_id,
    action, actor_id, reason, before_data, after_data
  )
  select
    'venue_candidate', candidate.id, canonical_id, candidate.creator_organization_id,
    'candidate_activated', auth.uid(), normalized_reason,
    to_jsonb(candidate), to_jsonb(current_candidate)
  from public.venue_candidates current_candidate
  where current_candidate.id = candidate.id;

  return canonical_id;
end;
$$;

create function public.reject_venue_candidate(candidate_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate public.venue_candidates;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into candidate
  from public.venue_candidates
  where id = candidate_id
  for update;
  if not found or candidate.status <> 'pending' then
    raise exception 'venue candidate is not reviewable';
  end if;

  update public.venue_candidates
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
      decision_reason = normalized_reason
  where id = candidate_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, creator_organization_id, action, actor_id,
    reason, before_data, after_data
  )
  select
    'venue_candidate', candidate.id, candidate.creator_organization_id,
    'candidate_rejected', auth.uid(), normalized_reason,
    to_jsonb(candidate), to_jsonb(current_candidate)
  from public.venue_candidates current_candidate
  where current_candidate.id = candidate.id;
end;
$$;

create function public.merge_venue_candidate(
  candidate_id uuid,
  survivor_venue_id uuid,
  reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate public.venue_candidates;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into candidate
  from public.venue_candidates
  where id = candidate_id
  for update;
  if not found or candidate.status <> 'pending' then
    raise exception 'venue candidate is not reviewable';
  end if;
  if not exists (select 1 from public.venues where id = survivor_venue_id) then
    raise exception 'survivor venue does not exist';
  end if;

  update public.venue_candidates
  set status = 'merged',
      canonical_venue_id = survivor_venue_id,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      decision_reason = normalized_reason
  where id = candidate_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, creator_organization_id,
    action, actor_id, reason, before_data, after_data
  )
  select
    'venue_candidate', candidate.id, survivor_venue_id,
    candidate.creator_organization_id, 'candidate_merged', auth.uid(),
    normalized_reason, to_jsonb(candidate), to_jsonb(current_candidate)
  from public.venue_candidates current_candidate
  where current_candidate.id = candidate.id;

  return survivor_venue_id;
end;
$$;

create function public.approve_artist_change_request(request_id uuid, reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  change_request public.artist_change_requests;
  old_artist public.artists;
  updated_artist public.artists;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into change_request
  from public.artist_change_requests
  where id = request_id
  for update;
  if not found or change_request.status <> 'pending' then
    raise exception 'artist change request is not reviewable';
  end if;

  select * into old_artist from public.artists
  where id = change_request.artist_id for update;

  update public.artists
  set name = change_request.proposed_name,
      artist_type = change_request.proposed_artist_type,
      profile = change_request.proposed_profile,
      website_url = change_request.proposed_website_url,
      updated_at = now()
  where id = change_request.artist_id
  returning * into updated_artist;

  update public.artist_change_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
      decision_reason = normalized_reason
  where id = request_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, creator_organization_id,
    action, actor_id, reason, before_data, after_data
  ) values (
    'artist_change_request', change_request.id, change_request.artist_id,
    change_request.creator_organization_id, 'change_approved', auth.uid(),
    normalized_reason, to_jsonb(old_artist), to_jsonb(updated_artist)
  );

  return change_request.artist_id;
end;
$$;

create function public.reject_artist_change_request(request_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  change_request public.artist_change_requests;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into change_request
  from public.artist_change_requests
  where id = request_id
  for update;
  if not found or change_request.status <> 'pending' then
    raise exception 'artist change request is not reviewable';
  end if;

  update public.artist_change_requests
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
      decision_reason = normalized_reason
  where id = request_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, creator_organization_id,
    action, actor_id, reason, before_data, after_data
  )
  select
    'artist_change_request', change_request.id, change_request.artist_id,
    change_request.creator_organization_id, 'change_rejected', auth.uid(),
    normalized_reason, to_jsonb(change_request), to_jsonb(current_request)
  from public.artist_change_requests current_request
  where current_request.id = change_request.id;
end;
$$;

create function public.approve_venue_change_request(request_id uuid, reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  change_request public.venue_change_requests;
  old_venue public.venues;
  updated_venue public.venues;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into change_request
  from public.venue_change_requests
  where id = request_id
  for update;
  if not found or change_request.status <> 'pending' then
    raise exception 'venue change request is not reviewable';
  end if;

  select * into old_venue from public.venues
  where id = change_request.venue_id for update;

  update public.venues
  set name = change_request.proposed_name,
      prefecture = change_request.proposed_prefecture,
      address_line1 = change_request.proposed_address_line1,
      address_line2 = change_request.proposed_address_line2,
      latitude = change_request.proposed_latitude,
      longitude = change_request.proposed_longitude,
      website_url = change_request.proposed_website_url,
      updated_at = now()
  where id = change_request.venue_id
  returning * into updated_venue;

  update public.venue_change_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
      decision_reason = normalized_reason
  where id = request_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, creator_organization_id,
    action, actor_id, reason, before_data, after_data
  ) values (
    'venue_change_request', change_request.id, change_request.venue_id,
    change_request.creator_organization_id, 'change_approved', auth.uid(),
    normalized_reason, to_jsonb(old_venue), to_jsonb(updated_venue)
  );

  return change_request.venue_id;
end;
$$;

create function public.reject_venue_change_request(request_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  change_request public.venue_change_requests;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into change_request
  from public.venue_change_requests
  where id = request_id
  for update;
  if not found or change_request.status <> 'pending' then
    raise exception 'venue change request is not reviewable';
  end if;

  update public.venue_change_requests
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
      decision_reason = normalized_reason
  where id = request_id;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, creator_organization_id,
    action, actor_id, reason, before_data, after_data
  )
  select
    'venue_change_request', change_request.id, change_request.venue_id,
    change_request.creator_organization_id, 'change_rejected', auth.uid(),
    normalized_reason, to_jsonb(change_request), to_jsonb(current_request)
  from public.venue_change_requests current_request
  where current_request.id = change_request.id;
end;
$$;

create function public.correct_artist(
  artist_id uuid,
  corrected_name text,
  corrected_artist_type public.artist_type,
  corrected_profile text,
  corrected_website_url text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_artist public.artists;
  updated_artist public.artists;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into old_artist from public.artists where id = artist_id for update;
  if not found then raise exception 'artist does not exist'; end if;

  update public.artists
  set name = corrected_name,
      artist_type = corrected_artist_type,
      profile = corrected_profile,
      website_url = corrected_website_url,
      updated_at = now()
  where id = artist_id
  returning * into updated_artist;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, action, actor_id, reason,
    before_data, after_data
  ) values (
    'artist', artist_id, artist_id, 'canonical_corrected', auth.uid(),
    normalized_reason, to_jsonb(old_artist), to_jsonb(updated_artist)
  );
end;
$$;

create function public.correct_venue(
  venue_id uuid,
  corrected_name text,
  corrected_prefecture public.prefecture_code,
  corrected_address_line1 text,
  corrected_address_line2 text,
  corrected_latitude numeric,
  corrected_longitude numeric,
  corrected_website_url text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_venue public.venues;
  updated_venue public.venues;
  normalized_reason text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform admin required';
  end if;
  normalized_reason := public.require_moderation_reason(reason);

  select * into old_venue from public.venues where id = venue_id for update;
  if not found then raise exception 'venue does not exist'; end if;

  update public.venues
  set name = corrected_name,
      prefecture = corrected_prefecture,
      address_line1 = corrected_address_line1,
      address_line2 = corrected_address_line2,
      latitude = corrected_latitude,
      longitude = corrected_longitude,
      website_url = corrected_website_url,
      updated_at = now()
  where id = venue_id
  returning * into updated_venue;

  insert into public.shared_entity_moderation_audit (
    resource_type, resource_id, canonical_id, action, actor_id, reason,
    before_data, after_data
  ) values (
    'venue', venue_id, venue_id, 'canonical_corrected', auth.uid(),
    normalized_reason, to_jsonb(old_venue), to_jsonb(updated_venue)
  );
end;
$$;

revoke all on function public.correct_artist_candidate(uuid, text, public.artist_type, text, text, text) from public;
revoke all on function public.activate_artist_candidate(uuid, text) from public;
revoke all on function public.reject_artist_candidate(uuid, text) from public;
revoke all on function public.merge_artist_candidate(uuid, uuid, text) from public;
revoke all on function public.correct_venue_candidate(uuid, text, public.prefecture_code, text, text, numeric, numeric, text, text) from public;
revoke all on function public.activate_venue_candidate(uuid, text) from public;
revoke all on function public.reject_venue_candidate(uuid, text) from public;
revoke all on function public.merge_venue_candidate(uuid, uuid, text) from public;
revoke all on function public.approve_artist_change_request(uuid, text) from public;
revoke all on function public.reject_artist_change_request(uuid, text) from public;
revoke all on function public.approve_venue_change_request(uuid, text) from public;
revoke all on function public.reject_venue_change_request(uuid, text) from public;
revoke all on function public.correct_artist(uuid, text, public.artist_type, text, text, text) from public;
revoke all on function public.correct_venue(uuid, text, public.prefecture_code, text, text, numeric, numeric, text, text) from public;

grant execute on function public.correct_artist_candidate(uuid, text, public.artist_type, text, text, text) to authenticated;
grant execute on function public.activate_artist_candidate(uuid, text) to authenticated;
grant execute on function public.reject_artist_candidate(uuid, text) to authenticated;
grant execute on function public.merge_artist_candidate(uuid, uuid, text) to authenticated;
grant execute on function public.correct_venue_candidate(uuid, text, public.prefecture_code, text, text, numeric, numeric, text, text) to authenticated;
grant execute on function public.activate_venue_candidate(uuid, text) to authenticated;
grant execute on function public.reject_venue_candidate(uuid, text) to authenticated;
grant execute on function public.merge_venue_candidate(uuid, uuid, text) to authenticated;
grant execute on function public.approve_artist_change_request(uuid, text) to authenticated;
grant execute on function public.reject_artist_change_request(uuid, text) to authenticated;
grant execute on function public.approve_venue_change_request(uuid, text) to authenticated;
grant execute on function public.reject_venue_change_request(uuid, text) to authenticated;
grant execute on function public.correct_artist(uuid, text, public.artist_type, text, text, text) to authenticated;
grant execute on function public.correct_venue(uuid, text, public.prefecture_code, text, text, numeric, numeric, text, text) to authenticated;
