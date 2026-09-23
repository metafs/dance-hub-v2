# ADR-0023: サーバーエラーを Workers Logs に構造化して記録する

**Status:** Accepted
**Proposed:** 2026-09-23
**Accepted:** 2026-09-24

## Context

`docs/architecture/observability.md` は、エラーの記録先・保持・通知をすべて TBD としていた。本番で Server Action やページの描画が失敗しても、利用者が Next.js のエラー画面を見るだけで、運営側には何も残らない。runbook（`docs/ops/runbooks/`）はどれも「人が症状に気づくこと」を前提にしている。

MVP ロードマップ v0.4 は DH-28 として「Error tracking の最小構成」を M6 に置いている。求められているのは、少なくとも失敗が記録され、どの経路で起きたかを後から特定できることである。

前提として、アプリケーションは Cloudflare Workers 上で動く（ADR-0003）。Next.js 16 は `instrumentation.ts` の `onRequestError` を、ページ描画・Route Handler・Server Action・proxy で捕捉されなかったエラーごとに呼ぶ。Cloudflare Workers Logs は Worker の console 出力を保存し、JSON の行はフィールドとして検索できる。

## Decision

- `instrumentation.ts` に `onRequestError` を置き、エラーごとに1行の JSON を `console.error` に書く。記録の形は `src/lib/observability/request-error.ts` が決める。
- 記録するのは、エラー（名前・メッセージ・stack・digest）、リクエストのメソッドとパス、Next.js が渡すルート情報（`routePath`・`routeType` など）のみとする。**リクエストヘッダー、Cookie、クエリ文字列は記録しない。** メッセージと stack は長さを制限する。
- `wrangler.jsonc` で Workers Logs を有効にする（`observability.enabled`、head sampling 100%）。
- 第三者のエラー追跡サービスは MVP では導入しない。
- 通知（アラート）は本 ADR の範囲外とし、未解決として記録する。

## Alternatives considered

- **Sentry 等のエラー追跡サービス:** 通知・集約・リリース紐づけが揃うが、外部サービスへの送信が増え、利用者データの送り先が一つ増える。プライバシーポリシー（M7）での記載も要る。Workers 上の SDK 対応も確認が要る。MVP の件数では集約の価値がまだ小さい。
- **Logpush で外部ストレージへ送る:** 保持期間を延ばせるが、送り先の構築と費用が要る。記録そのものが無い現状では先に決める理由がない。
- **何もしない（`wrangler tail` で都度見る）:** tail はその場のトラフィックしか見えない。過去の失敗を遡れない。
- **リクエスト全体（ヘッダー込み）を記録する:** 調査はしやすいが、セッション Cookie や掲載要請の連絡先がログに残る。ログの閲覧者が個人データにも触れることになる。

## Consequences

- 本番の失敗が Workers Logs に残り、`routePath`・`routeType`・`digest` で絞り込める。利用者がエラー画面の digest を伝えれば、該当の記録を特定できる。
- 外部サービスへの送信は増えない。
- 通知は無いため、記録は人が見に行くまで気づかれない。runbook の「直後に確認する」に Observability の確認を加える。
- エラーメッセージ自体に値が含まれる場合（DB の制約違反メッセージ等）、その値はログに残りうる。メッセージは 500 文字に制限する。
- アプリケーション内で捕捉して描画を続けるエラー（例: 未読数の取得失敗）は `onRequestError` を通らない。必要ならその箇所で同じ形の記録を書く。
- Workers Logs の保持期間・料金枠は Cloudflare のプランに従う。
- OpenNext 上で `onRequestError` が呼ばれることは staging で確認する（DH-14）。

## Revisit when

- 週に一度以上、利用者からの報告で初めて障害に気づいたとき（通知が要る）。
- Workers Logs の保持期間では調査が間に合わなかったとき。
- エラーの件数が、行を目で追えない量になったとき（集約が要る）。
- 第三者サービスに送ってよいデータの範囲をプライバシーポリシーで定めたとき。
