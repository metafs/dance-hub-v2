# DANCE HUB Agent Guide

## Project

DANCE HUB is a structured information platform for dance and performance events, artists, organizations, and venues.

## Source of truth

Before making changes, read the documentation relevant to the task:

- Product requirements: `docs/product/requirements.md`
- Product scope: `docs/product/scope.md`
- Domain language: `docs/product/glossary.md`
- Architecture: `ARCHITECTURE.md`
- Code structure and import boundaries: `docs/architecture/code-structure.md`
- Architecture decisions: `docs/adr/`
- Security: `docs/architecture/security.md`
- Pull-request label and evidence operations: `docs/ops/pull-request-labels.md`
- AI workflow: `docs/ai/workflow.md`
- Paperthin design patterns for AI work: `docs/ai/paperthin.md`

If documents disagree, do not guess. Report the conflict and use the more specific, more recently approved source only when that precedence is explicit.

## Development rules

- Do not invent product requirements.
- Prefer the smallest coherent change satisfying the acceptance criteria.
- Keep unrelated refactors out of feature changes.
- Do not introduce dependencies without a clear reason.
- Database changes must be represented as migrations.
- Never manually edit generated database types.
- Never weaken or delete tests merely to make validation pass.
- Do not bypass authorization in UI code or application code.
- Never expose or commit secrets.
- Update documentation when behavior, domain language, architecture, or operational rules change.
- Architecture changes require an ADR update or a new ADR.

## Workflow

For non-trivial tasks:

1. Inspect the relevant code and documentation.
2. Identify requirement IDs and acceptance criteria.
3. Plan before editing when the change spans multiple concerns.
4. Implement the smallest coherent change.
5. Run repository validation commands.
6. Review the diff for unrelated changes and architecture violations.
7. Report unresolved risks or uncertainty.

## Architecture boundaries

- `docs/architecture/code-structure.md` is the canonical layer and import-boundary
  contract. `eslint.config.mjs` enforces its import restrictions through `pnpm lint`.
- Keep `src/app` to routing and composition; it must reach Supabase through feature
  queries, commands, or components rather than importing a Supabase client.
- A feature command surface cannot import another feature's command surface. Use a
  cross-domain query, policy, schema, or type only when that dependency is necessary.
- Keep `src/ui` domain-agnostic. Pass display-ready props and callbacks into it rather
  than importing feature or `src/lib` code.

## Pull-request areas and evidence

Apply every matching GitHub `area:*` label. The paths below are the repository's
labeling map; details of manual label administration are in
`docs/ops/pull-request-labels.md`.

| Label | Paths / concerns |
| --- | --- |
| `area:frontend` | `src/app/**`, `src/features/**/components/**`, `src/ui/**`, `src/components/**`, `src/app/globals.css`, `tests/e2e/**` |
| `area:backend` | `src/features/**/commands.ts`, `src/features/**/queries.ts`, `src/features/**/policy.ts`, `src/features/**/schema.ts`, `src/lib/datetime/**`, `src/lib/result.ts`, `instrumentation.ts` |
| `area:db` | `supabase/**`, `src/lib/db/database.types.ts` |
| `area:auth` | `src/features/auth/**`, `src/lib/auth/**`, `src/lib/supabase/**`, `proxy.ts`, authorization or RLS changes |
| `area:infra` | `.github/**`, `package.json`, `pnpm-lock.yaml`, ESLint, TypeScript, Next.js, Playwright, or Cloudflare configuration |
| `area:docs` | `docs/**`, `README.md`, `ARCHITECTURE.md`, `AGENTS.md`, `CLAUDE.md` |

PRs carrying `area:db` and/or `area:auth` must include a new or updated negative RLS
test in `supabase/tests/database/` for each changed policy. The test must prove that a
disallowed actor cannot perform a touched read or mutation, name that actor and
operation in the PR, and record `pnpm db:verify` as validation evidence. Reviewers
must not accept UI-only authorization evidence in place of this database-level test.

## Validation

The standard application commands and their guarantees are defined in
`docs/architecture/code-structure.md`:

- Fast validation: `pnpm check`
- Full application validation: `pnpm verify`

Database/RLS validation uses `pnpm db:verify`; the CI database job also generates
database types and runs critical E2E coverage against local Supabase.

Do not claim validation passed unless the command was actually run successfully.

## Git / multi-agent workflow

Default rule:

`1 Issue = 1 Branch = 1 Worktree = 1 Primary Agent`

Do not modify another agent's active worktree. A secondary agent should normally review a diff or plan rather than edit the same working tree concurrently.
