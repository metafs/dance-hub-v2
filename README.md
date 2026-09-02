# DANCE HUB

DANCE HUB is a structured information platform for dance and performance events, artists, organizations, and venues. Public Event data is released through reviewed revisions.

## Documentation

- Product requirements: `docs/product/requirements.md`
- Product scope: `docs/product/scope.md`
- Domain glossary: `docs/product/glossary.md`
- Architecture overview: `ARCHITECTURE.md`
- Accepted architecture decisions: `docs/adr/README.md`
- MVP implementation roadmap: `docs/plans/mvp-implementation-roadmap.md`
- AI development workflow: `docs/ai/workflow.md`

## Agent entry points

- Codex and shared repository rules: `AGENTS.md`
- Claude Code additions: `CLAUDE.md`

## Status

## Development

Prerequisites: Node.js 22, pnpm 9.7, and a Docker-compatible runtime for local Supabase.

```bash
pnpm install
pnpm db:start
pnpm dev
```

`pnpm check` runs lint, type checking, and unit tests. `pnpm verify:app` adds the production build, `pnpm verify:database` resets and tests a running local Supabase instance before critical E2E, and `pnpm verify` runs both verification groups. `pnpm db:reset` rebuilds the local database from committed migrations and seed data.

The first migration creates Organization Applications, Organizations, Memberships, Platform Admins, and canonical Tokyo / Kanagawa Venues. Organization approval must use `approve_organization_application`, which creates the Organization and initial Owner in the same transaction.

Cloudflare compatibility is exercised with `pnpm cf:build` and `pnpm cf:preview`. Deployment credentials are intentionally not part of this repository.
