# M5 — Public discovery

**Status:** Planned

**Understood as:** Visitors discover only the current approved Revision while past and cancelled Events remain findable and clearly labelled.

## Requirements

- REQ-EVENT-001 through REQ-EVENT-004
- REQ-EVENT-007
- REQ-DISCOVERY-001 through REQ-DISCOVERY-003
- REQ-ARTIST-001 through REQ-ARTIST-002
- REQ-VENUE-001

## Acceptance criteria

- Anonymous users can browse Event lists and details backed only by the approved `published_revision_id`.
- Date, Tokyo/Kanagawa, Event Type, and text filters follow the rules in `docs/product/requirements.md`.
- Artist and Venue details expose related approved Events without leaking pending data.
- Apply Events have a deadline-ordered path; Festival dates derive from eligible child Events.
- Past and cancelled Events remain public with accurate state labels.
- Anonymous E2E covers Schedule-free apply Events, multiple Venues, Festival, archive, and cancellation boundaries.

## Implementation steps

1. Define public query modules for the approved Revision projection and discovery filters.
2. Build Event list/detail, Artist detail, Venue detail, Calendar, and application-deadline views.
3. Add URL-backed filters and Tokyo calendar-boundary unit tests.
4. Add negative visibility and anonymous critical-journey E2E.

## Dependencies

- M1 database contracts and M4 publication workflow are complete.
- Public main-image delivery depends on `docs/plans/media-delivery.md`.

## Completion criteria

The M5 anonymous journeys and repository verification contract pass in CI without exposing non-approved Revision content.
