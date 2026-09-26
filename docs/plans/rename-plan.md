# DANCE HUB → p8ce — 改名作業計画 / Rename Plan

**Status:** Active
**Version:** 0.4
**Last Updated:** 2026-09-26

決定は ADR-0021（ADR-0019 を supersede）。名称・読み・一行説明の規則は `docs/brand/identity.md`。本文書は実施の範囲と手順のみを定める。

M5 Public discovery で Event の恒久 URL が確定する前に完了させる。公開 URL の確定後は、改名のコストが跳ね上がる。

---

## 前提条件

**ドメインは `p8ce.dance` に決定した（2026-09-24）。** 改名はドメインの決定を待たずに進めたが、取得できることが確認でき、名称を再検討する必要はなくなった。取得と本番の DNS・canonical URL の設定は roadmap の M0-3 で行う。

改名の実施前に確認する。

- Instagram ハンドル。4文字は確保困難のため複合形を想定する。
- X ハンドル。
- 商標の先行登録調査（第35類・第41類）。

## 現状

以下を除き、`dance hub` / `dance-hub` / `DanceHub` / `dancehub` のいずれかを含むファイルは **56 ファイル・87 箇所**（`main` が `e95dfc5` の時点）。

- 本計画、ADR-0019、ADR-0021（旧名称を意図的に記述している文書）
- `.claude-transfer/`（セッション間の受け渡し用ファイル。製品の一部ではない）

```
docs/architecture   8   src/features/*       12
docs/adr            5   src/app               4
docs/product        4   tests/e2e             3
docs/ops            4   supabase              2
docs/ai             3   src/lib               1
docs/plans          2   ルート直下            8
```

ルート直下の8ファイルは `README.md`、`ARCHITECTURE.md`、`AGENTS.md`、`CLAUDE.md`、`.env.example`、`package.json`、`wrangler.jsonc`、`cloudflare-env.d.ts`。

この数はブランチがマージされるたびに増える。実施時に再計測すること。

出現形とその内訳。

| 形 | 件数 | 性質 |
| --- | --- | --- |
| `DANCE HUB` | 61 | サービス名。機械置換の対象 |
| `DanceHub123` | 8 | seed と E2E の共通テストパスワード |
| `dancehub.example` | 8 | `src/lib/env.test.ts` と `.env.example` のテスト用ドメイン |
| `dance-hub-v2-scaffold` | 3 | `wrangler.jsonc` の Worker 名、および生成物 `cloudflare-env.d.ts` |
| `dance-hub-media` | 3 | R2 バケット名。`wrangler.jsonc` と runbook |
| `dance-hub-media-preview` | 2 | R2 preview バケット名。`wrangler.jsonc` と runbook |
| `dance-hub` | 2 | `package.json` の `name`、`supabase/config.toml` の `project_id` |

## 置換ルール

| 置換前 | 置換後 | 備考 |
| --- | --- | --- |
| `DANCE HUB` | `p8ce` | 文中・見出しともに |
| `DanceHub` | `P8ce` | 識別子として大文字が必要な箇所のみ |
| `DANCE_HUB` | `P8CE` | 環境変数・定数 |

`p8ce` は小文字を正とする。大文字の `P8CE` は環境変数・定数以外で用いない（`docs/brand/identity.md`）。

## 機械置換してはいけない箇所

以下は `sed` で一括置換すると壊れる。個別に判断する。

### 1. `wrangler.jsonc` の Worker 名（`dance-hub-v2-scaffold`）

Cloudflare Worker の名前を変更すると、**同じ Worker がリネームされるのではなく新しい Worker が作られる**。既存の Worker、そのルート、バインディング、環境変数、デプロイ履歴はそのまま残る。`WORKER_SELF_REFERENCE` の `service` も同じ値を指しているため、両方を同時に変更しなければ自己参照が壊れる。

本改名では **変更しない**。Worker 名はデプロイ識別子であり、サービス名と一致する必要はない。変更する場合は、新旧 Worker の切り替えとルート付け替えを独立した infra 作業として計画する。

### 2. R2 バケット名（`dance-hub-media` / `dance-hub-media-preview`）

`wrangler.jsonc` の `MEDIA` binding が結ぶバケット名。バケット名を変更すると、**既存のバケットがリネームされるのではなく、別のバケットを指すことになる**。既存の media オブジェクトは移動しないため、binding の値だけを変えると、公開中の Event の main image がすべて配信できなくなる。

本改名では **変更しない**。`docs/ops/runbooks/deployment.md` と `docs/ops/runbooks/media-recovery.md` 中のバケット名の記述も、実在するバケット名と一致している必要があるため変更しない（runbook の見出しの `DANCE HUB` は置換してよい）。変更する場合は、新バケットの作成、オブジェクトの移行、binding の切り替えを独立した infra 作業として計画する。

### 3. `cloudflare-env.d.ts`

`wrangler.jsonc` から生成される型定義。Worker 名を変えない以上、生成結果も変わらない。手で編集しない。

### 4. `supabase/config.toml` の `project_id`（`dance-hub`）

ローカル開発スタックの識別子であり、変更すると各開発者・各 worktree のローカル環境が別プロジェクト扱いになる。AI エージェントが worktree ごとに作業する構成では影響が読みにくい。

本改名では **変更しない**。

### 5. `package.json` の `name`（`dance-hub`）

npm に publish していないため実害は小さいが、`pnpm` のワークスペース解決とロックファイルに影響する。変更する場合は `pnpm install` によるロックファイル更新を同じコミットに含める。

本改名で **変更する**。`p8ce` とする。

### 6. テスト用パスワード `DanceHub123!`

`supabase/seed.sql` の5箇所と、`tests/e2e/m2-onboarding.spec.ts`、`m3-entities.spec.ts`、`m4-event-review.spec.ts` の各1箇所が同じ値を持つ。**片方だけ変更すると E2E がすべて落ちる。**

本改名では **変更しない**。テストフィクスチャであり、サービス名の一部ではない。変更する場合は seed と3つの spec を同一コミットで行い、`pnpm verify` と E2E の通過を確認する。

### 7. `dancehub.example`

`.env.example` のコメント1箇所と `src/lib/env.test.ts` の7箇所。URL 検証のテストフィクスチャで、実在しないドメインであることに意味がある。

本改名で **変更する**。`p8ce.example` とする。`env.test.ts` の期待値と入力値を同時に置換すれば整合する。

## 影響範囲

### ドキュメント

- [x] `README.md` — 読み「ペイス」と一行説明を併記する
- [x] `ARCHITECTURE.md`
- [x] `AGENTS.md` — エージェントが読む正本。優先度最高
- [x] `CLAUDE.md`
- [x] `docs/product/` — `requirements.md`、`scope.md`、`glossary.md`、`listing-policy.md`
- [x] `docs/architecture/` — `auth.md`、`code-structure.md`、`data-model.md`、`deployment.md`、`media.md`、`observability.md`、`security.md`、`testing.md`
- [x] `docs/plans/` — `mvp-implementation-roadmap.md`、`initial-release-breakdown.md`
- [x] `docs/ai/` — `paperthin.md`、`workflow.md`、`evals.md`
- [x] `docs/ops/` — `pull-request-labels.md`、`runbooks/README.md`（見出しのみ。バケット名は上記2に従い残す）
- [x] `docs/adr/` — 0001、0003、0010、0011、0012（native runtime validation）

### ADR の扱い

**過去 ADR の本文も置換する。** ADR は決定の記録だが、エージェントが読む正本として一貫している価値が、当時の呼称を保存する価値を上回る。改名そのものの記録は ADR-0019 と ADR-0021 が担うため、履歴は失われない。

**例外:** ADR-0019 と ADR-0021 の本文中の `DANCE HUB` は改名理由の記述であるため置換しない。

### コード

UI と metadata の置換（M0-2）は、UI の作り直し（ADR-0022）と同じ変更で先に行った。ロゴタイプ・ロゴの差し替えも済んでいる。

- [x] `src/app/layout.tsx`、`src/app/workspace/layout.tsx`、`src/app/admin/events/page.tsx`、`src/app/admin/withdrawals/page.tsx`
- [x] `src/features/auth/components/` — `login-page.tsx`、`workspace-layout.tsx`
- [x] `src/features/discovery/components/` — `calendar-page.tsx`、`event-list-page.tsx`、`home-page.tsx`、`open-call-page.tsx`
- [x] `src/features/events/components/public-event-page.tsx`
- [x] `src/features/moderation/components/` — `application-review-queue.tsx`、`entity-review-page.tsx`、`event-review-queue.tsx`
- [x] `src/features/shared-entities/components/` — `public-artist-page.tsx`、`public-venue-page.tsx`
- [x] `src/lib/env.test.ts` — `dancehub.example` → `p8ce.example`
- [x] `package.json` の `name`
- [x] `.env.example` のコメント

`src/app/layout.tsx` のメタデータは公開 `<title>` と OGP に出る。置換後に表示を確認する。

### ロゴ

- [x] ロゴ正本 SVG をリポジトリに追加する（`docs/brand/logo/`）
- [ ] 透過版と横長版を作る
- [x] favicon とアプリアイコン。40px 未満はロゴタイプのみ（曲線を落とす）。2026-09-26、正・標準の余白の案（`src/app/icon.svg`、`favicon.ico`、`apple-icon.png`）

ロゴの追加は改名の置換とは独立に行ってよい。ただし公開ページのロゴ差し替えは、名称の置換と同じ変更で行う。

### リポジトリ

- [x] GitHub repository 名を `metafs/dance-hub-v2` → `metafs/p8ce` に変更（2026-09-26 に確認）
- [ ] 各 worktree のリモート URL を更新
- [ ] リポジトリの description

GitHub は旧 URL からリダイレクトするが、AI エージェントが worktree ごとに作業する構成上、ローカルのリモート URL は明示的に更新する。

### 外部

- [x] ドメインの決定（`p8ce.dance`、2026-09-24）。取得と DNS 設定は roadmap M0-3
- [ ] SNS ハンドル確保

## 手順

1. 前提条件のうち、SNS ハンドルと商標を確認する。ドメインは待たない。
2. ブランチ `chore/rename-to-p8ce` を作成する。
3. ドキュメントを置換する（下記）。
4. コードと `.env.example`、`package.json` を置換する。`pnpm install` でロックファイルを更新する。
5. `src/lib/env.test.ts` の `dancehub.example` を `p8ce.example` に置換する。
6. `pnpm verify` と E2E を通す。
7. `src/app/layout.tsx` の `<title>` と OGP を実際の画面で確認する。
8. マージ後に GitHub repository をリネームし、各 worktree のリモート URL を更新する。
9. `AGENTS.md` の更新を、稼働中の全エージェントに反映する。

### 置換コマンド

```bash
# 確認（置換はしない）
git grep -n -i -E 'dance[ _-]?hub'

# 改名の記録と受け渡し用ファイルを除外して置換する
git grep -l 'DANCE HUB' -- \
    ':!docs/adr/0019-rename-service-to-p9e.md' \
    ':!docs/adr/0021-rename-service-to-p8ce.md' \
    ':!docs/plans/rename-plan.md' \
    ':!.claude-transfer' \
  | xargs sed -i 's/DANCE HUB/p8ce/g'

# テストフィクスチャのドメイン
git grep -l 'dancehub\.example' | xargs sed -i 's/dancehub\.example/p8ce.example/g'

# package.json の name のみ（手で確認する）
git grep -n '"name": "dance-hub"' package.json

# 残存確認
git grep -n -i -E 'dance[ _-]?hub' -- ':!.claude-transfer'
```

残存確認で残るのは次のみであること。

- ADR-0019、ADR-0021、本計画
- `wrangler.jsonc` の Worker 名とバケット名、`cloudflare-env.d.ts`
- `docs/ops/runbooks/` のバケット名（3箇所）
- `supabase/config.toml` の `project_id`
- `DanceHub123!` の8箇所

`sed -i` は GNU sed の記法。macOS（BSD sed）では `sed -i ''` とする。

## 置換後に手で確認する箇所

機械的な置換では正しくならない。

- **ADR-0019 と ADR-0021** が置換されていないこと。
- **意図的に残した箇所**（Worker 名、バケット名、`project_id`、`DanceHub123!`）が残っていること。
- **読みの併記。** `README.md` に「ペイス」が記載されていること。
- **名称直下の一行説明。** `p8ce` が説明なしで単独に置かれている箇所がないこと。タグラインを一行説明の代わりに置いていないこと。
- **大文字表記。** 見出しなどで `P8CE` になっている箇所がないこと。元の `DANCE HUB` が大文字だったため、置換後に大文字へ戻したくなる箇所が出る。
- **日本語の自然さ。** 「DANCE HUB は」→「p8ce は」で文が破綻していないか。`docs/plans/`、`docs/product/` は日本語本文が多い。
- **英文ドキュメント。** `docs/architecture/` は英語。冠詞と語順が壊れていないか。
- **`docs/ai/paperthin.md`。** 出現が最多。文脈を読んで確認する。

## この改名が触らないもの

- ドメインモデル（Event / Artist / Organization / Venue / User）
- 掲載基準（ADR-0017、ADR-0018、`docs/product/listing-policy.md` の条文）
- マイルストーン構成
- database schema と migration
- Cloudflare の Worker、R2 バケット、Supabase プロジェクトの識別子

## 未決

- ドメイン（保留。第一候補 `p8ce.dance`）。
- Worker 名、R2 バケット名、`supabase/config.toml` の `project_id` を将来変更するか。変更する場合は infra 作業として別途計画する。
- `.claude-transfer/` は git に追跡されている（bundle を含む）。改名とは独立に、リポジトリから外すかを判断する。
