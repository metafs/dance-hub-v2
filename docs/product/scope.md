# DANCE HUB — Product Scope

**Status:** Draft
**Version:** 0.3
**Last Updated:** 2026-09-02

## 1. Purpose

本書は初期開発で作るものと後続へ送るものを定める。記載のない機能は必要性を確認せず追加しない。

## 2. MVP Scope

### Public discovery

- Event 一覧・詳細、Calendar、日付・Event Type・テキスト検索
- 東京都・神奈川県の Venue を起点にした地域絞り込み
- Open Call / Audition / Residency の応募締切順一覧
- 過去 Event と Cancelled Event の公開・中止表示
- Festival の親子表示（同一 Organization、1 段）

### Organizations and authorization

- Organization Application と Platform Admin による承認
- 承認時の Organization・初期 Owner の原子的作成
- Owner / Admin / Editor Membership と複数 Organization 所属
- Platform Admin を Organization Role と分離した認可
- Organization Application、Event Revision、中止申請の審査結果を提出者へ届けるアプリ内通知インボックス

### Moderated data creation

- Artist / Venue Candidate の作成、審査、activation、rejection、merge
- canonical Artist / Venue の変更 request
- Event の stable identity と Event Revision
- Revision の draft、提出、差戻し、承認、公開 pointer 更新
- Owner / Admin による Cancelled Event の申請と Platform Admin 審査

### Event editing

- Draft 保存、Schedule の追加・削除、Venue 指定、Artist / Credit、Ticket Offer、Ticket / 申込 Link、外部 URL
- `apply` Event の応募締切（Schedule 0 件を許容）
- Festival 子 Event 紐づけ
- Event Revision ごとの main image 1 枚と alt text

### Development foundation

- Next.js、Supabase PostgreSQL、Cloudflare の採用に沿う project scaffold
- migration、seed、lint、type check、unit / critical E2E、build、CI
- Row Level Security と server-side authorization の検証

## 3. After Core MVP

- 地図 UI、複数画像、Flyer PDF、Video URL、sold out、doors open、duration
- Email・push・外部 provider による通知、一般告知、marketing 通知
- 公開 Organization profile、Member invitation / management UI
- Artist aliases、英語名、Artist Claim、Company / Collective membership
- Festival への他 Organization Event の参加
- 市区町村・独自エリア、オンライン Event の地理モデル
- 検索ランキング、地図検索、関連 Event、通知、Favorites
- CSV import、提携先からのデータ提供、英語 UI・コンテンツ

## 4. Explicitly Out of Scope for MVP

- 独自チケット決済・発券・Stripe 決済
- EventScheduleごとのTicket Offer、Ticket OfferとTicket Linkの関連付け、Dynamic Pricingの計算・同期
- SNS、DM、コメント、レビュー、評価
- Email・push・外部 provider による通知配信
- レコメンド algorithm、生成 AI による本文生成、外部サイトの自動スクレイピング
- Magazine CMS、Native mobile apps、real-time collaborative editing
- 有料プラン、広告、複雑な分析 dashboard

## 5. Architecture Constraints

- Event、Revision、Schedule、Venue、Artist、Organization は独立 Entity とし、関係を文字列コピーで表現しない。
- Schedule は Venue を参照し、地域は Venue の Prefecture から導出する。
- 公開内容は承認済み Revision のみとし、UI だけに認可を依存しない。
- `Asia/Tokyo` を日時の標準とし、過去・中止情報を削除しない。
