# ADR-0014: Enforce feature command dependency boundaries

**Status:** Accepted
**Accepted:** 2026-09-04

## Context

ADR-0013 assigns domain behavior to feature modules, but it does not define how feature command surfaces may depend on one another. A command importing another feature's command can bypass the owning feature's policy boundary and make authorization and workflow ownership implicit. JavaScript and JSX are also valid project source because `tsconfig.json` enables `allowJs` and Next.js accepts those extensions.

## Decision

- A feature command surface (`src/features/<feature>/commands.*`) must not import another feature's command surface.
- Cross-feature workflows must depend on explicit queries, policies, schemas, shared types, or a separately documented orchestration boundary.
- The ESLint boundary applies equally to `.js`, `.jsx`, `.ts`, and `.tsx` source files under `src` and `src/app`.
- `src/app` may not import Supabase packages directly, regardless of source extension.
- `src/ui` remains domain-agnostic and may not import feature or infrastructure code, regardless of source extension.

## Alternatives considered

- Enforce the rule only for TypeScript files.
- Allow command-to-command imports and rely on code review.
- Put all cross-feature behavior in an unowned shared services directory.

## Consequences

- Newly added JavaScript or JSX modules cannot silently bypass the same architectural boundaries.
- Cross-feature orchestration is visible in its dependency choice and can receive an explicit review.
- ESLint configuration remains the executable enforcement point while this ADR is the canonical decision record.

## Revisit when

- A cross-feature workflow requires a stable orchestration module with its own ownership, authorization contract, and tests.
