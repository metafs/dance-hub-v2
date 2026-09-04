# DANCE HUB — Testing Strategy

**Status:** Draft
**Version:** 0.2
**Last Updated:** 2026-09-01

## Layers

- **Unit:** validation, revision transitions, Event Type date rules, Tokyo calendar boundaries.
- **Integration:** migrations, RLS, server-side authorization, approval transactions, public-query visibility.
- **E2E:** visitor discovery and the Organizer-to-Platform-Admin review journey.

## Critical journeys

- Visitor: Event list → Event detail; Artist / Venue detail → related Event.
- Organizer: apply for Organization → approval grants initial Owner → create draft → submit.
- Platform Admin: request changes or approve Revision → latest approved Revision becomes public.
- Owner / Admin: request cancellation → approval preserves the public Event with a cancellation notice.
- Member: create Artist / Venue Candidate → activation makes canonical record selectable.

## Standard validation contract

The executable command definitions and CI locations are canonical in
[code structure](code-structure.md#validation-locations). They cover application
lint/type/unit/build checks, local database and RLS tests, generated database-type
freshness, and critical E2E coverage against local Supabase in CI.

Every migration must be applicable to an empty local database with seed fixtures that cover Tokyo, Kanagawa, roles, revision states, candidates, apply Events, and Festival children.
