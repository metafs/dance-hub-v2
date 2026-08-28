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
地域・エリアを利用してイベントを絞り込めること。初期対象地域は関東・関西の2エリアに限定する。Venueは都道府県単位のデータを保持し、関東・関西への分類（region_group）はアプリケーション層のマッピングとして管理する。これにより将来の対象地域拡張時にスキーマ変更を不要にする。

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

#### REQ-ARTIST-006 — Artist Edit Ownership
Artistレコードは、それを作成したOrganizationのみが編集できること。他のOrganizationは閲覧・イベントへの参照のみ可能とする。Administratorは重複・誤情報の修正のため、すべてのArtistレコードを編集できる。

#### REQ-ARTIST-007 — Organization Representation Link
ArtistとOrganizationは、任意（optional）の1:1相互リンクを持てること。リンクはどちらか一方が存在しなくても成立可能とし、必須関係にしない。Artistは通常User Accountを持たないため、なりすまし・誤リンクを防ぐ目的でリンクの成立にはAdministrator承認を必須とする。

### 5.4 Venues

#### REQ-VENUE-001 — Venue Entity
会場を独立したEntityとして管理できること。

#### REQ-VENUE-002 — Venue Detail
Venue Detailページで最低限、会場名、住所、地域、説明、Webサイト、関連イベントを表示できること。

#### REQ-VENUE-003 — Venue Relation
EventとVenueの関連は、会場名文字列ではなくVenue Entityとの参照で表現すること。

#### REQ-VENUE-004 — Venue Map Data
将来的な地図表示に利用できる位置情報を保持可能であること。

#### REQ-VENUE-005 — Venue Edit Ownership
Venueレコードは、それを作成したOrganizationのみが編集できること。他のOrganizationは閲覧・イベントへの参照（既存Venueの選択）のみ可能とする。Administratorは重複・誤情報の修正のため、すべてのVenueレコードを編集できる。

### 5.5 Organizations

#### REQ-ORG-001 — Organization Entity
主催団体・カンパニー・制作団体等をOrganizationとして管理できること。

#### REQ-ORG-002 — Organization Members
1つのOrganizationに複数のユーザーが所属できること。

#### REQ-ORG-003 — Multiple Organizations
1ユーザーが複数のOrganizationに所属できること。

#### REQ-ORG-004 — Membership Roles
Organization内で最低限 Owner / Admin / Editor の権限を表現できること。

#### REQ-ORG-005 — Organization Approval
新規Organizationは作成直後は非公開状態（Pending）とし、Administratorによる事前承認を経てはじめて公開・Event公開が可能な状態（Approved）になること。承認前のOrganizationはDraft Eventの作成は許可してよいが、Eventの公開（REQ-PUBLISH-004）は行えない。

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
Draft Eventを公開できること。ただし、所属OrganizationがAdministratorによる承認（REQ-ORG-005、status = Approved）を受けている場合に限る。

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
- 初期対象地域は関東・関西の2エリアに限定する
- MVPでは日本語を主要言語とする。英語対応はMVP完了後に行う（Event / Artist / Venue / Organizationのデータモデルには英語フィールドをあらかじめnullableで用意しておく）
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

## 9. Resolved Decisions

以下は検討済み・決定済みの事項。詳細な設計根拠はADRを参照する。

- 初期対象地域は関東・関西の2エリアに限定する（REQ-DISCOVERY-003）
- Workshop等はEvent Typeとして既存Eventモデルに統合し、Performanceとは別のEvent Type値として区別する（REQ-EVENT-004、変更なしのまま確定）
- ArtistとOrganizationは任意の1:1相互リンクを持てる。片方が存在しなくても成立可能とし、リンクの成立にはAdministrator承認を必須とする（REQ-ARTIST-007、ADR-0005）
- Venue / Artistの編集権限は作成したOrganizationのみに限定する。他Organizationは閲覧・参照のみ。Administratorは全レコードを編集可能（REQ-VENUE-005、REQ-ARTIST-006、ADR-0005）
- 新規Organizationの作成にはAdministratorによる事前承認を必須とする。承認までは非公開でDraft作業のみ可能（REQ-ORG-005、ADR-0006）
- 多言語対応はMVP完了後に英語から着手する。データモデルには英語フィールドをあらかじめ用意しておく（Product Constraints）
- 既存データの取り込みはMVPでは主催者によるセルフサーブ入力のみとし、CSV一括インポートはPost-MVPのShould Have候補とする。スクレイピングやAIによる自動抽出はMVP・Should Haveでは行わない（`docs/product/scope.md` 参照）

## 10. Open Questions

- Open Call / Residency募集をEventとして扱うか
- Artist同士のCompany / Collective membership構造化（MVP対象外はscope.mdで確定済みだが、データモデル上の下準備要否は未検討）
- Event公開時に個別のAdministrator承認を必要とするか（Organization単位の事前承認とは別軸の論点）
- Festivalが子Eventを持つか、単なるEvent Typeとして扱うか

これらは推測で実装せず、決定後にRequirementsまたはADRへ反映する。