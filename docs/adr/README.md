# Architecture Decision Records

ADRs capture architectural decisions that should remain understandable to future humans and AI agents.

## Status values

- Proposed
- Accepted
- Superseded
- Rejected

## Records

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-use-nextjs.md) | Use Next.js for the application framework | Accepted |
| [0002](0002-use-supabase-postgres.md) | Use Supabase PostgreSQL and Auth | Accepted |
| [0003](0003-use-cloudflare.md) | Use Cloudflare for application delivery and media | Accepted |
| [0004](0004-core-domain-model.md) | Use Event as the core activity entity and separate Artist from Organization | Accepted |
| [0005](0005-moderated-shared-entities.md) | Moderate shared Artist and Venue records through candidates | Accepted |
| [0006](0006-organization-approval-workflow.md) | Create Organizations through approved applications | Accepted |
| [0007](0007-moderated-event-revisions.md) | Publish Events through moderated revisions | Accepted |
| [0008](0008-event-type-taxonomy.md) | Use a flat Event Type enum with application-layer grouping | Accepted |
| [0009](0009-festival-child-events.md) | Model Festival as a one-level parent Event | Accepted |
| [0010](0010-geography-venue-schedule.md) | Model geography through Prefecture, Venue, and EventSchedule | Accepted |
| [0011](0011-separate-ticket-offers-from-ticket-links.md) | Separate structured Ticket Offers from external Ticket Links | Accepted |
| [0012](0012-use-authored-global-css.md) | Use authored global CSS for the MVP frontend | Accepted |
| [0012](0012-use-native-runtime-validation.md) | Use native TypeScript runtime validation for environment configuration | Accepted |
| [0013](0013-use-feature-modules-for-application-domains.md) | Use feature modules for application domains | Accepted |

## Template

1. Context
2. Decision
3. Alternatives considered
4. Consequences
5. Revisit when
