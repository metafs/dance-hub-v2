# ADR-0008: Event Type as a flat required enum with application-layer grouping

**Status:** Accepted
**Accepted:** 2026-09-01

## Context

`docs/product/requirements.md` Open Questions asked whether Open Call / Residency recruitment should be treated as Events. The decision was to treat them as Events, but to distinguish them from Performance and the other existing types. REQ-EVENT-004 previously listed seven provisional values with no decision on cardinality, storage, or extensibility.

Adding recruitment to the type list is not just a longer enum. The existing types all describe something a visitor attends on a given date. A recruitment listing is something an applicant responds to by a deadline, and its date of execution is frequently unknown at publication time. That difference collides with two existing definitions: REQ-EVENT-003, whose Schedule means "開催日時", and the glossary's Past Event, defined as "すべてのScheduleが過去となったEvent" — a definition under which a recruitment listing with no Schedule never becomes past.

## Decision

### Values

Event Type has nine values:

`performance`, `open_studio`, `talk`, `workshop`, `audition`, `open_call`, `residency`, `festival`, `other`.

`open_call` and `residency` are new; the rest carry over from REQ-EVENT-004.

`residency` is kept separate from `open_call` even though a residency call is arguably a kind of open call, because residencies carry their own concerns (stay period, host location) and are searched for as a distinct category. One extra enum value is cheaper than losing that filter path.

### Cardinality

Event Type is single-valued and required. Composite events ("公演＋アフタートーク") are expressed as the dominant type plus body text. Multi-valued typing would make the list UI unable to say what an event is, and would make REQ-DISCOVERY-004 filter results counterintuitive. A tag-style multi-value axis remains available post-MVP as a separate concept.

### Storage and grouping

Event Type is a flat PostgreSQL enum. Grouping (`watch` / `participate` / `apply` / `container` / `other`) is an application-layer mapping, not a database structure.

Grouping stays in the application layer because regrouping must not require a migration. The enum keeps DB/TypeScript type sharing (NFR-TYPE-001), and display labels belong in the application layer.

Adding a value costs one `ALTER TYPE ... ADD VALUE` migration, which satisfies REQ-EVENT-004's extensibility requirement.

### Consequences of the `apply` group

The group boundary is where date semantics change, so three rules follow:

- Events in the `apply` group carry a required application deadline (REQ-EVENT-008), stored separately from Schedule.
- Events in the `apply` group may have zero Schedules; an undetermined execution date is a normal published state, not incomplete data (REQ-EVENT-003).
- Past-event determination branches by group: `apply` events are past once the deadline passes; all others once every Schedule is past (REQ-EVENT-007). The glossary definition of Past Event is updated accordingly.

The Calendar (REQ-DISCOVERY-001) covers execution dates only. Application deadlines are surfaced through a separate deadline-ordered listing (REQ-DISCOVERY-006), so that "what is happening on this day" does not get mixed with "what closes on this day".

### Values deliberately excluded from MVP

- `class` (定期クラス): recurring weekly schedules do not fit the EventSchedule model and would need recurrence rules; volume would also dominate the listings. Deferred to Later.
- `screening`, `exhibition`: absorbed by `performance` / `other` until real volume justifies separation.
- `competition`: decomposed into an `open_call` for the application phase and a `performance` for the final round, rather than a single record serving two unrelated audiences.

## Alternatives considered

- A lookup table instead of an enum, allowing values to be added at runtime: rejected because it weakens DB/application type sharing (NFR-TYPE-001) for a list that is small, closed, and rarely changed.
- A two-level type hierarchy in the database (group + type as related tables): rejected as unnecessary structure; the Region precedent shows the flat-enum-plus-mapping approach already works here.
- Multi-valued Event Type: rejected as described under Cardinality.
- Storing the application deadline as a Schedule row with a kind discriminator: rejected because every Schedule consumer (calendar, date filter, past determination) would then need to filter by kind, and a missed filter puts deadlines into the calendar — the exact failure this decision is trying to prevent.
- Keeping recruitment listings out of the Event model entirely: contradicts the already-decided answer to the Open Question.

## Consequences

- `Event` gains a nullable `application_deadline` column, required at the application layer when the type is in the `apply` group. The constraint is not expressible as a simple NOT NULL.
- Past-event determination is no longer a single expression over Schedules; queries and any future index strategy must account for both branches.
- The glossary's Past Event definition and the Event definition both change, and Schedule vs. Application Deadline becomes a distinction worth stating explicitly.
- `festival` sits in the enum at a different semantic level than the other eight values: it describes structural role, not activity. This is accepted as the cost of the Festival decision in ADR-0009; the display rules there keep it from confusing Discovery.
- `other` absorbs screening, exhibition, and anything unforeseen, so it needs periodic review to spot values worth promoting.

## Revisit when

- `other` accumulates enough volume of one recognizable kind to justify a new value.
- Regular classes become a product requirement, which would force the recurrence-rule question deferred here.
- A tag-style secondary classification is needed, at which point the single-value constraint should be re-examined rather than worked around.
