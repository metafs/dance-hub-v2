# DANCE HUB — Data Model

**Status:** Draft
**Version:** 0.2
**Last Updated:** 2026-09-01

## Core relations

```text
User -> OrganizationApplication
User -> OrganizationMembership -> Organization -> Event -> EventRevision
                                                    |        |
                                                    |        +-> EventSchedule -> Venue -> Prefecture
                                                    |        +-> EventArtist -> Artist
                                                    |        +-> Ticket / Link / Media
                                                    |
                                                    +-> published_revision_id

Organization -> ArtistCandidate / VenueCandidate -> canonical Artist / Venue
```

## Organizations and platform authority

`organization_memberships` relates a User to an Organization with `owner`, `admin`, or `editor`. At least one owner is required. `platform_admins` is a separate platform-wide role and must not be inferred from Membership.

`organization_applications` records the applicant, submitted metadata, decision, reviewer, and reason. Approving an application creates the Organization and its first owner Membership in one transaction; a rejected application creates neither.

## Event and Event Revision

`events` holds stable identity, owning Organization, `published_revision_id`, and cancellation fields. Mutable public content belongs to `event_revisions`.

```text
EventRevision.status enum(draft, in_review, changes_requested, approved, superseded)
EventRevision.event_type enum(performance, open_studio, talk, workshop,
                              audition, open_call, residency, festival, other)
EventRevision.application_deadline timestamptz nullable
EventRevision.proposed_parent_event_id Event nullable
```

Approval atomically changes `Event.published_revision_id`; the formerly published revision remains available for audit. A cancellation request and reason are reviewed and, once approved, set the stable Event cancellation fields without removing the published revision.

Event Type Group is an application mapping, not a database enum: `watch`, `participate`, `apply`, `container`, `other`. `apply` revisions require `application_deadline` and may have no schedules. A non-Festival revision requires a Schedule for publication. A Festival may be drafted without children, but needs an approved child with a Schedule before publication.

## Schedules, venues, and geography

`event_schedules` belongs to an Event Revision and references a required `venue_id`. A Venue holds structured address, `prefecture_code`, and optional coordinates. MVP permits only `TOKYO` and `KANAGAWA`; region filtering is derived through Schedule → Venue → Prefecture, never copied onto Event.

Schedule instants are stored as timezone-aware values. Input, calendar boundaries, display, and filtering use `Asia/Tokyo`.

## Artists, venues, and candidates

Artist is an independent entity with types Individual, Company, Collective, and Other; it does not require a User account. `event_artists` belongs to a Revision and stores Artist, credit, and display order.

Artist and Venue are shared canonical records, not Organization-owned editable rows. Members create `artist_candidates` or `venue_candidates`; only their creator Organization and Platform Admin can see a pending candidate. Platform Admin can activate, reject, correct, or merge it. Edits to an active canonical record are separate reviewed change requests. Organization–Artist representation links are deferred.

## Festival relation

The Festival parent is proposed on the child Event Revision and copied to the stable child Event only on approval. A parent must be `festival`, a child cannot be `festival`, nesting is one level, and parent and child must have the same owning Organization in MVP.

## Media

`event_media` belongs to an Event Revision. The schema supports ordered multiple media, while the MVP editor and publication validation expose exactly one main image with required alt text.

## Open questions

- Online-only Event geography.
- Municipality and custom-area expansion.
- Artist claim and Company / Collective membership.
