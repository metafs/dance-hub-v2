-- Organization applications use column-level INSERT grants. The E-1 through
-- E-3 evidence fields must be writable by the authenticated applicant.
grant insert (responsible_party, contact, activity_url)
  on public.organization_applications to authenticated;
