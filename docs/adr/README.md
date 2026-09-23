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
| [0014](0014-persist-review-outcomes-in-app.md) | Persist review outcomes in a first-party inbox | Accepted |
| [0015](0015-enforce-feature-command-boundaries.md) | Enforce feature command dependency boundaries | Accepted |
| [0016](0016-event-main-image-delivery.md) | Event main-image upload and delivery on R2 | Accepted |
| [0017](0017-no-quality-judgment-in-listing-review.md) | 掲載審査で作品の質を判断しない | Accepted |
| [0018](0018-publication-states-and-withdrawal.md) | 公開状態と取り下げ | Accepted |
| [0019](0019-rename-service-to-p9e.md) | サービス名を p9e に変更する | Superseded by [0021](0021-rename-service-to-p8ce.md) |
| [0020](0020-discovery-text-search.md) | 探索のテキスト検索を射影上で行う | Accepted |
| [0021](0021-rename-service-to-p8ce.md) | サービス名を p8ce とする | Accepted |
| [0022](0022-editorial-ui-foundation.md) | 無彩色の UI 基盤と Instrument Sans の同梱 | Accepted |
| [0023](0023-server-error-logging.md) | サーバーエラーを Workers Logs に構造化して記録する | Proposed |
| [0024](0024-permanent-urls-use-uuid.md) | 恒久 URL に UUID を使う | Accepted |

## Template

1. Context
2. Decision
3. Alternatives considered
4. Consequences
5. Revisit when
