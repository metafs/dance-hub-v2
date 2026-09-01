# DANCE HUB — MVP Implementation Roadmap

**Status:** Draft
**Last Updated:** 2026-09-01

## Goal

承認済みの設計判断を、小さく検証可能で依存関係が明確な PR に分けて MVP を実装する。各 PR は migration、認可、テストを必要な範囲で同時に進める。検索専用基盤、決済、MVP 外の機能は追加しない。

## Accepted baseline

- Next.js / Supabase PostgreSQL / Cloudflare を採用する。
- MVP の地理は東京都・神奈川県。Schedule → Venue → Prefecture で導出し、日時境界は `Asia/Tokyo`。
- Organization は Application 承認時に初期 Owner とともに原子的に作成する。
- Artist / Venue は Candidate を審査して shared canonical record にする。
- Event は stable identity、内容は Revision。Platform Admin 承認で public revision pointer を更新する。
- `apply` は応募締切必須・Schedule 0 件可。Festival は同一 Organization の子 Event を 1 段で束ね、公開には Schedule を持つ承認済み子が必要。
- MVP 編集 UI の画像は main image 1 枚のみ。Cancelled Event は公開を維持する。

## PR plan

| PR | Scope | Exit criteria |
| --- | --- | --- |
| 1 | 設計文書の確定 | ADR、要件、認可、データモデル、ロードマップが上記 baseline と矛盾しない。 |
| 2 | Application scaffold と CI | Next.js / TypeScript / Supabase local、`pnpm check` / `pnpm verify`、CI が再現可能。 |
| 3 | Organization と地理の基盤 | Application、初期 Owner transaction、Membership RLS、Tokyo / Kanagawa Venue と Schedule の migration・tests。 |
| 4 | Artist / Venue moderation | Candidate、activation / rejection / merge、canonical change request、RLS・integration tests。 |
| 5 | Event Revision domain | Event、Revision、Schedule、credit、ticket、media、Festival relation、validation と migration tests。 |
| 6 | Public discovery | approved revision の一覧・詳細、Artist / Venue pages、過去・Cancelled 表示。 |
| 7 | Organizer authentication | login、Organization context、Owner / Admin / Editor 権限の server / RLS tests。 |
| 8 | Draft editor | Draft / submit UI、Schedule・Venue・credit・ticket、main image 1 枚と alt text。 |
| 9 | Review and publication | Platform Admin queues、changes requested / approval、public pointer 更新、cancellation review。 |
| 10 | Discovery hardening and release | Calendar、filters、search、Open Call、SEO、a11y、E2E、staging runbook。 |

## Cross-cutting quality gates

- Migration は空の local database に適用でき、seed が Tokyo / Kanagawa、role、revision state、candidate、apply、Festival を網羅する。
- すべての mutation は server-side authorization と RLS の両方で検証する。
- Public query、metadata、storage delivery から draft、review 中、candidate、application 情報を漏らさない。
- PR2 以降は `pnpm check` を必須にし、release candidate は `pnpm verify` を通す。

## Dependency order

`PR2 → PR3 → PR4 / PR5 → PR6 / PR7 → PR8 → PR9 → PR10`

PR4 と PR5 は PR3 後に並行可能だが、PR8 は PR4、PR5、PR7 を、PR9 は PR8 を前提とする。
