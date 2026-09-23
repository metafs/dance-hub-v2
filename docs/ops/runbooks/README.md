# p8ce — Runbooks

**Status:** Draft
**Last Updated:** 2026-09-19

`docs/plans/m6-release-candidate.md` は「Deployment, migration rollback, media
recovery, and moderation operations have tested runbooks」をリリース条件に置く。本
ディレクトリはその四つを収める。

| Runbook | 対象 | リハーサル状況 |
| --- | --- | --- |
| [deployment.md](deployment.md) | 本番へのデプロイと切り戻し | 未実施 |
| [migration-rollback.md](migration-rollback.md) | migration の切り戻しとデータ復旧 | 未実施 |
| [media-recovery.md](media-recovery.md) | R2 とメタデータの不整合の復旧 | 未実施 |
| [moderation.md](moderation.md) | 審査と掲載取り下げ | 一部のみ（審査導線は E2E で被覆） |

## リハーサル状況について

四つとも「未実施」または「一部のみ」である。本番環境も staging 環境もまだ存在せず、
実行して確かめた手順ではない。M6 の条件は満たしていない。

この状態で文書を先に置く理由は、手順の不在そのものが検出されるべき欠落だからである。
staging が用意された時点で各 runbook の手順を実行し、差異を反映したうえでリハーサル
状況を更新する。リハーサル前の手順は、実行時に必ず読み手が妥当性を検証すること。

## 書き方の約束

- 手順には、実行して確かめた事実と、コードから読み取っただけの推定を混ぜない。推定に
  は「未検証」と明記する。
- 破壊的な操作には、実行前に確認する条件と、失敗した場合の状態を書く。
- 実装が存在しない運用は、回避策を書いたうえで欠落として明示する。運用で埋められる
  ことを理由に実装の欠落を隠さない。
