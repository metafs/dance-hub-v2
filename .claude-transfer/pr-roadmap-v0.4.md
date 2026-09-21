## Summary

MVP roadmap を v0.4 に置き換える。v0.3 は M5・M6 を「未着手」としていたが、`main` @ `4d43339` では公開 discovery、media upload / 配信、`withdrawn`、metadata / sitemap / robots、runbook が実装済みである。v0.4 はコードで確認した状態を正とし、MVP までの残作業・決定事項・クリティカルパスを定める。

## Related issue

N/A

## Area labels

- [ ] `area:frontend`
- [ ] `area:backend`
- [ ] `area:db`
- [ ] `area:auth`
- [ ] `area:infra`
- [x] `area:docs`

## Requirement IDs

REQ-EVENT-008, REQ-MEDIA-001, REQ-ORG-002（参照のみ。要件の変更なし）

## Changes

- `docs/plans/mvp-implementation-roadmap.md` — v0.4 に全面改訂
  - **Verified current state**：領域ごとの実装状態と根拠ファイル
  - **Decisions required**：DEC-R1〜R8（ドメイン取得、恒久 URL、対象地域、発表会区分、代理入力の表現、代理入力の審査上限への算入、`authenticated` の Organization 読み取り範囲、ADR-0012 重複）
  - **M0 改名**：ADR-0021 / `rename-plan.md` を恒久 URL の公開より前に置く
  - **M4.1 Listing policy alignment**：DH-20〜25（main image・Artist credit の任意化、取り下げ受付窓口、代理入力、Organization 申請項目、発表会区分、B-5 / B-7）
  - **M5**：残りは DH-26 JSON-LD、DH-27 ADR-0020 の Accepted 化
  - **M6**：DH-13 / 14 / 16 / 17 に、DH-28 error tracking、DH-29 runbook リハーサルを追加
  - **M7 法務・公開ページ**、**M8 初期在庫とクローズドβ** を新設
  - クリティカルパス、release gates の更新、post-MVP 一覧の更新
- `docs/plans/initial-release-breakdown.md` — 残作業は v0.4 で管理する旨を明記（2026-09-18 時点の記録として保持）
- `docs/plans/m4-event-review-workflow.md`、`m5-public-discovery.md` — Status を v0.4 の ID に接続
- `docs/product/listing-policy.md` — Implementation follow-ups 表に Roadmap 列（DH-20〜25）を追加。条文の変更なし

## Tests / Validation

- 文書のみの変更。`pnpm check` への影響なし
- 状態表の根拠はすべて `main` @ `4d43339` のファイルで確認した。特に、publication validation 関数が今も「Artist credit 1 件以上」と「main image ちょうど 1 枚」を要求していること（`20260902130000_event_ticket_offers.sql`）を確認した

## RLS evidence

N/A

## Documentation

この PR 自体が文書の変更である。改名の置換（旧名称の残る文書）は M0 で扱い、この PR では roadmap の見出しのみ p8ce とした。

## Risks / Open Questions

- DEC-R3：`scope.md` の対象地域は東京都・神奈川県のままである。拡張するなら別 PR で scope / listing policy A-1 / Prefecture enum を揃える。
- DEC-R5 / R6：代理入力の実装方式と審査上限への算入は未決。DH-22 と M8 の在庫計画をブロックする。
- ADR-0020 は実装済みだが Status が Proposed のまま（DH-27）。

## Reviewer Notes

M7 の条文はエージェントに起草・確定させない前提で書いている。法的な文言の確定方法（専門家確認の有無）を決めておくとよい。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01RqgttJBgP72zJjjy87BSGt
