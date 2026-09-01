# ADR-0010: Model MVP geography through Prefecture, Venue, and EventSchedule

**Status:** Accepted
**Accepted:** 2026-09-01

## Context

DANCE HUB needs location filtering without conflating a physical Venue with a geographic classification. The MVP will start with Tokyo and Kanagawa.

## Decision

- `Prefecture` is the MVP geography and discovery filter unit.
- Tokyo and Kanagawa are the only supported MVP Prefectures and use stable codes as relational values.
- Venue stores structured address fields, a Prefecture reference, and optional coordinates.
- Each EventSchedule references a Venue by ID.
- Event geography is derived through `EventSchedule -> Venue -> Prefecture`; geographic names are not copied onto Event.
- Schedule input, display, and date-filter boundaries use `Asia/Tokyo`; instants are stored as timezone-aware timestamps, and date-only/all-day schedules use Tokyo local calendar boundaries.
- A published Schedule must use a Tokyo or Kanagawa Venue. An Event with schedules in both Prefectures appears in either matching filter exactly once; draft and `apply` Events with no Schedule have no geographic discovery result.
- Custom discovery areas, municipality normalization, and online or venue-to-be-announced Event locations are deferred.

## Alternatives considered

- Store free-form regional text on Event.
- Reference one Venue directly from Event.
- Model custom discovery areas before the MVP geography is validated.

## Consequences

- Multiple Event schedules can use different Venues.
- The organizer UI should support applying one Venue to multiple Schedules.
- Location queries join schedules, Venues, and Prefectures and de-duplicate Events.

## Revisit when

- The service expands beyond Tokyo and Kanagawa.
- Users need municipality, neighborhood, or distance-based filtering.
