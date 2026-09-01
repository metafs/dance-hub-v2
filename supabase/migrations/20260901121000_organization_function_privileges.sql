-- Organization mutations are exposed only to signed-in callers. Each function
-- performs its own role check, while anonymous and PUBLIC execution stay closed.
revoke all on function public.approve_organization_application(uuid, text) from public;
grant execute on function public.approve_organization_application(uuid, text) to authenticated;
