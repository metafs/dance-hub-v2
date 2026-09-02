# DANCE HUB — Glossary

**Status:** Draft
**Version:** 0.3
**Last Updated:** 2026-09-02

## Core terms

**Event**: stable identity for an activity; its mutable content lives in Event Revisions.
**Event Revision**: a versioned editable aggregate of Event details, schedules, credits, Ticket Offers, Ticket Links, external links, media, and proposed Festival parent.
**Published revision**: the approved Revision referenced by `Event.published_revision_id`; the only Revision visible publicly.
**Schedule**: one physical occurrence of a Revision; it references a Venue and has Tokyo-time start/end instants.
**Application Deadline**: application closing time for an `apply` Event; it is not a Schedule or a Calendar date.
**Venue**: a shared physical place with address, Prefecture, and optional coordinates.
**Prefecture**: MVP geographic unit; only Tokyo and Kanagawa are supported initially.
**Artist**: a creative or performing subject, including Individual, Company, Collective, or Other; it is not necessarily a User.
**Organization**: operational/publishing entity for an Event; it is distinct from Artist.
**Organization Application**: a request which, on approval, atomically creates an Organization and initial Owner Membership.
**Organization Member**: a User's Owner, Admin, or Editor relationship to an Organization.
**Platform Admin**: platform-wide reviewer role, separate from Organization Membership.
**Candidate**: a pending Artist or Venue record, visible only to its creator Organization and Platform Admin until activation.
**Change request**: reviewed change to an active canonical Artist or Venue.
**Credit**: an Artist's role in an Event Revision.
**Ticket Offer**: pricing information owned by an Event Revision. It describes a fixed, free, ranged, donation, pay-what-you-can, sliding-scale, dynamic, or included offer without selling the ticket.
**Ticket Link**: an external ticket-sales or registration URL owned by an Event Revision. It is independent from Ticket Offers.
**Festival**: an Event Type that groups same-Organization child Events for one level.
**Cancelled Event**: a publicly retained Event with an approved cancellation time and reason.
**Past Event**: derived status: an `apply` deadline has passed, normal Event schedules have ended, or a Festival's child schedule range has ended.

## Revision states

`draft` is editable; `in_review` awaits a Platform Admin decision; `changes_requested` is editable after feedback; `approved` may be public; `superseded` is a retained earlier approved Revision.

## Important distinctions

- Event ≠ Event Revision
- Event ≠ Schedule
- Ticket Offer ≠ Ticket Link
- Schedule ≠ Application Deadline
- Artist ≠ User
- Artist ≠ Organization
- Organization Member ≠ Platform Admin
- Candidate ≠ canonical Artist / Venue
- Past Event ≠ Cancelled Event
- Authentication ≠ Authorization
