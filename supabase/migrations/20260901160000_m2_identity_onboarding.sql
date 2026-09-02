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

revoke all on function public.approve_organization_application(uuid, text) from public;
revoke all on function public.reject_organization_application(uuid, text) from public;
grant execute on function public.approve_organization_application(uuid, text) to authenticated;
grant execute on function public.reject_organization_application(uuid, text) to authenticated;
