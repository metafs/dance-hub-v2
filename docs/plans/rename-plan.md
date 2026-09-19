# DANCE HUB → p9e — 改名作業計画 / Rename Plan

**Status:** Active
**Version:** 0.1
**Last Updated:** 2026-09-19

決定は ADR-0019。本文書は実施の範囲と手順のみを定める。

M5 Public discovery で Event の恒久 URL が確定する前に完了させる。公開 URL の確定後は、改名のコストが跳ね上がる。

---

## 前提条件

**`p9e.dance` の取得可否を先に確認する。** 取得できない場合は名称ごと再検討する（ADR-0019 Revisit when）。以降のすべての作業はこの確認の後に行う。

あわせて確認する。

- Instagram ハンドル。3文字は確保困難のため複合形を想定する。
- X ハンドル。
- 商標の先行登録調査（第35類・第41類）。

## 現状

本計画と ADR-0019（旧名称を意図的に記述している2文書）を除き、`dance hub` / `dance-hub` / `DanceHub` / `dancehub` のいずれかを含むファイルは **51 ファイル・79 箇所**（`main` が `c6bf627` の時点）。

```
docs/architecture   8   src/features/*       12
docs/adr            5   src/app               3
docs/product        4   tests/e2e             3
docs/ai             3   supabase              2
docs/plans          2   src/lib               1
docs/ops            1   wrangler.jsonc        1
README.md           1   package.json          1
AGENTS.md           1   .env.example          1
CLAUDE.md           1   ARCHITECTURE.md       1
```

この数はブランチがマージされるたびに増える。実施時に再計測すること。

出現形とその内訳。

| 形 | 件数 | 性質 |
| --- | --- | --- |
| `DANCE HUB` | 59 | サービス名。機械置換の対象 |
| `DanceHub123` | 8 | seed と E2E の共通テストパスワード |
| `dancehub.example` | 8 | `src/lib/env.test.ts` と `.env.example` のテスト用ドメイン |
| `dance-hub-v2-scaffold` | 2 | `wrangler.jsonc` の Worker 名 |
| `dance-hub` | 2 | `package.json` の `name`、`supabase/config.toml` の `project_id` |

## 置換ルール

| 置換前 | 置換後 | 備考 |
| --- | --- | --- |
| `DANCE HUB` | `p9e` | 文中・見出しともに |
| `DanceHub` | `P9e` | 識別子として大文字が必要な箇所のみ |
| `DANCE_HUB` | `P9E` | 環境変数・定数 |

`p9e` は小文字を正とする。

## 機械置換してはいけない箇所

以下は `sed` で一括置換すると壊れる。個別に判断する。

### 1. `wrangler.jsonc` の Worker 名（`dance-hub-v2-scaffold`）

Cloudflare Worker の名前を変更すると、**同じ Worker がリネームされるのではなく新しい Worker が作られる**。既存の Worker、そのルート、バインディング、環境変数、デプロイ履歴はそのまま残る。`WORKER_SELF_REFERENCE` の `service` も同じ値を指しているため、両方を同時に変更しなければ自己参照が壊れる。

本改名では **変更しない**。Worker 名はデプロイ識別子であり、サービス名と一致する必要はない。変更する場合は、新旧 Worker の切り替えとルート付け替えを独立した infra 作業として計画する。

### 2. `supabase/config.toml` の `project_id`（`dance-hub`）

ローカル開発スタックの識別子であり、変更すると各開発者・各 worktree のローカル環境が別プロジェクト扱いになる。AI エージェントが worktree ごとに作業する構成では影響が読みにくい。

本改名では **変更しない**。

### 3. `package.json` の `name`（`dance-hub`）

npm に publish していないため実害は小さいが、`pnpm` のワークスペース解決とロックファイルに影響する。変更する場合は `pnpm install` によるロックファイル更新を同じコミットに含める。

本改名で **変更する**。`p9e` とする。

### 4. テスト用パスワード `DanceHub123!`

`supabase/seed.sql` の5箇所と、`tests/e2e/m2-onboarding.spec.ts`、`m3-entities.spec.ts`、`m4-event-review.spec.ts` の各1箇所が同じ値を持つ。**片方だけ変更すると E2E がすべて落ちる。**

本改名では **変更しない**。テストフィクスチャであり、サービス名の一部ではない。変更する場合は seed と3つの spec を同一コミットで行い、`pnpm verify` と E2E の通過を確認する。

### 5. `dancehub.example`

`.env.example` のコメント1箇所と `src/lib/env.test.ts` の7箇所。URL 検証のテストフィクスチャで、実在しないドメインであることに意味がある。

本改名で **変更する**。`p9e.example` とする。`env.test.ts` の期待値と入力値を同時に置換すれば整合する。

## 影響範囲

### ドキュメント

- [ ] `README.md`
- [ ] `ARCHITECTURE.md`
- [ ] `AGENTS.md` — エージェントが読む正本。優先度最高
- [ ] `CLAUDE.md`
- [ ] `docs/product/` — `requirements.md`、`scope.md`、`glossary.md`、`listing-policy.md`
- [ ] `docs/architecture/` — `auth.md`、`code-structure.md`、`data-model.md`、`deployment.md`、`media.md`、`observability.md`、`security.md`、`testing.md`
- [ ] `docs/plans/` — `mvp-implementation-roadmap.md`、`initial-release-breakdown.md`
- [ ] `docs/ai/` — `paperthin.md`（9箇所）、`workflow.md`、`evals.md`
- [ ] `docs/ops/pull-request-labels.md`
- [ ] `docs/adr/` — 0001、0003、0010、0011、0012（native runtime validation）

### ADR の扱い

**過去 ADR の本文も置換する。** ADR は決定の記録だが、エージェントが読む正本として一貫している価値が、当時の呼称を保存する価値を上回る。改名そのものの記録は ADR-0019 が担うため、履歴は失われない。

**例外:** ADR-0019 本文中の `DANCE HUB` は改名理由の記述であるため置換しない。

### コード

- [ ] `src/app/layout.tsx`、`src/app/workspace/layout.tsx`、`src/app/admin/events/page.tsx`
- [ ] `src/features/auth/components/` — `login-page.tsx`、`workspace-layout.tsx`
- [ ] `src/features/discovery/components/` — `calendar-page.tsx`、`event-list-page.tsx`、`home-page.tsx`、`open-call-page.tsx`
- [ ] `src/features/events/components/public-event-page.tsx`
- [ ] `src/features/moderation/components/` — `application-review-queue.tsx`、`entity-review-page.tsx`、`event-review-queue.tsx`
- [ ] `src/features/shared-entities/components/` — `public-artist-page.tsx`、`public-venue-page.tsx`
- [ ] `src/lib/env.test.ts` — `dancehub.example` → `p9e.example`
- [ ] `package.json` の `name`
- [ ] `.env.example` のコメント

`src/app/layout.tsx` のメタデータは公開 `<title>` と OGP に出る。置換後に表示を確認する。

### リポジトリ

- [ ] GitHub repository 名を `metafs/dance-hub-v2` → `metafs/p9e` に変更
- [ ] 各 worktree のリモート URL を更新
- [ ] リポジトリの description

GitHub は旧 URL からリダイレクトするが、AI エージェントが worktree ごとに作業する構成上、ローカルのリモート URL は明示的に更新する。

### 外部

- [ ] ドメイン取得（前提条件で確認済みのもの）
- [ ] SNS ハンドル確保

## 手順

1. 前提条件を満たす。`p9e.dance` が取れなければ中止する。
2. ブランチ `chore/rename-to-p9e` を作成する。
3. ドキュメントを置換する（下記）。
4. コードと `.env.example`、`package.json` を置換する。`pnpm install` でロックファイルを更新する。
5. `src/lib/env.test.ts` の `dancehub.example` を `p9e.example` に置換する。
6. `pnpm verify` と E2E を通す。
7. `src/app/layout.tsx` の `<title>` と OGP を実際の画面で確認する。
8. マージ後に GitHub repository をリネームし、各 worktree のリモート URL を更新する。
9. `AGENTS.md` の更新を、稼働中の全エージェントに反映する。

### 置換コマンド

```bash
# 確認（置換はしない）
git grep -n -i -E 'dance[ _-]?hub'

# ADR-0019 を除外して置換する
git grep -l 'DANCE HUB' -- ':!docs/adr/0019-rename-service-to-p9e.md' \
  | xargs sed -i 's/DANCE HUB/p9e/g'

# テストフィクスチャのドメイン
git grep -l 'dancehub\.example' | xargs sed -i 's/dancehub\.example/p9e.example/g'

# package.json の name のみ（手で確認する）
git grep -n '"name": "dance-hub"' package.json

# 残存確認。残るのは ADR-0019、wrangler.jsonc、supabase/config.toml、
# DanceHub123! の8箇所のみであること
git grep -n -i -E 'dance[ _-]?hub'
```

`sed -i` は GNU sed の記法。macOS（BSD sed）では `sed -i ''` とする。

## 置換後に手で確認する箇所

機械的な置換では正しくならない。

- **ADR-0019** が置換されていないこと。
- **意図的に残した4箇所**（Worker 名、`project_id`、`DanceHub123!`）が残っていること。
- **読みの併記。** `README.md` に「ピーナイン」が記載されていること。
- **名称直下の一行説明。** `p9e` が説明なしで単独に置かれている箇所がないこと。
- **日本語の自然さ。** 「DANCE HUB は」→「p9e は」で文が破綻していないか。`docs/plans/`、`docs/product/` は日本語本文が多い。
- **英文ドキュメント。** `docs/architecture/` は英語。冠詞と語順が壊れていないか。
- **`docs/ai/paperthin.md`。** 9箇所と最多。文脈を読んで確認する。

## この改名が触らないもの

- ドメインモデル（Event / Artist / Organization / Venue / User）
- 掲載基準（ADR-0017、ADR-0018、`docs/product/listing-policy.md` の条文）
- マイルストーン構成
- database schema と migration

## 未決

- `p9e.dance` の取得可否。
- Worker 名と `supabase/config.toml` の `project_id` を将来変更するか。変更する場合は infra 作業として別途計画する。
- 年鑑・特集シリーズに `c10y` を書き言葉専用の符牒として用いるか（ADR-0019）。
- ロゴ・ワードマークの設計。
