# p8ce — Authentication and Authorization

**Status:** Draft
**Version:** 0.3
**Last Updated:** 2026-09-25

## Principles

- Authentication identifies a User; authorization decides an action on a resource.
- Public readers see only a stable Event's approved `published_revision_id` and public canonical Artist / Venue records.
- Every write is protected by server-side authorization and Row Level Security; UI visibility is not authorization.
- Platform Admin is a platform role, separate from Organization membership.

## Accounts

[ADR-0025](../adr/0025-organizer-accounts-by-invitation.md) decides how an account comes to exist.

- During the closed beta, a Platform Admin invites an Organizer from `/admin/invitations`; the invitation is the only way an account is created. Supabase Auth sign-up is disabled (`enable_signup = false` locally, the dashboard setting in production). Open sign-up with email confirmation is added before general launch.
- Anyone can ask for a password reset from `/password/forgot`. The answer is the same whether or not the address has an account.
- Every account email links to `/auth/confirm?token_hash=…&type=invite|recovery`. The route verifies the token, signs the person in, and continues to `/account/password`, which the application chooses by link type; the link carries no destination. The email text is in `supabase/templates/`.
- The invitation calls the Auth admin API with the service role, only after `requirePlatformAdmin()`.

## Organization role matrix

| Action | Owner | Admin | Editor |
| --- | --- | --- | --- |
| Edit Organization profile | Yes | Yes | No |
| Manage Owners / Admins / Editors | Yes | No | No |
| Create, edit, submit Event Revision | Yes | Yes | Yes |
| Create Artist / Venue Candidate | Yes | Yes | Yes |
| Request Event cancellation | Yes | Yes | No |
| Approve Application, Candidate, or Revision | No | No | No |

An Owner may not remove or demote the last Owner. Membership management UI beyond this core matrix may be deferred, but the authorization rules are MVP requirements.

## Platform Admin authority

Platform Admin reviews Organization Applications; approves, rejects, corrects, and merges Artist / Venue Candidates and canonical change requests; reviews Event Revisions and cancellation requests; and records decision reasons. It does not obtain an Organization's ordinary content-editing permission merely by being a Platform Admin.

## Lifecycle access

- An authenticated User may submit an Organization Application.
- Before approval, no Organization or Member permissions exist.
- On approval, the Organization and initial Owner Membership are created atomically.
- Owner / Admin / Editor may view and change their Organization's draft and changes-requested Revisions, and submit them.
- Only Platform Admin may move a Revision to `approved` or `changes_requested`, and only approval can change the public revision pointer.
- Candidate records are invisible to other Organizations and anonymous users until activated.
- A review notification is visible only to its recipient. Authenticated users cannot create, delete, or change notification content; the recipient may change only `read_at`.

## Required policy tests

Test anonymous, same-Organization, other-Organization, each Membership role, and Platform Admin for every mutation. Test that drafts, in-review revisions, candidates, application details, review notifications, and unapproved media cannot leak through public relations, queries, metadata, or storage paths.
