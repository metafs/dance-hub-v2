# DANCE HUB — Authentication and Authorization

**Status:** Draft
**Version:** 0.2
**Last Updated:** 2026-09-01

## Principles

- Authentication identifies a User; authorization decides an action on a resource.
- Public readers see only a stable Event's approved `published_revision_id` and public canonical Artist / Venue records.
- Every write is protected by server-side authorization and Row Level Security; UI visibility is not authorization.
- Platform Admin is a platform role, separate from Organization membership.

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

## Required policy tests

Test anonymous, same-Organization, other-Organization, each Membership role, and Platform Admin for every mutation. Test that drafts, in-review revisions, candidates, application details, and unapproved media cannot leak through public relations, queries, metadata, or storage paths.
