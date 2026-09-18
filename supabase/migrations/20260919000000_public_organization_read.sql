-- REQ-EVENT-002 lets a public Event detail name its 主催 Organization, and
-- REQ-DISCOVERY-003 requires searching by Organization name. Neither was
-- implementable: 20260901090000 revoked public.organizations from anon and
-- granted select to authenticated only, with a member / Platform Admin policy
-- on top, so an anonymous Visitor could not read a single Organization row.
--
-- Expose the minimum that satisfies both requirements: the id and name of
-- Organizations that own at least one published Event. An Organization with no
-- published Event stays invisible, so applicants whose Organization has not
-- published are not disclosed, and website_url is withheld from anon so this
-- does not become the public Organization profile that docs/product/scope.md
-- defers past the MVP.
--
-- The policy covers authenticated as well, because a signed-in Visitor reads
-- the same public Event page. Column privileges are per role rather than per
-- policy, and authenticated keeps the table-wide select grant it already had,
-- so a signed-in non-member can read every column of an Organization that has
-- published an Event where anon reads only id and name.
--
-- The condition is an inline EXISTS rather than a SECURITY DEFINER helper like
-- is_current_published_event_revision. That helper exists because the public
-- Event and Revision policies referenced each other's RLS-protected table;
-- this policy only reads public.events, which anon may already select and
-- whose own policy resolves through that helper, so there is no recursion to
-- break. Keeping it inline also adds no database function, which keeps the
-- generated database types unchanged.

grant select (id, name) on public.organizations to anon;

create policy "public reads publishing organizations"
  on public.organizations for select to anon, authenticated
  using (
    exists (
      select 1
      from public.events event
      where event.owner_organization_id = organizations.id
        and event.published_revision_id is not null
    )
  );
