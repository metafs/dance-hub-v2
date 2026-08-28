# DANCE HUB — Product Scope

**Status:** Draft  
**Version:** 0.1  
**Last Updated:** 2026-08-21

## 1. Purpose

本書はDANCE HUBの初期開発において、今作るもの、後で作るもの、現在作らないものを明確にする。

AI Agentは、本書に記載されていない機能を必要性の確認なく追加してはならない。

## 2. MVP Scope

### Public Event Discovery
- Event一覧
- Event詳細
- Calendar
- 日付による絞り込み
- 地域による絞り込み（初期対象：関東・関西の2エリア）
- Event Typeによる絞り込み
- 基本的なテキスト検索
- 過去イベントの閲覧

### Artist
- Artist Entity
- Artist Type: Individual / Company / Collective / Other
- Artist一覧
- Artist詳細
- Artistプロフィール
- ArtistとEventの関連
- Event内でのCredit / Role
- Artistに関連するEvent一覧

Artist自身によるプロフィールClaim / 編集機能、およびArtist同士のmembership構造はMVP必須としない。

### Venue
- Venue Entity
- Venue一覧
- Venue詳細
- 住所
- Webサイト
- 地域情報
- 座標保持
- Venueに関連するEvent一覧

地図UIは実装候補とするが、Event公開フロー完成より優先しない。

### Organization
- Organization Entity
- Organization membership
- Owner / Admin / Editor等のRole
- OrganizationとEventの関連
- 1ユーザーの複数Organization所属

高度なOrganization管理UIは後回しにできる。

### Authentication
- Organizer login
- Logout
- Authenticated session
- Organization based authorization

Social Login / MFA / Enterprise SSOはMVP必須としない。

### Event Publishing
Organizerが以下を行えること。
- Event作成
- Draft保存
- Event編集
- Event公開
- Eventキャンセル
- Schedule追加・削除
- Venue指定
- Artist / Credit追加
- Ticket情報入力
- 画像登録

### Media
最低限:
- Event main image
- Image upload
- Image display
- Alt text保持

データモデル上は複数Mediaへ拡張可能にする。

### SEO
- Event metadata
- Artist metadata
- Venue metadata
- Open Graph基本対応
- sitemap生成可能な構造
- 公開ページのServer Rendering

### Testing / Development Infrastructure
MVP以前の開発基盤として必須:
- Lint
- Type check
- Unit tests
- Critical E2E tests
- Build verification
- CI
- Local DB
- Migration
- Seed
- AI Agent instructions
- Architecture documentation
- Prompt templates

## 3. Should Have After Core MVP

### Discovery
- 検索ランキング改善
- 複数条件フィルター
- 地図検索
- 現在地周辺検索
- ルールベースの関連Event表示

### Artist
- Artist aliases
- 英語名
- Artist category
- ArtistによるプロフィールClaim
- Company / Collective membership history

### Venue
- Venue画像
- Venue設備情報
- Venue capacity
- Accessibility情報

### Event
- 複数画像
- Flyer PDF
- Video URL
- Sold out表示
- Doors open time
- Duration
- Age restriction
- Language information

### Organization
- 公開Organization profile
- Member invitation
- Member management UI
- Artist representationとの明示的関連

### Archive
- 年別Event閲覧
- 過去Event検索
- Archive専用UI

### Data Import
- Organization管理者向けCSV一括インポート
- 提携劇場・団体からのデータ提供（フォーマットは個別検討）

### Internationalization
- 英語UI・英語コンテンツ対応（MVP完了後、日本語必須・英語任意から開始）
- 3言語目以降の対応は本項目の実績を見て再検討する

## 4. Later

### User Features
- Favorites
- Watchlist
- User profile
- Event attendance history
- Notification
- Personalized feed

### Editorial
- Magazine
- Interviews
- Reviews
- Essays
- Curated collections
- Editorial recommendations

### Analytics
- 年別公演数
- 地域別公演数
- Artist活動履歴可視化
- Venue利用傾向
- Artist network analysis
- Public statistics dashboard

### AI / ML
- Semantic search
- Event recommendation
- Automatic metadata extraction
- Flyer information extraction
- Duplicate detection
- Artist / Venue entity resolution
- Natural language discovery
- Archive research assistant

AI機能はデータ品質と基本検索が成立してから検討する。

### Monetization
- Paid listing
- Premium placement
- Organization subscription
- Stripe integration
- Sponsored Event

## 5. Explicitly Out of Scope for Initial MVP

- 独自チケット決済
- DANCE HUB内でのチケット発券
- Stripe決済
- SNSタイムライン
- DM / Chat
- User-to-user messaging
- Comments
- User reviews
- Ratings
- Favorites
- Recommendation algorithm
- AI assistant
- Generative AIによるEvent本文生成
- 外部サイトの自動スクレイピングによるイベント情報取得
- Magazine CMS
- Native iOS App
- Native Android App
- Real-time collaborative editing
- Complex analytics dashboard
- Paid plans
- Advertisement platform
- Ticket inventory management

## 6. Architecture Scope Constraints

### Keep
- Event中心のDomain Model
- Artist / Venue / Organizationの独立Entity
- ArtistにIndividual / Company / Collectiveを含める
- ArtistとOrganizationは分離する
- Multiple schedules
- Historical Event retention
- Database relation by ID
- Explicit authorization

### Avoid
- Entity情報の文字列コピーによるRelation
- 巨大なEventテーブルへの全情報集約
- UI Layerのみのアクセス制御
- 不要なMicroservices
- MVP段階での検索専用インフラ
- premature optimization
- 利用予定のないCloud service導入

## 7. AI Development Scope

Milestone 0ではプロダクト機能開発より先にAI開発環境を整備する。

含めるもの:
- `AGENTS.md`
- `CLAUDE.md`
- Product docs
- Architecture docs
- ADR
- Planning template
- Prompt templates
- GitHub Issue templates
- PR template
- Automated validation
- Codex / Claude Code review workflow

基本ルール:

`1 Issue = 1 Branch = 1 Worktree = 1 Primary Agent`

他Agentは主としてPlanまたはReviewに利用する。

## 8. Scope Change Rule

新しい機能が提案された場合、MVP / Should Have / Later / Out of Scope のいずれかに分類する。
分類できない機能を直接実装しない。

MVP Scopeを変更する場合は、この文書と必要なRequirementsを更新する。
Architecture上の新しい判断が必要な場合はADRを作成する。