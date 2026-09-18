# DANCE HUB — Data Model

**Status:** Draft
**Version:** 0.3
**Last Updated:** 2026-09-02

## Core relations

```text
User -> OrganizationApplication
User -> OrganizationMembership -> Organization -> Event -> EventRevision
                                                    |        |
                                                    |        +-> EventSchedule -> Venue -> Prefecture
                                                    |        +-> EventArtist -> Artist
                                                    |        +-> TicketOffer
                                                    |        +-> TicketLink / EventLink / Media
                                                    |
                                                    +-> published_revision_id

Organization -> ArtistCandidate / VenueCandidate -> canonical Artist / Venue
AuditLog -> ReviewNotification -> recipient User
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

## Review notifications

`review_notifications` is a persistent in-app inbox for moderation outcomes. Organization and Event trusted transitions first write their existing audit record; an `AFTER INSERT` audit trigger creates the notification in the same transaction. This keeps the notification coupled to a successful, auditable decision without allowing application code or authenticated users to forge one.

Each notification snapshots its kind, reviewed subject, and decision reason and references exactly one source audit row. Organization Application outcomes target the applicant. Event Revision outcomes target the actor of that Revision's latest submission audit record. Cancellation outcomes target the request's `requested_by` User. RLS exposes a notification only to `recipient_user_id`; notification content is immutable and only `read_at` may change.

The MVP has no Email, push, external provider delivery, general announcement, or marketing notification model.

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

## Ticket offers and links

`event_ticket_offers` belongs to an Event Revision and stores structured pricing independently from `event_ticket_links`, which stores external sales or registration URLs. Neither table references the other, and Ticket Offers are not related to individual Schedules in the MVP.

```text
TicketOffer.price_type enum(fixed, free, range, donation,
                            pay_what_you_can, sliding_scale, dynamic, included)
TicketOffer.currency text nullable       -- ISO 4217 uppercase alpha-3
TicketOffer.amount_minor bigint nullable
TicketOffer.min_amount_minor bigint nullable
TicketOffer.max_amount_minor bigint nullable
TicketOffer.label text nullable
TicketOffer.notes text nullable
```

`fixed` uses one exact amount; `range` uses required minimum and maximum amounts. `free`, `donation`, `dynamic`, and `included` have no structured amount. `pay_what_you_can` may carry a minimum amount. Each `sliding_scale` price level is a separate Offer with a required human label and exact amount. All numeric values use the currency's minor unit and are non-negative.

`range` means that the stated price itself lies between two bounds. `sliding_scale` means the organizer presents distinct levels and the attendee chooses according to their situation; qualifiers and tier names remain human-authored labels rather than enums.

Ticket Offers follow the same Revision visibility and immutability rules as schedules, credits, links, and media. A published Event reads Offers only from its current approved Revision. Creating a post-publication Draft copies its Offers so later edits preserve the approved history.

## Open questions

- Online-only Event geography.
- Municipality and custom-area expansion.
- Artist claim and Company / Collective membership.
