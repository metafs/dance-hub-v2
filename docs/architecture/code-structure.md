# DANCE HUB - Code Structure and Dependency Boundaries

**Status:** Draft  
**Last Updated:** 2026-09-03  
**Decision basis:** [ADR-0013](../adr/0013-use-feature-modules-for-application-domains.md)

## Purpose

This is the canonical source for application-layer ownership, allowed dependency
directions, and the lint rules that make those boundaries executable. Product behavior
remains defined by the product requirements and accepted ADRs.

## Layer ownership

| Layer | Owns | May depend on |
| --- | --- | --- |
| `src/app` | App Router routes, metadata, route-facing action re-exports, and composition | Owning feature `commands`, `queries`, or `components` modules; `src/ui`; framework code; and app-local code |
| `src/features/<domain>` | Domain-specific commands, queries, policies, schemas, and components | Its own code; necessary cross-domain queries, policies, schemas, and types; `src/lib`; `src/ui`; framework code |
| Feature command surface | `commands.ts`, `commands.tsx`, and `commands/` within one feature | Its own command surface and the permitted feature dependencies above, but never another feature's command surface |
| `src/lib` | Shared infrastructure and cross-domain primitives | Other shared infrastructure and framework/vendor code |
| `src/ui` | Domain-agnostic presentation and interaction primitives | Other UI-local modules, framework, and vendor code only |

The intended dependency flow is `app -> features -> lib`, with both `app` and
`features` allowed to depend on `ui`. `ui` stays independent of feature and library
code.

An entry surface is a feature module imported outside its own domain. Routes compose
existing behavior through feature commands, queries, or components. Cross-feature code
uses a query, policy, schema, or type only when that dependency is necessary. Features
have no separate public barrel module today.

### Supabase client boundary

`src/lib/supabase/**` is the project Supabase client boundary. Route code must not
import it, directly or through an alias, or import an `@supabase/*` package. A route
gets data or mutations through the owning feature's query, command, or component
surface. Feature code may use the shared client boundary as needed by its domain behavior.

`proxy.ts` is root-level authentication infrastructure, not App Router composition; it
refreshes the session with the Supabase client before rendering. This narrow exception
does not allow `src/app` to import the client.

### Cross-feature coordination

Features may import another feature's query, policy, schema, or type only when the
receiving feature needs behavior or data owned by that domain and cannot receive it
through its inputs. For example, an event revision can use the Organization
authorization policy that defines the capability it needs. Command surfaces must not
import other command surfaces: a cross-domain workflow needs a query, policy,
schema/type, or a separately defined application orchestration boundary instead.

### UI contract

`src/ui` receives display-ready values and callbacks from `src/app` or
`src/features`. It does not import features or `src/lib`, including domain types. This
keeps it reusable without exposing authorization, persistence, or domain semantics.

R3 retains `src/components/*.tsx` and `src/lib/auth/authorization.ts` as thin
compatibility re-exports of established feature entry points. They are not `src/ui` and
must not acquire new domain logic. New domain-specific components belong with their
feature; new domain-agnostic primitives belong in `src/ui`.

## Server action result convention

The current form-server-action contract redirects on validation failure, mutation
failure, and success. Successful mutations invalidate affected paths before redirecting,
with query parameters carrying route-facing status. `ActionResult` in
`src/lib/result.ts` remains the discriminated `{ ok, data }` / `{ ok: false, code,
fieldErrors?, message? }` result shape for callers that need returned data.

This convention describes existing behavior only. R4 does not migrate redirect-based
actions to `ActionResult`.

## Executable enforcement

`eslint.config.mjs` discovers feature directories and `pnpm lint` enforces:

1. `src/app/**` cannot import `src/lib/supabase/**` through project aliases
   (`import/no-restricted-paths`).
2. `src/app/**` cannot import an `@supabase/*` package
   (`no-restricted-imports`), which complements path checking for package specifiers.
3. A feature command surface cannot import any other feature's command surface
   (`import/no-restricted-paths`).
4. `src/ui/**` cannot import from `src/features/**` or `src/lib/**`
   (`import/no-restricted-paths`).

The TypeScript import resolver is configured so these checks apply equally to the
`@/` aliases used by application source. The rules apply only to the listed layer
paths. They do not restrict repository configuration or framework imports; tests
outside a restricted layer path remain free to import their test dependencies, while
tests inside one must respect that layer's boundary.

## Validation locations

| Command / location | Guarantees |
| --- | --- |
| `pnpm lint` | Next.js linting and the executable dependency boundaries above |
| `pnpm check` | Linting, type checking, and unit tests |
| `pnpm verify` | `check` plus a production build |
| `.github/workflows/ci.yml` | Runs `verify`; its database job runs database/RLS checks, generated-type freshness, and critical E2E coverage against local Supabase |

For label-specific RLS evidence, see
[Pull-request labels and evidence](../ops/pull-request-labels.md).
