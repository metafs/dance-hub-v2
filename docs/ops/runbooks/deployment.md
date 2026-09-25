# Runbook — デプロイ

**Status:** Draft
**Last Updated:** 2026-09-19
**リハーサル:** 未実施（本番・staging いずれも未構築）

## 対象

Next.js アプリケーションを Cloudflare Workers に、スキーマ変更を Supabase
PostgreSQL に反映する。両者は別系統であり、順序を誤ると片方だけが新しい状態になる。

## 前提

`package.json` の scripts が唯一の実行経路である。ここに無いコマンドを即席で組み立て
ない（AGENTS.md の validation 規約）。

- Worker: `pnpm deploy` = `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
- 検証ビルド: `pnpm preview`（ローカルで Workers ランタイムを起動する）
- スキーマ: Supabase CLI の migration push。`pnpm db:*` はすべてローカル用であり、
  `pnpm db:reset` は `--local` 固定である。本番に向けて実行できるものは無い。

GitHub Actions には deploy workflow が無い。`.github/workflows/` にあるのは CI と型生成
のみで、デプロイは作業端末から手で実行する。誰がいつ何を出したかは記録されない。これは
既知の欠落である（DH-14 で staging を用意する際に自動化する）。

## 必要な環境変数

`src/instrumentation.ts` が起動時に `validateEnvironment()` を呼ぶ。欠けている場合は Worker
が起動時に落ちる。設定漏れはページ単位ではなくサービス全体の停止として現れる。

| 変数 | 必須 | 欠けたときの挙動 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 必須 | 起動時に例外。全ページ停止 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 必須 | 同上 |
| `NEXT_PUBLIC_SITE_URL` | 任意 | 起動はする。sitemap と絶対 URL が出ない |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile受付を有効にする場合は必須 | 未設定だと公開の掲載要請フォームを無効化 |
| `TURNSTILE_SECRET_KEY` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` と同時に必須 | 未設定だと要請検証に失敗 |

掲載削除・修正要請フォームを有効にする場合、Turnstile の公開キーと秘密キーは必ず
同じ環境の組として設定する。片方だけを設定してはならない。`.env.example` をテンプレートに
して、公開キーは `NEXT_PUBLIC_TURNSTILE_SITE_KEY`、秘密キーはサーバー専用の
`TURNSTILE_SECRET_KEY` に登録する。秘密キーをブラウザ変数やリポジトリへ置かない。

`NEXT_PUBLIC_SITE_URL` は任意だが、未設定のまま公開すると sitemap が機能しない。初回
デプロイでは必ず設定する。

## R2 バケット

`wrangler.jsonc` は `MEDIA` binding を `dance-hub-media`（preview は
`dance-hub-media-preview`）に結ぶ。**バケットは deploy の前に存在していなければならない。**
存在しない状態で deploy すると、画像配信経路だけが実行時に失敗する。ビルドは通る。

バケットは private のままにする。public access を有効にしてはならない。ADR-0016 は
`/events/{eventId}/image` を唯一の読み取り経路と定めており、公開すると未承認 Revision の
画像が object key を知る者に到達する。

## 手順

1. **main の CI が緑であることを確認する。** 赤い main をデプロイしない。
2. **migration を先に適用する。** アプリケーションコードが新しい列を前提にしている場合、
   逆順だと新コードが存在しない列を読む。
   - 適用前に、その migration が **前方互換**（既存コードが動き続ける）であることを確認
     する。列の削除・型の縮小・NOT NULL 追加は前方互換ではない。
   - 前方互換でない変更は、この手順では出さない。
     [migration-rollback.md](migration-rollback.md) の二段階手順に従う。
3. **`pnpm verify` をローカルで通す。** `verify:app`（lint / typecheck / unit / build）と
   `verify:database`（db reset・型ドリフト・pgTAP・E2E）。CI と同じ内容だが、デプロイ元
   の作業ツリーで実行することに意味がある。
4. **`pnpm preview` で Workers ランタイム上の起動を確認する。** `next dev` は Node で動く
   ため、`getCloudflareContext()` を使う経路（メディア）はここで初めて本番相当になる。
5. **`pnpm deploy` を実行する。**
6. **直後に確認する:**
   - `/` と `/events` が 200 を返す（環境変数の検証を通過した証拠）
   - 画像を持つ公開 Event の `/events/{id}/image` が 200 を返す（R2 binding の証拠）
   - `/sitemap.xml` に公開 Event が含まれる
   - `/admin/events` が未ログインで `/login` に飛ぶ
   - Cloudflare ダッシュボードの Worker → Observability に、デプロイ後の
     `event:request_error` が増えていない（ADR-0023）

## エラーの調べ方

サーバー側で捕捉されなかったエラーは、`src/instrumentation.ts` の `onRequestError` が1行の JSON
として console に書き、Workers Logs が保存する（ADR-0023）。

- **ダッシュボード:** Workers & Pages → 対象 Worker → Observability。`event` が
  `request_error` の行を、`routePath`・`routeType`・`digest` で絞り込む。
- **その場で追う:** `pnpm exec wrangler tail --format json`。本番のトラフィックを流すため、
  調査が済んだら止める。
- **利用者からの報告:** Next.js のエラー画面が示す digest は、記録の `digest` と一致する。

記録にはリクエストヘッダー、Cookie、クエリ文字列を含めない。含まれていた場合は
ADR-0023 に反するため、コードを直す。

## 切り戻し

**Worker:** Cloudflare は過去の version を保持しており、`wrangler rollback`
またはダッシュボードの version 一覧から戻す。*未検証* — この手順は実行して確かめていない。
最初の本番デプロイの直後に、意図的に切り戻して確かめること。

**データベース:** 戻せない。migration は forward-only である
（[migration-rollback.md](migration-rollback.md)）。Worker を古い version に戻しても
スキーマは新しいままなので、**手順 2 で前方互換性を確認していない場合、切り戻した古い
コードが動かない。** 前方互換の確認は、ここで効いてくる。

**片方だけ戻したときの状態:**

| 状況 | 公開面への影響 |
| --- | --- |
| Worker を戻し、スキーマが新しい | 追加のみの変更なら無害。破壊的変更なら旧コードが壊れる |
| Worker が新しく、migration 未適用 | 新コードが存在しない列を読み、該当ページが 500 |

## 未解決

- deploy workflow が無く、実行記録が残らない。
- staging が無いため、本番が最初の実行環境になる。DH-14 の対象。
- エラーは記録されるが、通知されない（ADR-0023）。人が Observability を見に行くまで
  気づかない。上記「直後に確認する」は人手の代替であり、監視ではない。
- Workers Logs への出力は staging で未確認（DH-14）。
