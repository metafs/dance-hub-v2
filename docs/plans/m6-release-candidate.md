# M6 — Release candidate

**Status:** Planned

**Understood as:** M6 turns the completed MVP journeys into an operable, accessible, observable, and recoverable production candidate.

## Requirements

- REQ-AUTH-001
- REQ-MEDIA-001
- REQ-AUDIT-001
- All M1 through M5 completion criteria

## Acceptance criteria

- Metadata, Open Graph, sitemap, semantic structure, keyboard/focus behavior, responsive layouts, and field errors are production-ready.
- Media upload and delivery satisfy the independent gate in `docs/plans/media-delivery.md`.
- Cloudflare staging runs Organizer, Platform Admin, and anonymous critical journeys.
- Deployment, migration rollback, media recovery, and moderation operations have tested runbooks.
- Security checks cover public information leakage and storage paths.
- The complete `pnpm verify` contract and accessibility checks pass for the release candidate.

## Implementation steps

1. Close accessibility and responsive defects found on the critical journeys.
2. Complete metadata and crawler-facing public surfaces.
3. Exercise the Cloudflare staging deployment and media path.
4. Write and rehearse deployment, rollback, recovery, and moderation runbooks.
5. Record known constraints and produce the release checklist.

## Completion criteria

All release gates in `docs/plans/mvp-implementation-roadmap.md` have reproducible evidence and no high-severity open blocker.
