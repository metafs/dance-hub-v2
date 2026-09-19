# PR 作成手順 — バッチ 4

`origin/main` = `dea5573`（PR #54 マージ後）を前提にした 4 ブランチ。相互に競合しない
ので、任意の順で並行してレビューできます。

## 取り込み

```bash
cd ~/dance-hub-v2
git fetch origin
git fetch ~/dance-hub-v2/.claude-transfer/dance-hub-batch4.bundle 'refs/heads/*:refs/heads/*'
git push origin \
  test/event-fields-accessible-name \
  docs/fix-adr-index \
  test/anonymous-discovery-journey \
  docs/operations-runbooks
```

`git fetch` はローカルの同名ブランチを上書きします。同名の作業ブランチがある場合は先に
確認してください。

## PR #54 について（先に読んでください）

作業中に `feature/media-upload` が PR #54 としてマージされたのを確認しました。
`6e9b53b merge: resolve media upload against main` で main に対して正しく解決されて
おり、配信ルート・migration・ADR-0016 は巻き戻っていません。**問題ありません。**

これに伴い、こちらで用意していた `fix/media-image-pairing`（#54 の内容を main の上に
作り直したもの）は**破棄しました。**いま出すと #54 の改善を差し戻してしまうためです。
残った差分は 2 点だけで、それを `test/event-fields-accessible-name` に切り出しています。

---

## 1. `test/event-fields-accessible-name`

**タイトル:** `test(events): guard the field-error accessible name`
**ラベル:** `area:frontend`

PR #54 が入れたアクセシブル名の修正に、回帰テストを付けるだけの PR です。

#54 はフィールドエラーを `<label>` の外に出しました。画像の対応エラーは
「代替テキスト」を含みながら**ファイル入力**に属するため、`<label>` の内側にあると
2 つのコントロールが「代替テキスト」に反応し、ラベル経由の参照が壊れるからです。

この構造を守るテストが無く、誰かが `<label>` の中に戻してもレビューを通過します。
本 PR は、対応エラーを出した状態で `EventFields` を描画し、「代替テキスト」を含む
`<label>` がちょうど 1 つで、それが `imageAlt` 入力自身のものであることを検証します。

`vitest.config.ts` の include が `*.test.ts` のみだったため、あわせて `*.test.tsx` を
追加しています。**これが無いと .tsx のテストはどこからも収集されず、黙って実行されません。**

**検証:** `pnpm check` 通過（16 files / 118 tests）。現在の main に対して緑であることを
確認済みで、#54 の修正が効いていることの裏付けにもなっています。

---

## 2. `docs/fix-adr-index`

**タイトル:** `docs(adr): correct the index status for ADR-0016`
**ラベル:** `area:docs`

`docs/adr/README.md` の 1 行。ADR-0016 の本文は Accepted ですが、索引が Proposed のまま
です（#54 マージ後の main でも未修正）。

索引にはもう一つ既知の不整合があります。**ADR 番号 0012 が 2 つ**
（`0012-use-authored-global-css.md` と `0012-use-native-runtime-validation.md`）。
どちらを採番し直すか決めていないので、この PR には含めていません。**判断をいただければ
別 PR にします。**

---

## 3. `test/anonymous-discovery-journey`

**タイトル:** `test(discovery): cover the anonymous journey end to end`
**ラベル:** `area:db`, `area:frontend`

M1.3（決定的な seed）と M5（匿名クリティカルジャーニー）。既存の E2E はすべて
オーサリング UI でフィクスチャを作っていたため、**サインアウト状態の閲覧者が公開情報に
到達できることを何も証明していませんでした。**

- `supabase/seed.sql` に公開済み Event を 6 件直接書きます（2 会場公演 / Schedule 無しの
  open_call / Festival 親 / Festival 子 / 過去公演 / 中止公演）。審査ワークフローを
  経由しないのは、境界を再現可能にするためです。バケットに実体が無いので `event_media`
  は付けていません。
- 上記により `public_visibility.test.sql` の全件 `count(*)` が意味を失うため、7 つの
  assertion をそのテスト自身の 3 revision に限定しています。
- `tests/e2e/m5-public-discovery.spec.ts` を追加（4 テスト、すべて未ログイン）。

単独のフィルタでは出ない条件を意図的に含めています。地域は Schedule に由来するので、
神奈川の Schedule は**地域と日付を同時に**満たす必要があります。Schedule を持たない
open_call はそのどちらにも属しません。

**検証:** `pnpm check` 通過。**E2E と pgTAP は未実行です**（この環境で Docker が使えず、
CI が初回実行になります）。seed の追記が既存テストに与える影響は静的に追いましたが、
CI で確認してください。

**`area:db` の negative RLS 証拠:** `public_visibility.test.sql`（改変あり）。匿名が
未承認 Revision を読めないことを引き続き検証しています。新しい policy は追加していません。

---

## 4. `docs/operations-runbooks`

**タイトル:** `docs(ops): write the four release runbooks`
**ラベル:** `area:docs`

M6 が要求する 4 つの runbook（`docs/ops/runbooks/`）。汎用テンプレートではなく、
リポジトリの実際の仕組みから書いています。

書いている最中に見つかった欠落を 4 つ、runbook 本文に明示しました。**うち 1 つは
リリース前に実装が必要だと思います。**

1. **`withdrawn` が未実装。** ADR-0018 が決定し listing-policy F が約束しているのに、
   migration がありません。いまの取り下げは直接 SQL で `published_revision_id` を
   null にするしかなく、しかも `approve_event_revision` は無条件にこれを設定するため、
   **次の承認で静かに取り下げが解除されます。** 権利申し立て対応としては成立していない
   状態です。手順は書きましたが、運用では埋まりません。
2. `event_review_action` enum に取り下げに当たる値が無く、`actor_id` は NOT NULL。
   手動の取り下げは正直な監査行を書けません。
3. **最初の Platform Admin をアプリから作れません。** `platform_admins` の RLS が既存の
   管理者を要求するため、一人目は service role で直接 insert が必要です。本番初期設定の
   最初の作業になります。
4. R2 に versioning もバックアップも無く、Supabase の PITR 有効／無効が未確認です。
   どちらも本番稼働の前提条件です。

リハーサル状況は runbook ごとに記録してあり、3 つは「未実施」です。staging が無いため
（DH-14）実行して確かめられていません。索引にもその旨を書いています。**M6 の
「tested runbooks」は、これでは満たしていません。** staging ができた時点で実行し、差異を
反映する必要があります。

`docs/architecture/observability.md` の「incident runbook は無い」という記述も、実態に
合わせて直しています（存在するが未リハーサル、かつ検知の代替にはならない）。

---

## 残っているもの

| ID | 内容 | 状態 |
| --- | --- | --- |
| — | `withdrawn` の実装 | 未着手。上記 4-1。**最優先だと思います** |
| DH-07 | 全文検索の方式（ILIKE / 全文検索インデックス） | **判断待ち** |
| — | ADR 番号 0012 の重複 | **判断待ち** |
| DH-14 | Cloudflare staging | この環境からは不可 |
| DH-17 | リリースチェックリスト | DH-13 / DH-16 に依存 |
