# DANCE HUB — Product Requirements

**Status:** Draft  
**Version:** 0.1  
**Last Updated:** 2026-08-21

## 1. Product Definition

DANCE HUB は、ダンス・パフォーマンスに関する情報を構造化して蓄積し、探索できる情報プラットフォームである。

中心となる情報は以下とする。

- 誰が関わっているか
- 何が行われる／行われたか
- いつ行われる／行われたか
- どこで行われる／行われたか
- 誰／どの組織が主催しているか

短期的には、ユーザーが現在・今後のイベントを発見するためのサービスを提供する。
長期的には、蓄積された情報をダンス・パフォーマンス領域のアーカイブとして利用できる状態を目指す。

## 2. Problem

ダンス・パフォーマンスに関する情報は、劇場・会場Webサイト、アーティストWebサイト、SNS、チケット販売サイト、イベント情報サイト、フライヤー、主催団体Webサイトなどに分散している。

そのため、鑑賞者がイベントを横断的に探したり、特定のアーティスト・会場・地域の活動を継続的に追跡したりすることが難しい。また、公演終了後に情報が消失・分散しやすく、過去の活動を体系的に調査することも難しい。

DANCE HUB はこれらの情報を共通のデータモデルで扱い、現在のイベント探索と将来のアーカイブ利用を両立させる。

## 3. Product Goals

### G-001 — Event Discovery
ユーザーが、自分の条件に合うダンス・パフォーマンス関連イベントを発見できる。

### G-002 — Structured Information
イベント、アーティスト、組織、会場、日程などを独立したデータとして管理し、それぞれの関係を表現できる。

### G-003 — Organizer Publishing
主催者が自身のイベント情報を登録・編集・公開できる。

### G-004 — Archive
終了したイベントについても情報を保持し、過去の活動として参照可能にする。

### G-005 — Extensibility
将来的な検索高度化、統計、推薦、研究・分析などに利用可能なデータ構造を維持する。

## 4. Target Users

### Visitor
イベントを探す一般利用者。

主な目的:
- 今日・今週・今月のイベントを探す
- 地域からイベントを探す
- アーティストからイベントを探す
- 会場からイベントを探す
- イベント詳細を確認する
- 外部チケットページへ移動する

### Organizer
イベントを主催・運営する個人または組織のメンバー。

主な目的:
- イベントを登録する
- 日程を登録する
- 会場を指定する
- 出演者・関係者を登録する
- イベント情報を編集する
- イベントを公開する

### Administrator
DANCE HUBを管理するユーザー。

主な目的:
- データ品質を維持する
- 不正・重複・誤情報を修正する
- 必要に応じて公開状態を管理する

## 5. Functional Requirements

### 5.1 Events

#### REQ-EVENT-001 — Event List
公開済みイベントを一覧表示できること。

#### REQ-EVENT-002 — Event Detail
各イベントに固有の詳細ページを持つこと。最低限、タイトル、説明、イベント種別、日程、会場、関係アーティスト、主催組織、チケット・申込情報、画像を表示できること。

#### REQ-EVENT-003 — Multiple Schedules
1つのイベントに複数の日程を登録できること。

#### REQ-EVENT-004 — Event Type
イベントに種別を設定できること。初期候補は Performance / Workshop / Talk / Audition / Open Studio / Festival / Other とし、将来的に変更・拡張可能な設計とする。

#### REQ-EVENT-005 — Event Status
イベントは最低限 Draft / Published / Cancelled の状態を持つこと。日時が過去になったことと公開状態は別概念として扱う。

#### REQ-EVENT-006 — External Link
イベントにチケット販売ページ、申込フォーム、公式ページ等の外部URLを設定できること。

#### REQ-EVENT-007 — Historical Retention
終了したイベントを自動削除せず、過去イベントとして参照できること。

### 5.2 Calendar and Discovery

#### REQ-DISCOVERY-001 — Calendar
イベントを日付単位で閲覧できること。

#### REQ-DISCOVERY-002 — Date Filtering
特定の日、または開始日〜終了日でイベントを絞り込めること。

#### REQ-DISCOVERY-003 — Location Filtering
地域・エリアを利用してイベントを絞り込めること。地域区分の具体的設計は別途定義する。

#### REQ-DISCOVERY-004 — Event Type Filtering
イベント種別による絞り込みができること。

#### REQ-DISCOVERY-005 — Search
最低限、イベント名、アーティスト名、会場名、組織名を検索対象にできること。

### 5.3 Artists

#### REQ-ARTIST-001 — Artist Entity
アーティストを独立したEntityとして管理できること。

Artistは個人に限定しない。ダンスカンパニー、コレクティブ、その他の創作・表現主体を含める。

初期のArtist Type候補:
- Individual
- Company
- Collective
- Other

#### REQ-ARTIST-002 — Artist Without Account
DANCE HUBのアカウントを持っていない人物・団体もArtistとして登録できること。

#### REQ-ARTIST-003 — Artist Detail
Artist Detailページで最低限、名前、プロフィール、Webサイト、関係するイベントを表示できること。

#### REQ-ARTIST-004 — Event Credits
1イベントに複数のArtistを関連付けられ、Artistごとに役割を設定できること。Choreography / Performance / Music / Lighting / Dramaturgy 等を想定し、自由記述のCreditも許容する。

#### REQ-ARTIST-005 — Artist / Organization Separation
ArtistとOrganizationは別Entityとして扱うこと。同じ実世界のカンパニーまたはコレクティブが、Artist（創作・表現主体）とOrganization（運営・公開主体）の両方として存在することを許容する。

### 5.4 Venues

#### REQ-VENUE-001 — Venue Entity
会場を独立したEntityとして管理できること。

#### REQ-VENUE-002 — Venue Detail
Venue Detailページで最低限、会場名、住所、地域、説明、Webサイト、関連イベントを表示できること。

#### REQ-VENUE-003 — Venue Relation
EventとVenueの関連は、会場名文字列ではなくVenue Entityとの参照で表現すること。

#### REQ-VENUE-004 — Venue Map Data
将来的な地図表示に利用できる位置情報を保持可能であること。

### 5.5 Organizations

#### REQ-ORG-001 — Organization Entity
主催団体・カンパニー・制作団体等をOrganizationとして管理できること。

#### REQ-ORG-002 — Organization Members
1つのOrganizationに複数のユーザーが所属できること。

#### REQ-ORG-003 — Multiple Organizations
1ユーザーが複数のOrganizationに所属できること。

#### REQ-ORG-004 — Membership Roles
Organization内で最低限 Owner / Admin / Editor の権限を表現できること。

### 5.6 Authentication and Publishing

#### REQ-AUTH-001 — Authentication
Organizer向け機能を利用するユーザーは認証されていること。

#### REQ-AUTH-002 — Authorization
ユーザーは権限を持つOrganizationのデータのみ作成・更新できること。

#### REQ-AUTH-003 — Public Read
公開済みイベントの閲覧にはログインを要求しないこと。

#### REQ-PUBLISH-001 — Event Creation
権限を持つユーザーが新しいEventを作成できること。

#### REQ-PUBLISH-002 — Event Editing
権限を持つユーザーがEventを編集できること。

#### REQ-PUBLISH-003 — Draft
Eventを公開せずDraftとして保存できること。

#### REQ-PUBLISH-004 — Publish
Draft Eventを公開できること。

### 5.7 Media

#### REQ-MEDIA-001 — Event Image
イベントに画像を登録できること。

#### REQ-MEDIA-002 — Media Metadata
画像には将来的にAlt text、Credit、Display orderを保持可能であること。

#### REQ-MEDIA-003 — Multiple Media
データモデル上はイベントに複数メディアを関連付けられること。MVP UIで複数画像入力を提供するかは別途判断する。

## 6. Non-functional Requirements

### NFR-SEC-001 — Authorization Enforcement
アクセス制御をUIのみで実装してはならない。バックエンドまたはデータベースレイヤーで権限を強制する。

### NFR-SEC-002 — Secret Management
秘密情報をクライアントコードまたはGitリポジトリへ含めない。

### NFR-DATA-001 — Referential Integrity
主要Entity間の関係は可能な限りID参照によって保持し、名称文字列による疑似Relationを避ける。

### NFR-DATA-002 — Migration
データベース構造の変更はMigrationとして管理する。

### NFR-DATA-003 — Reproducibility
ローカルデータベースをMigrationとSeedから再構築できること。

### NFR-TYPE-001 — Type Safety
データベーススキーマとApplication code間で可能な限り型情報を共有する。

### NFR-SEO-001 — Public Discoverability
Event、Artist、Venue等の公開ページを検索エンジンが取得可能であること。

### NFR-SEO-002 — Metadata
公開ページに適切なtitle、description、OG metadataを設定可能であること。

### NFR-ACC-001 — Accessibility
主要操作をキーボードで行え、Semantic HTML、focus state、画像altなど基本的アクセシビリティ要件を満たす。

### NFR-RESP-001 — Responsive
スマートフォン・タブレット・デスクトップで利用可能とし、Mobile Firstを基本方針とする。

### NFR-TEST-001 — Automated Verification
主要機能について自動テスト可能な構造を持つこと。

### NFR-AI-001 — Agent-readable Repository
CodexおよびClaude Codeが、リポジトリ内のドキュメントからプロダクト要件、アーキテクチャ、開発ルール、テスト方法、セキュリティ制約を判断できること。

### NFR-AI-002 — Deterministic Validation
AI Agentが単一の標準コマンドからコード品質を検証できること。

## 7. Product Constraints

- ダンス・パフォーマンス領域を主対象とする
- MVPでは日本語を主要言語とする
- Eventを中心とした構造化データを優先する
- AccountとArtistは別Entityとして扱う
- Artistには個人、ダンスカンパニー、コレクティブ等を含める
- ArtistとOrganizationを同一概念として扱わない
- OrganizerとOrganizationを同一概念として扱わない
- 終了したイベントを削除前提にしない
- 外部チケットサービスを置き換えることをMVPの目的としない
- AI機能そのものをMVPの価値にしない

## 8. Success Criteria for Initial MVP

### Visitor Flow
1. Event一覧を開く
2. 日付・地域等で探す
3. Event Detailを開く
4. ArtistまたはVenueを確認する
5. 必要に応じて外部チケットページへ移動する

### Organizer Flow
1. ログインする
2. 所属Organizationを利用する
3. EventをDraft作成する
4. Schedule / Venue / Artist / Ticket情報を入力する
5. Eventを公開する
6. 公開後に編集する

## 9. Open Questions

- 初期対象地域を関東に限定するか、日本全国とするか
- Workshop等をPerformanceと同じEventモデルに完全統合するか
- Open Call / Residency募集をEventとして扱うか
- Artist同士のCompany / Collective membershipをMVPで構造化するか
- 同一実世界団体に対応するArtistとOrganizationを明示的に関連付けるか
- Venue情報を誰が作成・編集できるか
- Artist情報を誰が作成・編集できるか
- Organizationの新規作成・承認フロー
- Event公開時に管理者承認を必要とするか
- 多言語対応の開始時期
- 既存データの取り込み方法

これらは推測で実装せず、決定後にRequirementsまたはADRへ反映する。
