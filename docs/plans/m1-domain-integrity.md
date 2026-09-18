# M1 — Domain integrity gate

**Status:** Complete

**Understood as:** M1 provides the migration, authorization, trusted-transition, and database-test contracts that all Organizer, Admin, and public UI work relies on.

## Requirements

- REQ-EVENT-003 through REQ-EVENT-008
- REQ-ARTIST-003
- REQ-ORG-001 through REQ-ORG-002
- REQ-AUTH-001
- REQ-AUDIT-001

## Acceptance criteria

- Migrations create Organization, shared Entity, Event Revision, Revision-owned content, workflow, audit, and Ticket Offer structures from an empty database.
- Organization approval preserves the initial Owner invariant, and moderation/publication changes use trusted database transitions.
- RLS separates anonymous public reads, Organization-scoped member access, and Platform Admin review access.
- Deterministic seed data covers the supported roles, Tokyo/Kanagawa geography, and critical Event workflow states.
- Database tests exercise positive and negative authorization, immutable reviewed content, publication validation, and public visibility.

## Completion evidence

M1 is maintained by the committed migration chain and `supabase/tests/database`. `pnpm db:verify` is the executable completion gate.
