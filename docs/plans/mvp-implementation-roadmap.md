# p8ce — MVP Implementation Roadmap

**Status:** Active
**Version:** 0.8
**Last Updated:** 2026-09-26

## MVP outcome

p8ce の MVP は、東京都・神奈川県の Event を一般ユーザーが探索でき、承認済み Organization の Member が Event を下書き・審査提出し、Platform Admin の承認後に公開できる状態とする。公開後の変更と中止も審査対象とする。中止 Event は `cancelled` として公開を維持し、主催者からの取り下げ要請には `withdrawn` への遷移で応じる（ADR-0018）。掲載可否の条文は `docs/product/listing-policy.md` を正本とする。

初期在庫は Organizer の自己申請に加え、運営による公開情報の代理入力（listing policy C-5〜C-8）で確保する。代理入力の開始には、取り下げ要請の受付窓口が先に稼働していることを条件とする。

## Changes from v0.7

- **状態表を `main` @ `d415544` に合わせた。** v0.7 で In review だった PR がすべてマージされた：#78（v0.7）、#79（招待とパスワード再設定）、#80（DH-13 の残り）、#81（CI）、#82（層構造）、#83（セキュリティヘッダー）、#84（ログイン済みユーザーの権限）、#85（proxy と Cloudflare build）。
- **Cloudflare production build が `main` で通るようになった。** DH-14 は M0-3（ドメイン）と staging の環境作りを待つだけになった。
- **2026-09-26：ファビコンは案 A（正・標準の余白）に決めた**（`docs/brand/identity.md`、`feature/favicon`）。
- **GitHub のリポジトリ名が `metafs/p8ce` になった**（rename plan）。
- **M7 の 3 文書のページを、条文のない下書きとして用意した**（`feature/legal-page-skeleton`）。フッターから常にリンクし、確定までは「準備中」と `noindex`。条文は法的助言を待つ。

## Changes from v0.6

- **状態表を `main` @ `eb110c4` に合わせた。** #75（DEC-R7）、#76（v0.6）、#77（DH-13）がマージされ、DH-13 が完了した。
- **2026-09-24 にコードベースを監査した。** 判断の要らない修正を 5 本の PR（In review）にし、判断が要るものを DEC-R9〜R12 に加えた。
- **2026-09-25 に DEC-R9・R10 を決定した。** アカウントは β の間は招待で作り、一般公開の前に自由登録を加える（ADR-0025、`feature/organizer-invitations`）。入力欄の枠は 3:1 に濃くし、本文へスキップを付ける（`docs/design/ui.md`、`fix/dh13-followups`）。一般公開までに要るものとして DH-34（自由登録）と DEC-R13（SMTP）を加えた。
- ノート PC の幅で一覧の行のタイトルが潰れ、会場と重なっていた。`fix/dh13-followups` で直す。
- **`main` の Cloudflare production build が失敗していた。** app が `src/` にあるのに `proxy.ts` と `instrumentation.ts` がリポジトリ直下にあり、Next.js はどちらも読んでいなかった。proxy が動かないため、Server Component で更新したセッションが保存されず、OpenNext の bundle も失敗していた。`fix/proxy-and-login-return` で `src/` へ移し、CI で Worker の bundle と workerd での起動を確かめる。DH-14 の前提である。
- **Email 通知は MVP の範囲外のまま**（Deferred）。主催者への連絡は runbook に従う（M8）。
- 監査で見つかり、まだ扱っていないもの：料金の入力を読む関数が 2 つあり（保存に使う `ticket-offers.ts` と、テストだけが使う `revisions/schema.ts`）、受け付ける金額の上限が違う。どちらを正とするかを決めてから片方を消す。

## Changes from v0.5

- **状態表を `main` @ `2921509` に合わせた。** #68〜#74（改名の文書・構造化データ・エラー記録・掲載基準の公開ページ・匿名ユーザーの権限・代理入力の E2E・ロードマップ）がマージされ、M0-1・M0-2、DH-16・DH-26・DH-28・DH-33 が完了した。M4.1 も完了した（DH-24 は取り下げ）。
- **2026-09-24 に DEC-R1〜R4、R6、R7 を決定し、ADR-0023 を採用した。** 決定の記録先は下の表のとおり。DEC-R5 は `events.listing_origin` で決定済み（#66）。
- **DH-24（発表会区分）を取り下げた**（DEC-R4）。
- **DEC-R7 の対応として、ログイン済みユーザーからも審査メモを閉じる**（`fix/review-memo-members-only`）。
- クリティカルパスは、ドメインの取得と本番設定（M0-3）から staging へ進む形になった。

## Changes from v0.4

- **状態表を `main` @ `85b8eb5` に合わせた。** M4.1（DH-24 を除く）、UI の作り直し（ADR-0022）、改名の UI 部分（M0-2）が完了している。
- **DEC-R1 を保留にし、改名の前提条件から外した**（`d388655`、ADR-0021 と rename plan で決定済み）。ドメインは公開前までに決める。
- **DEC-R5 を決定済みとした。** 代理入力は `events.listing_origin`（`organizer` / `proxy`）で表す（#66）。
- **DH-16 で、公開 Revision の審査メモ（`decision_reason`）が匿名で読めることが分かった。** 修正は `fix/anonymous-privileges`。
- **DH-27 を完了とした。** ADR-0020 を Accepted にした。
- 2026-09-23 に作成した PR を「In review」として状態表に記す。マージ後に完了へ移す。

## Changes from v0.3

- **実装状態を事実に合わせた。** v0.3 は M5・M6 を「未着手」としていたが、`main` @ `4d43339` のコードでは M5 の主要経路、media の upload・配信、`withdrawn`、metadata / sitemap / robots、runbook が実装済みである。
- **listing policy（2026-09-19〜20 決定）の実装残を M4.1 として切り出した。** main image 任意化、代理入力、取り下げ受付窓口、Organization 申請項目、問い合わせ手段と B-7 の検証。
- **改名（ADR-0021）を M0 として最優先に置いた。** Event の恒久 URL と sitemap を公開する前に完了させる。
- **法務・公開ページを M7、初期在庫とクローズドβを M8 として独立させた。** M6 の技術的な release gate と、運用上の公開条件を分けて追跡する。

## Verified current state (2026-09-26, `main` @ `d415544`)

plan doc の Status 表記ではなく、コードを読んで確認した状態である。「In review」は未マージのブランチである。

| 領域 | 状態 | 根拠 |
| --- | --- | --- |
| M1〜M4 | 完了 | `supabase/migrations/` 24 本、`supabase/tests/database/` 13 本、`tests/e2e/m2`〜`m4` |
| M4.1 Listing policy alignment | 完了 | `20260921000000_listing_policy_followups.sql` ほか 3 本、`/listing-requests`、`/admin/withdrawals`。DH-24 は取り下げ（DEC-R4） |
| 代理入力の E2E | 完了 | #73（`tests/e2e/proxy-listing.spec.ts`） |
| M5 Public discovery | 完了（本番ドメインでの構造化データ確認を除く） | `/events`、`/calendar`、`/open-calls`、`/artists/[id]`、`/venues/[id]`、`src/features/events/structured-data.ts`（#70） |
| UI 基盤 | 完了 | ADR-0022、`src/ui/`、`docs/design/ui.md` |
| Media upload / delivery | 実装済み・staging 未検証 | `src/features/media/`、`/events/[eventId]/image`、ADR-0016 |
| Withdrawal | 完了 | `20260919020000_event_withdrawal.sql`、`/admin/withdrawals`、ADR-0018 |
| Metadata / sitemap / robots | 完了 | `src/app/sitemap.ts`、`src/app/robots.ts` |
| 改名 | 完了（M0-1 #71、M0-2 ADR-0022、リポジトリ名 `metafs/p8ce`）。ファビコンは In review（`feature/favicon`）。本番ドメインの設定は M0-3 | `docs/plans/rename-plan.md` |
| 匿名ユーザーの権限（DH-16） | 完了（#72） | `20260923000000_restrict_anonymous_privileges.sql`、`anonymous_privileges.test.sql` |
| ログイン済みユーザーからの審査メモ（DEC-R7） | 完了（#75） | `20260924000000_hide_review_memo_from_signed_in_users.sql`、`review_memo_visibility.test.sql` |
| ログイン済みユーザーの権限全体 | 完了（#84） | `20260925000000_restrict_authenticated_privileges.sql`、`authenticated_privileges.test.sql` |
| セキュリティヘッダー・取り下げ要請の対象確認 | 完了（#83） | `next.config.ts` の headers、`public/_headers`、`20260925010000_listing_requests_require_public_event.sql` |
| Accessibility QA（DH-13） | 完了（#77、#80） | `tests/e2e/accessibility.spec.ts`、`src/ui/skip-link.tsx` |
| Cloudflare production build | 完了（#85）。CI が Worker を bundle し、workerd で起動を確かめる | `src/proxy.ts`、`src/instrumentation.ts`、`.github/workflows/ci.yml` |
| アカウント作成・パスワード再設定 | 完了（#79、ADR-0025）。自由登録は DH-34。本番の Auth 設定と SMTP（DEC-R13）が残る | `/admin/invitations`、`/auth/confirm`、`/password/forgot`、`supabase/templates/` |
| 層構造（ADR-0013） | 完了（#82） | `eslint.config.mjs` の境界、`docs/architecture/code-structure.md` |
| CI | 完了（#81） | E2E を本番ビルドで実行、Node 24 の actions |
| 掲載基準の公開ページ（DH-33） | 完了（#69） | `/listing-policy` |
| 利用規約・プライバシーポリシー・運営者情報 | ページの枠は In review（`feature/legal-page-skeleton`）。条文は法的助言待ち | `docs/product/legal-requirements.md`、`src/features/legal/documents.ts` |
| Error tracking（DH-28） | 完了（#68、ADR-0023 Accepted）。Workers Logs への出力は staging で確認 | `src/instrumentation.ts`、`src/lib/observability/` |
| Runbooks | 完了（未リハーサル） | `docs/ops/runbooks/` 4 本 |
| staging 環境 | 未着手 | `wrangler.jsonc` に `env` 定義なし |

## Decisions required before implementation

エージェントが一般論で埋めてはならない。決定は ADR または該当 product doc に記録してから実装に入る。2026-09-26 時点で DEC-R8、R11〜R13 が未決である。

| ID | 決定事項 | ブロックするもの |
| --- | --- | --- |
| DEC-R1 | **決定（2026-09-24）**：ドメインは `p8ce.dance`。ADR-0021、`docs/brand/identity.md` | — |
| DEC-R2 | **決定（2026-09-24）**：恒久 URL は `/events/{id}`・`/artists/{id}`・`/venues/{id}`（UUID）のまま。ADR-0024 | — |
| DEC-R3 | **決定（2026-09-24）**：対象地域は東京都・神奈川県。一行説明も合わせた（`docs/brand/identity.md`） | — |
| DEC-R4 | **決定（2026-09-24）**：発表会の Event Type は設けない。既存の Event Type で掲載し、既定表示からも外さない（listing policy「発表会の扱い」） | — |
| DEC-R5 | ~~代理入力の表現~~ **決定済み**：`events.listing_origin`（`organizer` / `proxy`）（#66） | — |
| DEC-R6 | **決定（2026-09-24）**：代理入力は週 20 件の審査上限に含めない（listing policy G-2） | — |
| DEC-R7 | **決定（2026-09-24）**：審査メモはログイン済みの他団体メンバーに見せない。`fix/review-memo-members-only` で閉じる。公開実績のある Organization の全列を読める状態（DH-19 残件）は未判断 | — |
| DEC-R8 | ADR 番号 0012 の重複を改番するか | なし（新規 ADR は 0025 から採番） |
| DEC-R9 | **決定（2026-09-25）**：β の間は運営の招待でアカウントを作り、Supabase Auth の新規登録は止める。パスワード再設定は誰でも依頼できる。一般公開の前に自由登録（メール確認つき）を加える（DH-34）。ADR-0025 | — |
| DEC-R10 | **決定（2026-09-25）**：入力欄の枠を 3:1 に濃くする（`--line-field` `#8e8e89`）。本文へスキップのリンクを付ける。`docs/design/ui.md` | — |
| DEC-R11 | sitemap の範囲。DH-12 は公開 Event とトップのみと決めている。一覧・カレンダー・公募・掲載基準・Artist・Venue を加えるか | なし |
| DEC-R12 | HSTS を subdomain と preload に広げるか。`script-src` の CSP を nonce 付きで入れるか（全ページが動的描画になる） | なし（現状はホスト単位の HSTS、nonce 不要な CSP のみ） |
| DEC-R13 | 招待・パスワード再設定のメールを送る SMTP の提供元（ADR-0025）。Supabase 標準の送信は試験用 | DH-14 の Organizer journey、M8 のクローズドβ |
| — | ~~ファビコン~~ **決定（2026-09-26）**：案 A（正・標準の余白）。`docs/brand/identity.md` | — |

## Milestones

### M1〜M3 — Complete

詳細は `docs/plans/m1-domain-integrity.md`、`m2-identity-organization-onboarding.md`、`m3-moderated-entities.md`。

### M4 — Event draft and review workflow

**Status:** Complete — detailed plan: `docs/plans/m4-event-review-workflow.md`

Draft → 提出 → 差戻し → 再提出 → 承認 → 公開後変更、中止申請 → 承認 → 中止表示の E2E が成功している。審査中も直前の承認 Revision を表示し続ける。

### M0 — Rename to p8ce

**Status:** M0-1 and M0-2 complete. M0-3 is unblocked (domain `p8ce.dance`, URLs per ADR-0024) — detailed plan: `docs/plans/rename-plan.md`

**Goal:** Event の恒久 URL と sitemap を外部へ出す前に、サービス名を p8ce へ揃える。

| ID | 内容 | area | 依存 |
| --- | --- | --- | --- |
| M0-1 | 文書の置換（`AGENTS.md` を最優先） | `docs` | — |
| M0-2 | UI・metadata・siteName・wordmark の置換、ロゴ適用（`docs/brand/identity.md`） | `frontend` | — |
| M0-3 | `p8ce.dance` の取得と DNS、本番の `NEXT_PUBLIC_SITE_URL`（canonical URL・sitemap・構造化データの base URL） | `infra` | — |

Worker 名・R2 バケット名・テスト用パスワードなど、rename plan が「機械置換してはいけない箇所」とするものは残す。

**Done when:** `rename-plan.md` のチェックリストが閉じ、公開ページ・metadata・sitemap に旧名称が出ない。

### M4.1 — Listing policy alignment

**Status:** Complete (#66, proxy E2E #73). DH-24 withdrawn by DEC-R4.

**Goal:** 2026-09-19〜20 に決定した listing policy を、審査・公開の契約として実装する。

| ID | 内容 | area | 依存 | 要件 |
| --- | --- | --- | --- | --- |
| DH-20 | publication validation の main image・Artist credit 任意化。画像がある場合のみ alt text 必須・main 最大 1 枚。画像なし・出演者なしの Event Card・詳細・OG の表示。negative / positive DB test | `db` `frontend` | — | REQ-EVENT-008, REQ-MEDIA-001, policy B |
| DH-21 | 取り下げ要請の受付窓口。匿名で送れる公開フォーム、bot 対策、Platform Admin の受付 queue から `/admin/withdrawals` への導線、runbook 追記 | `frontend` `backend` `db` | — | policy F-1〜F-5 |
| DH-22 | 代理入力。入力経路の識別、公開ページでの代理入力表示と修正窓口（G-6）、画像を登録させない制約（C-8） | `db` `backend` `frontend` | DEC-R5, DH-20 | policy C-5〜C-8, G-6 |
| DH-23 | Organization Application の責任者・連絡先・活動確認項目 | `db` `frontend` | — | REQ-ORG-002, policy E-1〜E-3 |
| ~~DH-24~~ | 取り下げ（DEC-R4）。発表会は既存の Event Type で掲載する | — | — | policy A「発表会の扱い」 |
| DH-25 | 問い合わせ手段（B-5）の項目化と、B-7（初回開催日 7 日前）の提出時検証 | `db` `backend` `frontend` | — | REQ-EVENT-008, policy B-5, B-7 |

DH-20・DH-21・DH-23・DH-25 は相互に独立し、並列に着手できる。

**Done when:** listing policy の Implementation follow-ups 表がすべて完了し、画像なし Event と代理入力 Event の E2E が成功する。

### M5 — Public discovery

**Status:** Complete except checking DH-26 on the production domain after M0-3 — DH-26 (#70), DH-27 complete — detailed plan: `docs/plans/m5-public-discovery.md`

実装済み：Event 一覧・詳細、Calendar、日付・地域・Event Type・テキスト検索（ADR-0020）、応募締切一覧、Artist / Venue 詳細、Festival 親子、過去・中止表示、匿名 critical journey E2E。

| ID | 内容 | area | 依存 |
| --- | --- | --- | --- |
| DH-26 | 構造化データ。schema.org `Event` / `Place` / `PerformingGroup` の JSON-LD、`eventStatus` を `cancelled` と整合させる。Rich Results Test の結果を記録（本番ドメインでの確認は M0-3 の後） | `frontend` | — |
| DH-27 | ADR-0020 を実装に合わせて Accepted にする | `docs` | — |

**Done when:** DH-26 が完了し、Rich Results Test で Event 構造化データがエラーなく通る。

### M6 — Release candidate

**Status:** In progress — DH-13 (#77, #80), DH-16 (#72, #84) and DH-28 (#68) complete; DH-14, DH-29, DH-17 remain. DH-14 waits for M0-3 and the staging accounts — detailed plan: `docs/plans/m6-release-candidate.md`

| ID | 内容 | area | 依存 |
| --- | --- | --- | --- |
| DH-13 | accessibility・keyboard / focus・form error・responsive QA と欠陥修正 | `frontend` | M4.1 |
| DH-14 | Cloudflare staging 環境の定義とデプロイ。R2 bucket と edge cache header の検証。Organizer・Admin・Visitor の critical journey を staging で実行。proxy によるセッション更新と instrumentation の出力を Worker 上で確認する（OpenNext は Node.js proxy を experimental としている） | `infra` | M0-3 |
| DH-16 | 公開情報漏洩テストの拡張。anon の権限面全体（表・列・関数）を固定するテストと、見つかった露出の修正 | `db` `auth` | — |
| DH-28 | Error tracking の最小構成と、`observability.md` の更新（Workers Logs への出力確認は DH-14） | `infra` | — |
| DH-29 | runbook のリハーサル（deploy、migration rollback、media recovery、moderation）と結果の記録 | `infra` `docs` | DH-14 |
| DH-17 | リリースチェックリストと既知の制約の記録 | `docs` | 上記すべて |

**Done when:** staging で critical journey が完走し、`pnpm verify`、accessibility check、公開情報漏洩 test、rollback rehearsal が成功している。

### M7 — Legal and public policy pages

**Status:** In progress — DH-33 complete (#69). The pages for DH-30〜32 exist as drafts (`feature/legal-page-skeleton`); their clauses await legal advice

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
4. 週あたり審査件数を記録し、G-2 の上限（週 20 件）を超える広報を行わない。代理入力は上限に含めない（DEC-R6）。
5. DH-34：誰でも登録できる画面（メールアドレスの確認つき）を加え、Supabase Auth の新規登録を再開する（ADR-0025 Decision 4）。
6. 一般公開。

**Done when:** β 期間中の審査がすべて G-1 内に処理され、一般公開時点の公開 Event 在庫と、以後の週次審査計画が記録されている。

## Critical path and parallel execution

```text
M0-3 ドメイン取得・DNS ─┬─ DH-26 を本番ドメインで確認
                         └─ DH-14 staging ─ DH-28 確認 / DH-29 ─┐
DEC-R13 SMTP ────────────────────────────────────────────────────┼─ DH-17 ─ M8 β ─ DH-34 ─ 一般公開
M7 DH-30〜32 条文（法的助言） ────────────────────────────────────┘
```

- クリティカルパスは M0-3 → DH-14 → DH-17 → M8。
- DEC-R13 と M7 の条文は、ドメインと独立に進められる。1 Issue = 1 Branch = 1 Worktree で扱う。
- 代理入力（M8 の 1）は DH-21 の完了を待つ。M7 の完了を待たずに内部で入力を進めてよいが、公開は M7 完了後とする。

各マイルストーンで `pnpm check` と Cloudflare production build を維持する。Organization Role の操作範囲は `docs/architecture/auth.md`、公開必須項目と日付規則は `docs/product/requirements.md` を正本とする。

## MVP release gates

- Product: Organization onboarding、Candidate moderation、Event review、公開 discovery、取り下げ要請の受付が end-to-end で利用できる。
- Policy: listing policy の Implementation follow-ups が完了し、画像なし Event と代理入力 Event が成立する。
- Data: migration と seed だけで環境を再構築でき、承認履歴と公開 Revision を失わない。
- Security: 全 mutation を server authorization と RLS で保護し、draft・candidate・application・未承認 media・`withdrawn` Event を公開しない。
- Quality: `pnpm verify`、critical E2E、authorization negative cases、基本 accessibility が CI で成功する。
- Discovery: 恒久 URL（ADR-0024）で、sitemap と Event 構造化データが本番ドメイン `p8ce.dance` 上で有効である。
- Legal: 利用規約・プライバシーポリシー・運営者情報・掲載基準が公開されている。
- Operations: staging で runbook をリハーサル済みで、審査・取り下げ・代理入力の手順が文書化されている。

## Deferred until after MVP

地図 UI、複数画像、Artist Claim、他 Organization の Festival child、多言語（`_en` 列は予約済み）、Email・push・一般告知・marketing 通知、Favorites、推薦、決済、CSV import、外部サイトの自動取得、公開 Organization profile、出演条件（ノルマ等）の開示項目、統計・年鑑、Curation 面。
