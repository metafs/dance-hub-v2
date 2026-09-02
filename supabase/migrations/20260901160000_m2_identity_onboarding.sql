-- M2 exposes Organization onboarding through authenticated RLS and trusted
-- review transitions. Direct review-state and membership mutation stays closed.
create unique index organization_applications_one_submitted_per_applicant_idx
  on public.organization_applications (applicant_id)
  where status = 'submitted';

revoke all on public.organization_applications from public, anon;
revoke insert, update, delete on public.organization_applications from authenticated;
grant select on public.organization_applications to authenticated;
grant insert (applicant_id, name, website_url)
  on public.organization_applications to authenticated;

revoke all on public.organizations, public.organization_memberships,
  public.platform_admins from public, anon;
revoke insert, update, delete on public.organizations,
  public.organization_memberships, public.platform_admins from authenticated;
grant select on public.organizations, public.organization_memberships
  to authenticated;

-- Avoid recursive RLS evaluation when a Member reads their Organization's
-- roster. The helper runs as the table owner and is only used as a boolean
-- predicate by the Organization and Membership read policies.
create or replace function public.is_organization_member(
  target_organization_id uuid,
  check_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships
    where organization_id = target_organization_id
      and user_id = check_user
  )
$$;

drop policy "members read organizations" on public.organizations;
create policy "members read organizations"
  on public.organizations for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(id));

drop policy "members read memberships" on public.organization_memberships;
create policy "members read memberships"
  on public.organization_memberships for select to authenticated
  using (
    public.is_platform_admin()
    or public.is_organization_member(organization_id)
  );

revoke all on function public.approve_organization_application(uuid, text) from public;
revoke all on function public.reject_organization_application(uuid, text) from public;
grant execute on function public.approve_organization_application(uuid, text) to authenticated;
grant execute on function public.reject_organization_application(uuid, text) to authenticated;
