# p8ce — Testing Strategy

**Status:** Draft
**Version:** 0.2
**Last Updated:** 2026-09-01

## Layers

- **Unit:** validation, revision transitions, Event Type date rules, Tokyo calendar boundaries.
- **Integration:** migrations, RLS, server-side authorization, approval transactions, public-query visibility.
- **E2E:** visitor discovery, the Organizer-to-Platform-Admin review journey, and account creation by invitation and password reset (`tests/e2e/organizer-invitation.spec.ts`), which reads the emails from the local stack's Mailpit (`MAILPIT_URL`, default `http://127.0.0.1:54324`).
- **Accessibility:** `tests/e2e/accessibility.spec.ts` runs axe (WCAG 2.2 A/AA rules) on the public, Organizer and Platform Admin pages at 1280px and 390px, checks 320px reflow, visible keyboard focus, focus on the first form error, the skip link, and 3:1 contrast for field borders. Any axe violation fails the run. The design rules it enforces are in `docs/design/ui.md` (アクセシビリティ).

## Critical journeys

- Visitor: Event list → Event detail; Artist / Venue detail → related Event.
- Organizer: apply for Organization → approval grants initial Owner → create draft → submit.
- Platform Admin: request changes or approve Revision → latest approved Revision becomes public.
- Owner / Admin: request cancellation → approval preserves the public Event with a cancellation notice.
- Member: create Artist / Venue Candidate → activation makes canonical record selectable.

## Standard validation contract

Once tooling is installed:

- `pnpm check`: lint, typecheck, and unit tests.
- `pnpm verify:app`: `check` and the production build.
- `pnpm verify:database`: reset and test the running local database, then run critical E2E. In CI the E2E run builds the application and tests `next start`, the production server; locally it starts `pnpm dev` or reuses a running server.
- `pnpm verify`: the complete `verify:app` and `verify:database` contract.

Database verification assumes local Supabase is running and the application environment points to it. CI installs the browser and exports the local Supabase URL and publishable key before invoking `verify:database`.

Every migration must be applicable to an empty local database with seed fixtures that cover Tokyo, Kanagawa, roles, revision states, candidates, apply Events, and Festival children.
