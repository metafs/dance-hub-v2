create type public.organization_audit_action as enum (
  'application_approved',
  'application_rejected',
  'member_added',
  'member_role_changed',
  'member_removed'
);

create table public.organization_audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations (id) on delete set null,
  application_id uuid references public.organization_applications (id) on delete set null,
  target_user_id uuid references public.profiles (id) on delete set null,
  actor_id uuid not null references public.profiles (id),
  action public.organization_audit_action not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.organization_audit_log enable row level security;

create policy "platform admins read organization audit log"
on public.organization_audit_log for select
using (public.is_platform_admin());

create policy "owners read their organization audit log"
on public.organization_audit_log for select
using (
  exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = organization_audit_log.organization_id
      and membership.user_id = auth.uid()
      and membership.role = 'owner'
  )
);

create policy "owners and admins update organizations"
on public.organizations for update
using (
  exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = organizations.id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = organizations.id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  )
);

create or replace function public.approve_organization_application(
  application_id uuid,
  decision_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  application public.organization_applications;
  new_organization_id uuid;
  reviewer_id uuid := auth.uid();
begin
  if not public.is_platform_admin(reviewer_id) then
    raise exception 'platform admin required';
  end if;

  select * into application
  from public.organization_applications
  where id = application_id
  for update;

  if not found or application.status <> 'submitted' then
    raise exception 'application is not reviewable';
  end if;

  insert into public.organizations (name, website_url)
  values (application.name, application.website_url)
  returning id into new_organization_id;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (new_organization_id, application.applicant_id, 'owner');

  update public.organization_applications
  set status = 'approved', reviewed_by = reviewer_id, reviewed_at = now(),
      decision_reason = approve_organization_application.decision_reason
  where id = application_id;

  insert into public.organization_audit_log (
    organization_id, application_id, target_user_id, actor_id, action, reason
  ) values (
    new_organization_id, application_id, application.applicant_id, reviewer_id,
    'application_approved', decision_reason
  );

  return new_organization_id;
end;
$$;

create function public.reject_organization_application(
  application_id uuid,
  decision_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  application public.organization_applications;
  reviewer_id uuid := auth.uid();
begin
  if not public.is_platform_admin(reviewer_id) then
    raise exception 'platform admin required';
  end if;
  if nullif(trim(decision_reason), '') is null then
    raise exception 'decision reason required';
  end if;

  select * into application
  from public.organization_applications
  where id = application_id
  for update;

  if not found or application.status <> 'submitted' then
    raise exception 'application is not reviewable';
  end if;

  update public.organization_applications
  set status = 'rejected', reviewed_by = reviewer_id, reviewed_at = now(),
      decision_reason = reject_organization_application.decision_reason
  where id = application_id;

  insert into public.organization_audit_log (
    application_id, target_user_id, actor_id, action, reason
  ) values (
    application_id, application.applicant_id, reviewer_id,
    'application_rejected', decision_reason
  );
end;
$$;

create function public.set_organization_member_role(
  target_organization_id uuid,
  target_user_id uuid,
  target_role public.organization_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  previous_role public.organization_role;
begin
  perform 1 from public.organizations where id = target_organization_id for update;
  if not exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id
      and user_id = actor_id and role = 'owner'
  ) then
    raise exception 'organization owner required';
  end if;

  select role into previous_role from public.organization_memberships
  where organization_id = target_organization_id and user_id = target_user_id;

  if previous_role = 'owner' and target_role <> 'owner' and not exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id
      and role = 'owner' and user_id <> target_user_id
  ) then
    raise exception 'organization must retain an owner';
  end if;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (target_organization_id, target_user_id, target_role)
  on conflict (organization_id, user_id) do update set role = excluded.role;

  insert into public.organization_audit_log (
    organization_id, target_user_id, actor_id, action
  ) values (
    target_organization_id, target_user_id, actor_id,
    case when previous_role is null then 'member_added'::public.organization_audit_action
         else 'member_role_changed'::public.organization_audit_action end
  );
end;
$$;

create function public.remove_organization_member(
  target_organization_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_role public.organization_role;
begin
  perform 1 from public.organizations where id = target_organization_id for update;
  if not exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id
      and user_id = actor_id and role = 'owner'
  ) then
    raise exception 'organization owner required';
  end if;

  select role into target_role from public.organization_memberships
  where organization_id = target_organization_id and user_id = target_user_id;
  if not found then raise exception 'membership not found'; end if;

  if target_role = 'owner' and not exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id
      and role = 'owner' and user_id <> target_user_id
  ) then
    raise exception 'organization must retain an owner';
  end if;

  delete from public.organization_memberships
  where organization_id = target_organization_id and user_id = target_user_id;

  insert into public.organization_audit_log (
    organization_id, target_user_id, actor_id, action
  ) values (target_organization_id, target_user_id, actor_id, 'member_removed');
end;
$$;

revoke all on function public.reject_organization_application(uuid, text) from public;
revoke all on function public.set_organization_member_role(uuid, uuid, public.organization_role) from public;
revoke all on function public.remove_organization_member(uuid, uuid) from public;
grant execute on function public.reject_organization_application(uuid, text) to authenticated;
grant execute on function public.set_organization_member_role(uuid, uuid, public.organization_role) to authenticated;
grant execute on function public.remove_organization_member(uuid, uuid) to authenticated;
