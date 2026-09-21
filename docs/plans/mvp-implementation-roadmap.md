# p8ce — MVP Implementation Roadmap

**Status:** Active
**Version:** 0.4
**Last Updated:** 2026-09-21

## MVP outcome

p8ce の MVP は、東京都・神奈川県の Event を一般ユーザーが探索でき、承認済み Organization の Member が Event を下書き・審査提出し、Platform Admin の承認後に公開できる状態とする。公開後の変更と中止も審査対象とする。中止 Event は `cancelled` として公開を維持し、主催者からの取り下げ要請には `withdrawn` への遷移で応じる（ADR-0018）。掲載可否の条文は `docs/product/listing-policy.md` を正本とする。

初期在庫は Organizer の自己申請に加え、運営による公開情報の代理入力（listing policy C-5〜C-8）で確保する。代理入力の開始には、取り下げ要請の受付窓口が先に稼働していることを条件とする。

## Changes from v0.3

- **実装状態を事実に合わせた。** v0.3 は M5・M6 を「未着手」としていたが、`main` @ `4d43339` のコードでは M5 の主要経路、media の upload・配信、`withdrawn`、metadata / sitemap / robots、runbook が実装済みである。
- **listing policy（2026-09-19〜20 決定）の実装残を M4.1 として切り出した。** main image 任意化、代理入力、取り下げ受付窓口、Organization 申請項目、問い合わせ手段と B-7 の検証。
- **改名（ADR-0021）を M0 として最優先に置いた。** Event の恒久 URL と sitemap を公開する前に完了させる。
- **法務・公開ページを M7、初期在庫とクローズドβを M8 として独立させた。** M6 の技術的な release gate と、運用上の公開条件を分けて追跡する。

## Verified current state (2026-09-21, `main` @ `4d43339`)

plan doc の Status 表記ではなく、コードを読んで確認した状態である。

| 領域 | 状態 | 根拠 |
| --- | --- | --- |
| M1 Domain integrity | 完了 | `supabase/migrations/` 16 本、`supabase/tests/database/` 8 本 |
| M2 Identity / Organization | 完了 | `src/features/organizations/`、`tests/e2e/m2-onboarding.spec.ts` |
| M3 Moderated entities | 完了 | `src/features/shared-entities/`、`tests/e2e/m3-entities.spec.ts` |
| M4 Event review workflow | 完了（policy 追随が残る） | `src/features/revisions/`、`tests/e2e/m4-event-review.spec.ts` |
| M5 Public discovery | ほぼ完了 | `/events`、`/calendar`、`/open-calls`、`/artists/[id]`、`/venues/[id]`、`src/features/discovery/`、`tests/e2e/m5-public-discovery.spec.ts` |
| Media upload / delivery | 実装済み・staging 未検証 | `src/features/media/`、`/events/[eventId]/image`、ADR-0016 |
| Withdrawal | 完了 | `20260919020000_event_withdrawal.sql`、`/admin/withdrawals`、ADR-0018 |
| Metadata / sitemap / robots | 完了 | `src/app/sitemap.ts`、`src/app/robots.ts` |
| 構造化データ（JSON-LD） | 未着手 | `src/` に `application/ld+json` がない |
| Runbooks | 完了（未リハーサル） | `docs/ops/runbooks/` 4 本 |
| 改名 | UI・metadata は置換済み、文書は一部のみ | UI・metadata・ロゴは ADR-0022 の変更で `p8ce` に置換。文書、`package.json`、`.env.example`、`env.test.ts` は未 |
| main image・Artist credit 任意化 | **未実装** | publication validation 関数が「Artist credit 1 件以上」「main image ちょうど 1 枚」を要求（`20260902130000_event_ticket_offers.sql`） |
| 代理入力・取り下げ受付窓口 | 未着手 | listing policy の Implementation follow-ups |
| 利用規約・プライバシーポリシー・運営者情報 | 未着手 | 該当 route なし |
| staging 環境 | 未着手 | `wrangler.jsonc` に `env` 定義なし |
| Error tracking | 未着手 | `docs/architecture/observability.md` |

## Decisions required before implementation

エージェントが一般論で埋めてはならない。決定は ADR または該当 product doc に記録してから実装に入る。

| ID | 決定事項 | ブロックするもの |
| --- | --- | --- |
| DEC-R1 | `p8ce.dance` の取得可否（ADR-0021 の前提条件） | M0 全体 |
| DEC-R2 | Event の恒久 URL 形式。`/events/{uuid}` を維持するか、slug を併用するか | M0-3、M5 の sitemap / JSON-LD 確定 |
| DEC-R3 | 対象地域。`docs/product/scope.md` は東京都・神奈川県。拡張する場合は Prefecture enum・filter・listing policy A-1 の改訂を伴う | M8 の代理入力対象範囲 |
| DEC-R4 | Event Type への発表会区分の追加（ADR-0008 改訂、listing policy Open items） | DH-24 |
| DEC-R5 | 代理入力の表現。運営 Organization から入力するか、Event / Revision に入力経路の属性を持たせるか | DH-22 |
| DEC-R6 | 代理入力を G-2 の週 20 件審査上限に算入するか | M8 の在庫計画 |
| DEC-R7 | `authenticated` が公開実績のある Organization の全列を読める状態（DH-19 残件）を許容するか | DH-16 |
| DEC-R8 | ADR 番号 0012 の重複を改番するか | なし（新規 ADR は 0022 から採番） |

## Milestones

### M1〜M3 — Complete

詳細は `docs/plans/m1-domain-integrity.md`、`m2-identity-organization-onboarding.md`、`m3-moderated-entities.md`。

### M4 — Event draft and review workflow

**Status:** Complete — detailed plan: `docs/plans/m4-event-review-workflow.md`

Draft → 提出 → 差戻し → 再提出 → 承認 → 公開後変更、中止申請 → 承認 → 中止表示の E2E が成功している。審査中も直前の承認 Revision を表示し続ける。

### M0 — Rename to p8ce

**Status:** Blocked on DEC-R1 — detailed plan: `docs/plans/rename-plan.md`

**Goal:** Event の恒久 URL と sitemap を外部へ出す前に、サービス名を p8ce へ揃える。

| ID | 内容 | area | 依存 |
| --- | --- | --- | --- |
| M0-1 | 文書の置換（`AGENTS.md` を最優先） | `docs` | DEC-R1 |
| M0-2 | UI・metadata・siteName・wordmark の置換、ロゴ適用（`docs/brand/identity.md`） | `frontend` | DEC-R1 |
| M0-3 | 本番ドメインと canonical URL・sitemap の base URL 設定 | `infra` `frontend` | DEC-R1, DEC-R2 |

Worker 名・R2 バケット名・テスト用パスワードなど、rename plan が「機械置換してはいけない箇所」とするものは残す。

**Done when:** `rename-plan.md` のチェックリストが閉じ、公開ページ・metadata・sitemap に旧名称が出ない。

### M4.1 — Listing policy alignment

**Status:** Planned

**Goal:** 2026-09-19〜20 に決定した listing policy を、審査・公開の契約として実装する。

| ID | 内容 | area | 依存 | 要件 |
| --- | --- | --- | --- | --- |
| DH-20 | publication validation の main image・Artist credit 任意化。画像がある場合のみ alt text 必須・main 最大 1 枚。画像なし・出演者なしの Event Card・詳細・OG の表示。negative / positive DB test | `db` `frontend` | — | REQ-EVENT-008, REQ-MEDIA-001, policy B |
| DH-21 | 取り下げ要請の受付窓口。匿名で送れる公開フォーム、bot 対策、Platform Admin の受付 queue から `/admin/withdrawals` への導線、runbook 追記 | `frontend` `backend` `db` | — | policy F-1〜F-5 |
| DH-22 | 代理入力。入力経路の識別、公開ページでの代理入力表示と修正窓口（G-6）、画像を登録させない制約（C-8） | `db` `backend` `frontend` | DEC-R5, DH-20 | policy C-5〜C-8, G-6 |
| DH-23 | Organization Application の責任者・連絡先・活動確認項目 | `db` `frontend` | — | REQ-ORG-002, policy E-1〜E-3 |
| DH-24 | Event Type への発表会区分の追加と、一覧既定表示からの除外・filter での到達 | `db` `frontend` | DEC-R4 | policy A「Event Type による分類」 |
| DH-25 | 問い合わせ手段（B-5）の項目化と、B-7（初回開催日 7 日前）の提出時検証 | `db` `backend` `frontend` | — | REQ-EVENT-008, policy B-5, B-7 |

DH-20・DH-21・DH-23・DH-25 は相互に独立し、並列に着手できる。

**Done when:** listing policy の Implementation follow-ups 表がすべて完了し、画像なし Event と代理入力 Event の E2E が成功する。

### M5 — Public discovery

**Status:** Mostly complete — detailed plan: `docs/plans/m5-public-discovery.md`

実装済み：Event 一覧・詳細、Calendar、日付・地域・Event Type・テキスト検索（ADR-0020）、応募締切一覧、Artist / Venue 詳細、Festival 親子、過去・中止表示、匿名 critical journey E2E。

| ID | 内容 | area | 依存 |
| --- | --- | --- | --- |
| DH-26 | 構造化データ。schema.org `Event` / `Place` / `PerformingGroup` の JSON-LD、`eventStatus` を `cancelled` と整合させる。Rich Results Test の結果を記録 | `frontend` | M0-3 |
| DH-27 | ADR-0020 を実装に合わせて Accepted にする | `docs` | — |

**Done when:** DH-26 が完了し、Rich Results Test で Event 構造化データがエラーなく通る。

### M6 — Release candidate

**Status:** Planned — detailed plan: `docs/plans/m6-release-candidate.md`

| ID | 内容 | area | 依存 |
| --- | --- | --- | --- |
| DH-13 | accessibility・keyboard / focus・form error・responsive QA と欠陥修正 | `frontend` | M4.1 |
| DH-14 | Cloudflare staging 環境の定義とデプロイ。R2 bucket と edge cache header の検証。Organizer・Admin・Visitor の critical journey を staging で実行 | `infra` | M0-3 |
| DH-16 | 公開情報漏洩テストの拡張。draft / candidate / application / 未承認 media に加え、取り下げ要請と代理入力の経路 | `db` `auth` | DH-21, DH-22 |
| DH-28 | Error tracking の最小構成と、`observability.md` の更新 | `infra` | DH-14 |
| DH-29 | runbook のリハーサル（deploy、migration rollback、media recovery、moderation）と結果の記録 | `infra` `docs` | DH-14 |
| DH-17 | リリースチェックリストと既知の制約の記録 | `docs` | 上記すべて |

**Done when:** staging で critical journey が完走し、`pnpm verify`、accessibility check、公開情報漏洩 test、rollback rehearsal が成功している。

### M7 — Legal and public policy pages

**Status:** Planned

**Goal:** 第三者の情報を掲載・受付するサービスとして公開できる状態にする。

| ID | 内容 | area | 依存 |
| --- | --- | --- | --- |
| DH-30 | 利用規約。`withdrawn` を「削除」と表現する（policy F）。画像 upload の権利保証（C-2〜C-4）の文言 | `docs` `frontend` | — |
| DH-31 | プライバシーポリシー。Organization Application・取り下げ要請で取得する情報の扱い | `docs` `frontend` | DH-21, DH-23 |
| DH-32 | 運営者情報・問い合わせ窓口 | `frontend` | — |
| DH-33 | 掲載基準の公開ページ（listing policy の公開用要約。Curation の基準は公開しない） | `frontend` | — |

文言は法的助言を受けて確定する。エージェントは構成と route の実装のみを行い、条文を一般論で起草して確定させない。

**Done when:** 4 ページが公開 route から到達でき、footer から常時リンクされている。

### M8 — Cold start and closed beta

**Status:** Planned

**Goal:** 公開日に掲載在庫があり、審査運用が上限内で回ることを確認してから一般公開する。

1. DH-21 の受付窓口が稼働していることを確認してから、代理入力を開始する（policy C-5〜C-8）。
2. 代理入力した Event の主催者へ通知する（C-6）。MVP では runbook に従った手動連絡とし、自動 Email 通知は導入しない。
3. 招待した Organizer 3〜5 団体でクローズドβを行い、申請から公開までの所要時間と G-1（3 営業日）の遵守を確認する。
4. 週あたり審査件数を記録し、G-2 の上限（週 20 件）を超える広報を行わない。
5. 一般公開。

**Done when:** β 期間中の審査がすべて G-1 内に処理され、一般公開時点の公開 Event 在庫と、以後の週次審査計画が記録されている。

## Critical path and parallel execution

```text
DEC-R1 ─ M0 改名 ─ M0-3 ドメイン / URL (DEC-R2) ─┬─ DH-26 JSON-LD
                                                 └─ DH-14 staging ─ DH-28 / DH-29 ─┐
M4.1 ─┬─ DH-20 必須緩和 ─ DH-22 代理入力 (DEC-R5) ─┐                              │
      ├─ DH-21 取り下げ窓口 ────────────────────────┼─ DH-16 漏洩 test ─ DH-13 ─ DH-17 ─ M8 β ─ 一般公開
      ├─ DH-23 申請項目                              │                              │
      └─ DH-25 B-5 / B-7                             │                              │
M7 DH-30〜33 ─────────────────────────────────────────┴──────────────────────────────┘
```

- クリティカルパスは DEC-R1 → M0 → M0-3 → DH-14 → DH-17 → M8。
- M4.1 の DH-20・DH-21・DH-23・DH-25 と M7 は、互いに同じファイルを触らず並列に進められる。1 Issue = 1 Branch = 1 Worktree で扱う。
- 代理入力（M8 の 1）は DH-21 の完了を待つ。M7 の完了を待たずに内部で入力を進めてよいが、公開は M7 完了後とする。

各マイルストーンで `pnpm check` と Cloudflare production build を維持する。Organization Role の操作範囲は `docs/architecture/auth.md`、公開必須項目と日付規則は `docs/product/requirements.md` を正本とする。

## MVP release gates

- Product: Organization onboarding、Candidate moderation、Event review、公開 discovery、取り下げ要請の受付が end-to-end で利用できる。
- Policy: listing policy の Implementation follow-ups が完了し、画像なし Event と代理入力 Event が成立する。
- Data: migration と seed だけで環境を再構築でき、承認履歴と公開 Revision を失わない。
- Security: 全 mutation を server authorization と RLS で保護し、draft・candidate・application・未承認 media・`withdrawn` Event を公開しない。
- Quality: `pnpm verify`、critical E2E、authorization negative cases、基本 accessibility が CI で成功する。
- Discovery: 恒久 URL が確定し、sitemap と Event 構造化データが本番ドメインで有効である。
- Legal: 利用規約・プライバシーポリシー・運営者情報・掲載基準が公開されている。
- Operations: staging で runbook をリハーサル済みで、審査・取り下げ・代理入力の手順が文書化されている。

## Deferred until after MVP

地図 UI、複数画像、Artist Claim、他 Organization の Festival child、多言語（`_en` 列は予約済み）、Email・push・一般告知・marketing 通知、Favorites、推薦、決済、CSV import、外部サイトの自動取得、公開 Organization profile、出演条件（ノルマ等）の開示項目、統計・年鑑、Curation 面。
