# ADR-0002: Use Supabase PostgreSQL and Auth

**Status:** Proposed

## Context

The product is relation-heavy and requires Event, Artist, Organization, Venue, schedules, memberships, permissions, archive queries, and future analytical use.

## Decision

Use PostgreSQL through Supabase for the primary database and Supabase Auth for authentication.

## Alternatives considered

- Cloudflare D1
- Managed PostgreSQL without Supabase Auth
- Firebase / document database

## Consequences

- PostgreSQL relational modeling and constraints are available.
- RLS can be used for organization-scoped authorization.
- Schema and policies must be managed by migrations.
- Generated database types should be used instead of hand-written catch-all types.

## Revisit when

- Supabase operational constraints become material.
- Authentication requirements exceed the selected service.
