# PR 作成手順 — バッチ 5

`origin/main` = `34a7338` 前提の 3 ブランチ。**3 本とも変更ファイルが 1 つも重なりません**
（確認済み）。任意の順で並行してレビュー・マージできます。

## 取り込み

```bash
cd ~/dance-hub-v2
git fetch origin
git fetch ~/dance-hub-v2/.claude-transfer/dance-hub-batch5.bundle 'refs/heads/*:refs/heads/*'
git push origin feature/event-withdrawal feature/text-search feature/public-metadata
```

`test/anonymous-discovery-journey` がまだ未 push なら、そちらは `-f` が必要です（rebase 済み）。

---

## 1. `feature/event-withdrawal` — 取り下げの実装

**タイトル:** `feat(events): implement the withdrawn publication state`
**ラベル:** `area:db`, `area:auth`, `area:backend`, `area:frontend`

前回「リリース前の最優先」としてご報告した欠落の実装です。ADR-0018 が 6 月に決め、
listing-policy F が約束しながら、migration が無いままだったもの。

### ⚠️ マージ前に 1 コマンド必要です

```bash
git checkout feature/event-withdrawal
pnpm db:types && git commit -am "chore(db): regenerate database types" && git push
```

このブランチはスキーマを変えるので `src/lib/database.types.ts` の再生成が要ります。
`supabase gen types` は Docker を必要とし、こちらの環境で Docker が使えないため生成でき
ませんでした。**AGENTS.md が生成型の手編集を禁じているので、推測で書くことはしていません。**

現状 `pnpm typecheck` は 14 件のエラーになりますが、**全件が `withdrawn_at` /
`withdraw_event` / `restore_event` への参照**です（確認済み）。型を再生成すれば解消します。
lint と unit test は通っています。

### 中身

- `events` に `withdrawn_at` / `withdrawal_reason` / `withdrawn_by` を追加。
- `withdraw_event` / `restore_event` は Platform Admin 限定、理由必須。監査ログに
  `event_withdrawn` / `event_restored` として残ります（enum にこの語彙が無かったので追加）。
- **公開側のクエリは 1 行も変えていません。** 匿名の読み取りはすべて
  `is_current_published_event_revision` を通るので、そこに `withdrawn_at is null` を足す
  だけで、Event・Revision・Schedule・出演者・Ticket Offer・リンク・メディアが同時に
  消えます。一覧・Calendar・Artist/Venue ページ・sitemap・画像配信のすべてに効きます。
  service role クライアントはコードベースに存在しないので、迂回経路もありません。
- `assert_event_not_withdrawn` トリガーが、取り下げ中 Event の Revision が審査に戻るのを
  拒否します。**前回ご報告した「次の承認で静かに復活する」問題は、これで構造的に起きません。**
- `/admin/withdrawals` を追加。取り下げと、取り下げ済み一覧からの復帰。

復帰（restore）を入れた理由: 取り下げは外部からの申し立てに応じる操作なので、誤判断や
申し立ての取り下げがありえます。無いと直接 SQL に戻ることになり、それは今回なくそうと
している状態そのものです。

### 意図的にやっていないこと

公開中 Festival の唯一の子を取り下げると、親はプログラムが空のまま公開され続けます。
listing-policy F-1 が「理由を問わず応じる」と定めている以上、Festival の制約で取り下げを
拒否することはできません。**親も取り下げるべきかは ADR-0018 が答えていないので、
推測せず migration と runbook にコメントで残しました。** 判断をいただければ対応します。

### 検証

ローカルに PostgreSQL を立てて全 migration を適用し、実際に動かして確認しています。

- `event_withdrawal.test.sql` 13 アサーション通過（新規）
- pgTAP 全 8 ファイル 183 アサーション通過
- 取り下げ後、匿名から見える Event が 6→5、Schedule 5→3、Ticket Offer 1→0
- 取り下げ中の Revision を `in_review` にしようとすると拒否される
- 復帰すると 6 件・5 件に戻り、監査ログに両方向が残る

---

## 2. `feature/text-search` — テキスト検索（DH-07）

**タイトル:** `feat(discovery): search Event, Artist, Venue and Organization names`
**ラベル:** `area:frontend`, `area:backend`, `area:docs`

M5 の受け入れ条件で唯一実装が無かった REQ-DISCOVERY-003 です。

**判断待ちだった「ILIKE か全文検索インデックスか」は、第三の答えにしました。**
ADR-0020（Proposed）に理由を書いています。要点:

- 日本語に語境界が無いので、「コンテンポラリー」で「コンテンポラリーダンス」が引ける
  必要がある。PostgreSQL の標準全文検索は空白区切り前提で、これができない。
- pg_bigm / pgroonga は Supabase の managed Postgres に無い。pg_trgm は CJK でほぼ無力。
- 残る選択肢は SQL の部分一致かアプリ層の照合。対象 4 名称が 4 テーブルに分かれ、
  `events` と `event_revisions` が相互参照するため、SQL 側に寄せると絞り込みが二箇所に
  割れて REQ-DISCOVERY-002 の単体テストが書けなくなる。**現在のデータ量では割に合わない。**

そこで `matchesFilters` の一部として射影上で照合します。NFKC 正規化 + 小文字化なので
「ＹＡＭＡＤＡ」「Yamada」「yamada」が同一。複数語は AND で、語ごとに別フィールドに当たって
よい（「山田 渋谷」で出演者と会場にまたがって一致）。

**正直なコストも ADR に書いています。** これは 1 リクエストで公開 Event を全件読みます。
検索が持ち込んだ性質ではなく既存の `loadPublicEvents` の性質ですが、依存が強まります。
数百件では問題なく、数万件では誤りです。Revisit 条件に明記しました。

**Status は Proposed にしてあります。** 方式がご意向と違えば実装ごと差し替えます。

検証: `pnpm check` 通過（126 tests、検索の単体テスト 7 件を含む）。

---

## 3. `feature/public-metadata` — メタデータと OGP（M6）

**タイトル:** `feat(discovery): give Artist, Venue and shared Event links real metadata`
**ラベル:** `area:frontend`

一覧・Calendar・募集中ページには既に静的メタデータがあったので、残りを埋めました。

- **Artist / Venue 詳細にメタデータが全く無く**、サイト共通のタイトルと説明を継承して
  いました。内容の違う 2 ページが検索結果とリンクプレビューで同じ名前を名乗る状態です。
  ページ本体のクエリは関連 Event を全件読むので、`<head>` 用に軽いクエリを分けています。
- **共有された Event リンクにメイン画像が載るようにしました。** OGP の画像 URL はページ
  本体と同じ `/events/{id}/image` なので、取り下げや Revision 差し替えで**同時に**配信が
  止まります。配信経路を二重に持たないための選択です。
- 画像が無い Event では Twitter カードを小さい方にフォールバックします。

検証: lint / typecheck / unit 通過。**`pnpm build` はこの環境では通せません** —
`fonts.googleapis.com` が許可リスト外のためで、**main でも同じく失敗します**（確認済み）。
ビルドは CI にお任せします。

---

# あとどのくらい残っているか

M1〜M4 は完了済み、M5 は今回の 2 本で実装が埋まります。残りは M6 と、環境が要るものです。

## コードで残っているもの

| 項目 | 規模の感覚 | 備考 |
| --- | --- | --- |
| アクセシビリティ / レスポンシブの QA と修正 | **中** | M6 の受け入れ条件。実機で触らないと defect が出てこないので、見積もりが最も不確か |
| 匿名 E2E に検索と取り下げのケースを追加 | 小 | 今回の 2 本がマージされてから |
| 公開情報漏洩の security チェック | 小〜中 | pgTAP で大半は被覆済み。storage path の確認が残り |

## 環境が要るもの（この session からは不可）

| 項目 | ブロッカー |
| --- | --- |
| DH-14 Cloudflare staging | Cloudflare アカウントと R2 バケット作成 |
| runbook 4 本のリハーサル | staging が前提。**現状 3 本が「未実施」** |
| Supabase PITR の有効化確認 | 本番プロジェクトへのアクセス |
| R2 versioning の設定 | 同上 |
| 最初の Platform Admin 作成 | 本番 DB への service role アクセス |
| DH-17 リリースチェックリスト | 上記が揃ってから |

## 判断をいただきたいもの

| 項目 | 内容 |
| --- | --- |
| ADR-0020 の方式 | Proposed のまま。射影上の照合でよいか |
| Festival 親子と取り下げ | 唯一の子を取り下げたとき親をどうするか |
| ADR 番号 0012 の重複 | どちらを採番し直すか（0021 が空き） |
| 出演者本人からの部分削除 | 専用の操作も監査アクションも無い。現状は直接 SQL |

## 体感として

**コードの残りは多くありません。**大きい穴は今回の 3 本で埋まったと思います。M6 で本当に
残っているのは、アクセシビリティ QA という「触ってみないと分からない」作業と、
**staging 環境の構築**です。後者が全体の律速で、runbook のリハーサル・リリース
チェックリスト・security チェックの一部がすべてその後ろに並んでいます。

逆に言うと、**次にやるべきは Cloudflare staging と Supabase 本番プロジェクトの準備**で、
これは私の側からは進められません。そこが動き出せば、残りは順に閉じられる状態です。
