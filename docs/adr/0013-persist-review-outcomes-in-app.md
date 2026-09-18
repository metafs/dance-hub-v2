# ADR-0013: Persist review outcomes in an in-app inbox

**Status:** Accepted
**Accepted:** 2026-09-03

## Context

Organization and Event moderation already records decisions, but the submitting organizer has no direct way to discover an outcome. External Email or push delivery would add provider operations, delivery state, and personal-data handling that the MVP does not otherwise require.

## Decision

- Persist Organization Application, Event Revision, and cancellation review outcomes in a first-party Workspace inbox.
- Derive each notification from the corresponding audit-log insert, in the same database transaction as the trusted transition.
- Address Organization Application outcomes to the applicant, Revision outcomes to that Revision's latest submitting actor, and cancellation outcomes to the requester.
- Snapshot the reviewed subject and decision reason. Notification content and source identity are immutable; the recipient may change only read state.
- Enforce recipient-only reads with RLS. Authenticated clients cannot insert or delete notifications.
- Do not add Email, push, external delivery providers, general announcements, or marketing notifications in the MVP.

## Alternatives considered

- Display outcome state only when the organizer revisits each application or Event.
- Send Email directly from review Server Actions.
- Add a generic notification and delivery system before defining the moderation use case.

## Consequences

- A successful moderation transition and its notification cannot diverge transactionally.
- A user removed from an Organization can still read the outcome they personally submitted without gaining access to the Organization's private data.
- The inbox is pull-based; delivery guarantees and provider retries are unnecessary for the MVP.

## Revisit when

- Users need timely Email or push delivery in addition to the in-app record.
- General announcements require a separate audience and publishing model.
