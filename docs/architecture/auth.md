# DANCE HUB — Authentication and Authorization

**Status:** Draft

## Principles

- Authentication answers who the user is.
- Authorization answers what the user may do.
- Public published content does not require login.
- Organizer writes require an authenticated User and an authorized OrganizationMembership.
- Authorization must not rely on UI visibility alone.
- Venue / Artistの編集権はowner_organization_id（作成したOrganization）に限定する。Administratorはowner_organization_idに関わらず編集できる。
- Eventの公開操作は、所属OrganizationがAdministrator承認済み（status = approved）であることを条件とする。

## Initial roles

- Owner
- Admin
- Editor

Exact permissions remain to be specified before implementation.