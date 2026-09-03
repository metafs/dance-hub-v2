# ADR-0013: Use feature modules for application domains

**Status:** Accepted
**Accepted:** 2026-09-03

## Context

The initial application placed route composition, domain queries, server commands, authorization checks, and domain-specific components together under `src/app`. This made route files responsible for behavior beyond routing and made domain boundaries difficult to inspect without changing the established runtime and database contracts.

## Decision

- Keep `src/app` limited to App Router composition, routing, and thin compatibility adapters for route-facing server action module paths.
- Group implemented domain behavior under `src/features/<domain>/`.
- Keep each feature's schema, queries, commands, policies, and domain-specific components together when that concern exists.
- Retain `src/lib` for shared infrastructure and cross-domain primitives.
- Put components in `src/ui` only when they are domain-agnostic.

This change preserves existing behavior, routes, server action contracts, authorization, database access, and cache invalidation.

## Alternatives considered

- Continue adding domain logic directly to route modules.
- Move all application behavior into a generic services layer.
- Move all reusable-looking components into a shared UI directory.

## Consequences

- Route files are concise entry points while domain ownership is visible from the source tree.
- Existing callers can keep importing retained route action paths during the transition.
- Features remain application modules rather than separate deployable services.

## Revisit when

- Cross-domain workflows require an explicitly defined application-layer orchestration boundary.
- A shared UI component is demonstrably used by more than one domain.
