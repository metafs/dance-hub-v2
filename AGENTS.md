# DANCE HUB Agent Guide

## Project

DANCE HUB is a structured information platform for dance and performance events, artists, organizations, and venues.

## Source of truth

Before making changes, read the documentation relevant to the task:

- Product requirements: `docs/product/requirements.md`
- Product scope: `docs/product/scope.md`
- Domain language: `docs/product/glossary.md`
- Architecture: `ARCHITECTURE.md`
- Architecture decisions: `docs/adr/`
- Security: `docs/architecture/security.md`
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

## Validation

The repository will expose two standard commands once the application scaffold is installed:

- Fast validation: `pnpm check`
- Full validation: `pnpm verify`

Do not claim validation passed unless the command was actually run successfully.

## Git / multi-agent workflow

Default rule:

`1 Issue = 1 Branch = 1 Worktree = 1 Primary Agent`

Do not modify another agent's active worktree. A secondary agent should normally review a diff or plan rather than edit the same working tree concurrently.
