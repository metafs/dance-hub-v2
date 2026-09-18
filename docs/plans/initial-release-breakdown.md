# DANCE HUB — Initial release breakdown

**Status:** Draft
**Last Updated:** 2026-09-18

## Purpose

`docs/plans/mvp-implementation-roadmap.md` が定める MVP release gate までに残る作業を、
1 Issue = 1 Branch = 1 Worktree で扱える単位へ分解する。本書は milestone 計画を置き換えず、
M5 / M6 / media delivery の各 plan を実行単位へ写像する索引として使う。

要件は `docs/product/requirements.md` を正本とし、本書は REQ ID を参照するのみで新しい
product requirement を定義しない。

## Verified current state (2026-09-18, `main` @ `b960426`)

コードを読んで確認した実装状況であり、plan doc の Status 表記とは独立に記録する。

| 領域 | 状態 | 根拠 |
| --- | --- | --- |
| M1 Domain integrity | 実装済み | `supabase/migrations/` 13 本、`supabase/tests/database/` 4 本 |
| M2 Identity / Organization | 実装済み | `src/features/organizations/`、`src/app/workspace/apply` |
| M3 Moderated entities | 実装済み | `src/features/shared-entities/`、`src/app/admin/entities` |
| M4 Event review workflow | 実装済み | `src/features/revisions/`、`src/app/admin/events`、`tests/e2e/m4-event-review.spec.ts` |
| Review notification inbox | 実装済み | `src/lib/review-notifications.ts`、`supabase/migrations/20260902140000_review_notifications.sql` |
| M5 Public discovery | **ほぼ未着手** | `src/features/discovery/` は `components/home-page.tsx` のみ。一覧・Calendar・filter・検索・Artist / Venue 詳細・応募締切一覧が存在しない |
| Event 公開詳細 | 部分実装 | `src/features/events/components/public-event-page.tsx` は存在するが、Event Type を enum 値のまま表示し、主催 Organization・Festival 親子・過去判定表示を持たない |
| Media delivery | **未着手（MVP blocker）** | 公開ページは `image-placeholder` を描画し、実体の配信経路がない |
| M6 Release candidate | 未着手 | metadata / OG / sitemap / robots、accessibility 検証、staging、runbook が存在しない |

公開側 RLS はおおむね整備済みで、`events`、`event_revisions`、`event_schedules`、
`event_artists`、`event_ticket_offers`、`event_ticket_links`、`event_links`、`event_media`、
`artists`、`venues` に anon 読み取り policy がある。したがって discovery のクエリの大半は
新規 migration なしで実装できる。

例外が 2 つある。`organizations` には anon 読み取りがなく（DH-19）、テキスト検索用の
インデックスも存在しない（DH-07）。いずれも migration を要する。

## Work items

`並列` 列は、他の未マージ item と同一ファイルを触らずに着手できるかを示す。

### M5 — Public discovery

| ID | 内容 | area | 依存 | 並列 |
| --- | --- | --- | --- | --- |
| DH-01 | 公開 discovery クエリ基盤と Event Type の表示ラベル / Group mapping（REQ-EVENT-004）、Tokyo 暦日境界ヘルパ、unit test | `backend` | — | 可 |
| DH-02 | Event 一覧 + 日付 / Prefecture / Event Type filter + テキスト検索 UI、URL 反映（REQ-DISCOVERY-002, REQ-DISCOVERY-003） | `frontend` | DH-01 | DH-01 後 |
| DH-03 | Calendar 表示。Schedule 開催日のみ対象、Festival は子 Event を表示（REQ-DISCOVERY-001） | `frontend` | DH-01 | DH-01 後 |
| DH-04 | `apply` Event の応募締切順一覧（REQ-DISCOVERY-003、REQ-EVENT-003 の Schedule 0 件許容） | `frontend` | DH-01 | DH-01 後 |
| DH-05 | Artist / Venue 公開詳細と関連承認済み Event（REQ-ARTIST-001, REQ-VENUE-001） | `frontend` `backend` | — | 可 |
| DH-06 | Event 詳細の公開要件充足：Event Type 日本語ラベル、主催 Organization、Festival 親子、過去 / Cancelled 状態表示（REQ-EVENT-001, REQ-EVENT-002, REQ-EVENT-007）。主催 Organization 表示は DH-19 に依存 | `frontend` | DH-01, DH-19 | DH-01 後 |
| DH-07 | Event / Artist / Venue / Organization 名の検索インデックス migration と negative RLS test（REQ-DISCOVERY-003） | `db` | — | 可 |
| DH-08 | 匿名 critical journey E2E：Schedule 0 件 `apply`、複数 Venue、Festival、過去、中止の境界 | `frontend` | DH-02..DH-06 | 不可 |

### Media delivery（MVP blocker）

`docs/plans/media-delivery.md` の architecture gates は未決であり、決定前に storage コードを
マージしない。

| ID | 内容 | area | 依存 | 並列 |
| --- | --- | --- | --- | --- |
| DH-09 | media delivery の architecture gates を ADR 化（Proposed、選択肢と open question のみ） | `docs` | — | 可 |
| DH-10 | R2 binding と upload 経路の実装、object key 生成、型 / サイズ検証、Organization 所有検証 | `backend` `infra` | DH-09 の decision | 不可 |
| DH-11 | 承認済み Revision の main image のみ公開配信し、draft / in-review を非公開に保つ | `backend` `frontend` | DH-10 | 不可 |

### M6 — Release candidate

| ID | 内容 | area | 依存 | 並列 |
| --- | --- | --- | --- | --- |
| DH-12 | metadata / Open Graph / `robots` / `sitemap`（承認済み公開 Event のみ） | `frontend` | — | 可 |
| DH-13 | accessibility・keyboard / focus・form error・responsive QA と欠陥修正 | `frontend` | DH-02..DH-06 | 不可 |
| DH-14 | Cloudflare staging デプロイと critical journey の staging 実行 | `infra` | DH-08 | 不可 |
| DH-15 | runbook：デプロイ、migration rollback、media recovery、moderation 運用 | `docs` | — | 可 |
| DH-16 | 公開情報漏洩テスト（draft / candidate / application / 未承認 media の非公開） | `db` `auth` | DH-02..DH-06 | 不可 |
| DH-17 | リリースチェックリストと既知の制約の記録 | `docs` | DH-13..DH-16 | 不可 |

## Parallel waves

```text
Wave 1（相互に独立）
 ├─ DH-01 discovery クエリ基盤
 ├─ DH-05 Artist / Venue 詳細
 ├─ DH-07 検索インデックス
 ├─ DH-09 media delivery ADR
 ├─ DH-12 metadata / OG / sitemap
 └─ DH-15 runbook

Wave 2（DH-01 に依存）
 ├─ DH-02 Event 一覧・filter・検索
 ├─ DH-03 Calendar
 ├─ DH-04 応募締切一覧
 └─ DH-06 Event 詳細の充足

Wave 3
 ├─ DH-08 匿名 E2E
 ├─ DH-10 / DH-11 media upload・配信
 ├─ DH-13 accessibility QA
 └─ DH-16 公開情報漏洩テスト

Wave 4
 ├─ DH-14 staging 実行
 └─ DH-17 リリースチェックリスト
```

## Open items requiring a decision

エージェントが一般論で埋めてはならない項目として記録する。

1. **media delivery の architecture gates 5 点**（`docs/plans/media-delivery.md`）。DH-09 で
   選択肢を提示するが、決定は別手続きとする。
2. **ADR 番号 0012 の重複**。`0012-use-authored-global-css.md` と
   `0012-use-native-runtime-validation.md` が同番号で並存し、`docs/adr/README.md` も
   同じ状態を記録している。改番するか現状を許容するかの決定が必要で、本書では変更しない。
   新規 ADR は衝突しない番号から採番する。
3. **テキスト検索の実装方式**。`ILIKE` と全文検索インデックスのどちらを採るかで DH-07 の
   migration 内容が変わる。DH-07 は選択肢を PR に明示する。
4. **生成 DB 型の正本**。下記 DH-18 のとおり、生成されるファイルと import されるファイルが
   一致しておらず、既に drift が発生している。release 前に正本を決める必要がある。
5. **匿名ユーザーへ Organization をどこまで公開するか**。下記 DH-19 のとおり、現在の RLS は
   anon に `organizations` を一切読ませないため、REQ-EVENT-002 の主催 Organization 表示と
   REQ-DISCOVERY-003 の Organization 名検索が実装できない。

## Structural findings

実装読み取りで見つかった構造上の差異。いずれも本 breakdown では変更しない。

### DH-18 — 生成 DB 型が二重化し、実際に import される側が生成対象外（release blocker 候補）

`area:db` / `area:infra`。並列着手は可能だが、正本をどちらにするかの決定が先に要る。

- `scripts/database-types.mjs` の `outputPath` は `src/lib/database.types.ts` であり、
  `pnpm db:types` / `pnpm db:types:check` はこのファイルだけを生成・検証する。
- 一方、application code が import するのは `src/lib/db/database.types.ts` で、
  `AGENTS.md` の area 表もこちらを `area:db` の対象として挙げている。
- 後者は生成対象外のため schema から drift する。実際に
  `20260902140000_review_notifications.sql` が追加した `review_notifications` は、
  生成側 (`src/lib/database.types.ts`) には存在し、import 側
  (`src/lib/db/database.types.ts`) には存在しない。
- 結果として `pnpm db:types:check` が成功したまま、application の型が schema と
  一致しない状態を許してしまう。

決定が必要な点：どちらを正本とするか、`src/lib/db/supabase.types.ts` の
serialized bigint adapter を正本の上にどう重ねるか、`AGENTS.md` の area 表を
どちらに合わせるか。

### DH-19 — 匿名ユーザーが `organizations` を読めず、公開要件を満たせない（M5 blocker）

`area:db` / `area:auth`。DH-02 と DH-06 の一部がこれに依存する。

- `20260901090000_organizations_and_geography.sql` は
  `revoke all on public.organizations ... from public, anon;` を実行し、
  `grant select` は `authenticated` にのみ与えている。policy も
  `to authenticated` で member / Platform Admin に限定されている。
- したがって匿名ユーザーは `organizations` を 1 行も読めない。
- しかし REQ-EVENT-002 は公開 Event 詳細に主催 Organization を含められることを求め、
  REQ-DISCOVERY-003 は Organization 名での検索を求めている。どちらも現状では実装できない。
- `artists` と `venues` には `using (true)` の公開 policy と anon への grant があるため、
  この欠落は `organizations` に固有である。

決定が必要な点：匿名に見せる列（名称のみか、`website_url` を含むか）、対象とする
Organization の範囲（承認済み公開 Event を 1 件以上持つものに限るか、全件か）、および
`docs/product/scope.md` が After Core MVP に送っている「公開 Organization profile」と
どう線引きするか。実装時は `AGENTS.md` の evidence 規則に従い、
`supabase/tests/database/` に negative RLS test を追加する。

### `src/ui` layer が存在しない

`docs/architecture/code-structure.md` と `AGENTS.md` は `src/ui/**` を独立 layer として
規定し、`eslint.config.mjs` もその境界を検査対象に含めるが、`src/ui` は存在しない。
domain-agnostic な primitive の置き場が未確定で、現状は `src/components/*.tsx` が
feature entry point への互換 re-export として残っている。
