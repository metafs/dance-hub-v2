# ADR-0007: Publish Events through moderated revisions

**Status:** Accepted
**Accepted:** 2026-09-01

## Context

Every public Event and public change requires Platform Administrator approval. Organizers also need to prepare changes to a published Event without leaking unapproved content or removing the currently approved public page.

## Decision

- `Event` is the stable Organization-owned identity.
- Editable Event aggregate content belongs to `EventRevision`.
- `Event.published_revision_id` identifies the current approved public revision; a null value means the Event has never been published.
- Revisions use the workflow `draft`, `in_review`, `changes_requested`, `approved`, and `superseded`.
- Schedules, Artist credits, ticket data, external links, media, and proposed Festival parent changes belong to the revision under review.
- Owner, Admin, and Editor may create drafts and submit reviews. Only Platform Administrators may request changes or approve. `created_by` is immutable Revision authorship and does not itself grant access after membership changes.
- Approval atomically updates the public revision and applies approved structural changes such as Festival parent assignment.
- An approved cancellation decision sets `Event.cancelled_at` and a public cancellation reason without removing its published revision.

## Draft and review contract

A draft requires an owning Organization, creator, and title.

Review submission requires:

- title, description, and Event Type;
- a main image with alt text;
- one or more Artist credits;
- ticket or participation information; and
- either the applicable time contract below or a valid Festival child structure.

Time contract:

- `apply` Event Types require an Application Deadline and may have zero Schedules.
- Other non-Festival Event Types require one or more Schedules with a Venue and `Asia/Tokyo` timestamps.
- A Festival may be drafted without children, but requires at least one child Event with an approved, Schedule-bearing public revision before its own approval.

All review-submission requirements are rechecked at approval. A Revision which no longer satisfies them is returned as `changes_requested`; an approved Revision always becomes the public revision immediately.

Ticket or participation information means at least one valid external ticket/registration URL or an explicit `no_registration_required` value. Artist credits reference activated canonical Artists and include a role or explicit uncredited role value.

## Alternatives considered

- Publish immediately once an Organization is approved.
- Hide a published Event while an edited version is reviewed.
- Require Platform Administrators to make every published Event edit.

## Consequences

- Public readers never see unapproved Event changes.
- Event editing, media, Festival relationships, and public queries are revision-aware.
- Approval and cancellation require audit records and server-side authorization.

## Revisit when

- Review volume requires specialized reviewer roles.
- Emergency cancellation needs an explicitly approved bypass path.
