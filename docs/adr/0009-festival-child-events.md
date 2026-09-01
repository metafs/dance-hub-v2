# ADR-0009: Model Festival as a self-referencing parent Event, limited to one level and one Organization

**Status:** Proposed

## Context

`docs/product/requirements.md` Open Questions asked whether a Festival contains child Events or is merely an Event Type. The decision was that Festival is an Event Type *and* holds child Events, so the structure has to be expressed within the Event model rather than by a separate container entity.

Two questions follow from that: how the parent-child relation is stored, and what a Festival plus its children look like in Discovery, where naive handling shows the same performance twice — once inside the festival and once on its own.

## Decision

### Structure

```text
Event.parent_event_id   uuid null references Event(id)
```

A self-referencing foreign key, not a join table. No requirement exists for one Event to belong to several Festivals, so a many-to-many relation would add ambiguity without buying anything.

Constraints:

- Only an Event with `type = festival` may be a parent.
- A child's `type` must not be `festival`.
- Nesting is limited to one level: an Event that has children may not itself have a parent. This also removes any possibility of cycles.
- For MVP, parent and child must share the same `owner_organization_id`.

### Discovery

- The Calendar and date filtering (REQ-DISCOVERY-001) operate on child Events. Children are what have concrete dates and venues.
- The Event list shows a Festival as a single entry spanning its period, derived from the min/max of its children's Schedules. The children are listed on the Festival detail page.
- Filtering by `type = performance` returns child Events, never the Festival that contains them.

## Alternatives considered

- A separate `Festival` entity with Events pointing at it: rejected because the decision already fixed Festival as an Event Type, and because a Festival still needs the ordinary Event affordances (detail page, description, media, SEO metadata) that it would otherwise have to duplicate.
- A `festival_event` join table: rejected as unnecessary; see Structure above. It remains the migration path if cross-festival participation is ever required.
- Unlimited nesting depth: rejected. Multi-level festival programs are rare, cycle prevention and recursive queries are real costs, and one level covers the observed structure.
- Allowing children owned by other Organizations from the start: rejected for MVP because it opens an authorization question of the same kind as ADR-0005 — who may attach whose Event to whose Festival, and who may detach it. That deserves its own decision rather than being settled implicitly here.

## Consequences

- Real festivals routinely include partner performances produced by other organizations. Under this decision those cannot be modeled as children; the festival organizer must either register them under its own Organization or leave them unlinked. This is a known limitation, not an oversight, and is the most likely reason to revisit.
- `festival` is a structural value inside an otherwise activity-based Event Type enum (see ADR-0008). The Discovery rules above are what keep that from surfacing as duplicate or missing listings.
- A Festival's displayed period depends on its children, so a Festival with no children has no date to show. The UI needs a defined state for that.
- Deleting or cancelling a parent Festival raises a question about its children that the current Event Status model does not answer; cancellation does not propagate automatically.

## Revisit when

- Festivals with participating Events from other Organizations become a real onboarding need.
- Multi-level program structures (a festival containing a named program containing performances) appear in actual data.
