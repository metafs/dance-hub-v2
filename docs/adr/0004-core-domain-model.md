# ADR-0004: Use Event as the core activity entity and separate Artist from Organization

**Status:** Accepted
**Accepted:** 2026-09-01

## Context

The platform must cover performances and adjacent dance/performance activities while preserving structured relationships among creative subjects, operational organizations, venues, and schedules.

## Decision

- Use `Event` as the root time-based activity entity.
- Treat `Performance` as an Event Type.
- `Artist` includes individuals, dance companies, collectives, and other creative / performing entities.
- Keep `Artist` separate from `Organization`.
- Permit the same real-world company or collective to have both an Artist representation and an Organization representation.
- Do not require an Artist to have a User account.

## Alternatives considered

- Use `Performance` as the root entity.
- Merge Artist and Organization into one polymorphic entity.
- Treat companies / collectives only as Organizations.

## Consequences

- Creative credits and operational ownership remain conceptually clear.
- Some real-world entities may have two linked representations.
- A future optional Artist <-> Organization representation relation may be needed.

## Revisit when

- Duplicate entity management becomes confusing in real data entry.
- Company / collective membership history becomes a core product requirement.
