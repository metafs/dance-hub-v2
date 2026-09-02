# DANCE HUB — Product Requirements

**Status:** Draft
**Version:** 0.3
**Last Updated:** 2026-09-02

## 1. Product Definition

DANCE HUB は、ダンス・パフォーマンスの Event、Artist、Venue、Organization を構造化して蓄積し、現在の発見と将来のアーカイブ利用を両立する情報プラットフォームである。

## 2. Product Goals

- **G-001 — Discovery:** 日付・地域・種別・テキストから Event を発見できる。
- **G-002 — Structured information:** Event、Artist、Venue、Organization、Schedule の関係を ID で表現する。
- **G-003 — Moderated publishing:** 主催者が情報を下書き・申請し、Platform Admin の承認後に公開する。
- **G-004 — Archive:** 終了・中止した Event も公開情報として保持する。
- **G-005 — Extensibility:** 検索、統計、研究利用へ拡張できるデータ構造を保つ。

## 3. Users

| User | Primary goals |
| --- | --- |
| Visitor | Event を探し、詳細、Artist、Venue、外部チケット・申込先を確認する。 |
| Organizer | Organization の Event Revision を作成、編集、審査へ提出する。 |
| Platform Admin | Organization Application、共有 Entity Candidate、Event Revision を審査し、データ品質を保つ。 |

## 4. Functional Requirements

### 4.1 Events and revisions

#### REQ-EVENT-001 — Public list

公開済みの最新承認 Revision を持つ Event を一覧表示できること。Cancelled Event は一覧・詳細から除外せず、明示的な中止表示をすること。

#### REQ-EVENT-002 — Event detail

Event は安定した identity とし、公開詳細は `published_revision_id` が指す承認済み Event Revision から表示する。詳細には、タイトル、説明、種別、日程、会場、Artist credit、主催 Organization、Ticket Offer、外部チケット・申込先、main image を含められること。

#### REQ-EVENT-003 — Schedules and venues

Event Revision は複数の Schedule を持てること。各物理 Schedule は Venue を必ず参照し、開始・終了日時は `Asia/Tokyo` のローカル時刻として入力・表示・絞り込みを行う。

`apply` グループの Event は Schedule を 0 件にでき、その場合は応募締切を必須とする。`festival` は子 Event の Schedule から会期を導出する。日付のみ・終日 Schedule は東京の暦日境界を使う。

#### REQ-EVENT-004 — Event type

Event Type は必須、1 Event につき 1 つとする。

| value | Group | ラベル |
| --- | --- | --- |
| `performance` | `watch` | 公演 |
| `open_studio` | `watch` | オープンスタジオ |
| `talk` | `watch` | トーク |
| `workshop` | `participate` | ワークショップ |
| `audition` | `apply` | オーディション |
| `open_call` | `apply` | 公募 |
| `residency` | `apply` | レジデンス |
| `festival` | `container` | フェスティバル |
| `other` | `other` | その他 |

Group はアプリケーション層の mapping とする。詳細は ADR-0008 を参照。

#### REQ-EVENT-005 — Revision workflow

Event Revision は `draft`、`in_review`、`changes_requested`、`approved`、`superseded` を持つこと。Owner / Admin / Editor が draft を作成・編集・提出し、Platform Admin が承認または差戻しする。提出要件は承認時に再検証し、満たさない Revision は差戻す。承認時に `published_revision_id` を原子的に更新し、旧 Revision は保持する。

#### REQ-EVENT-006 — Event relationships

Revision 内で外部 URL、Ticket Offer、Ticket / 申込 Link、Artist credit、Media、Festival 親 Event を編集できること。Ticket Offerは料金、Ticket Linkは外部販売・申込先を表し、相互に独立する。公開時のTicket / 参加情報は、1件以上のTicket Offer、1件以上の有効な外部Ticket / 申込Link、または `no_registration_required` のいずれかを必須とする。Artist credit は role（または uncredited 値）付きの canonical Artist を参照する。Festival は同一 Organization の非 Festival 子 Event のみを 1 段で持てること。親子関係の変更は子 Revision の承認時に反映する。

Ticket Offerは `fixed`、`free`、`range`、`donation`、`pay_what_you_can`、`sliding_scale`、`dynamic`、`included` のいずれかを持つ。通貨はISO 4217形式の大文字3文字コードとし、金額は最小通貨単位の整数で保存する。前売、当日、学生、U25等はenum化せず `label` とする。`range` は上下限のある価格そのもの、`sliding_scale` は観客が自身の状況等に応じて選択する複数の価格水準であり、各水準を個別のTicket Offerとして表現する。Ticket OfferをScheduleまたはTicket Linkへ関連付けない。

#### REQ-EVENT-007 — Archive and cancellation

過去・Cancelled Event を自動削除しないこと。過去判定は `apply` が応募締切経過、通常 Event が全 Schedule 終了、Festival が子 Event の Schedule 範囲終了とする。Cancelled Event は公開を継続し、`cancelled_at` と中止理由を表示する。

#### REQ-EVENT-008 — Publication validation

Draft 保存時は、作成者が所属する Organization とタイトルを必須とする。審査提出時は、タイトル、説明、Event Type、alt text 付き main image、少なくとも 1 件の Artist credit、Ticket Offer・Ticket / 申込 Link・`no_registration_required` のいずれかを必須とする。さらに、`apply` は応募締切、通常の非 Festival Event は Venue 付き Schedule、Festival は公開前に Venue 付き Schedule を持つ承認済み子 Event を必須とする。

### 4.2 Discovery

#### REQ-DISCOVERY-001 — Calendar and dates

Calendar と日付範囲絞り込みは Schedule の開催日を対象とし、応募締切は対象に含めない。Festival は Event 一覧で子 Event の日程範囲を表示し、Calendar には子 Event を表示する。

#### REQ-DISCOVERY-002 — Geography

MVP の対象 Prefecture は東京都・神奈川県のみとする。公開 Schedule はいずれかの Venue を必須とし、地域は Venue の Prefecture から Schedule ごとに導出して Event に地域文字列を複製しない。両 Prefecture に Schedule を持つ Event は各 filter に 1 回ずつ現れ、Schedule 0 件の `apply` Event は地域結果に現れない。

#### REQ-DISCOVERY-003 — Filters and search

地域、Event Type、日付で絞り込み、Event 名、Artist 名、Venue 名、Organization 名を検索できること。応募型 Event は応募締切順の専用一覧を提供する。

### 4.3 Shared entities

#### REQ-ARTIST-001 — Artist

Artist は Individual / Company / Collective / Other を含む独立 Entity とし、アカウントの有無を問わない。公開詳細には名前、プロフィール、Web サイト、関連 Event を表示できること。

#### REQ-ARTIST-002 — Credits

Event Revision は複数 Artist を credit と役割付きで関連付けられること。

#### REQ-ARTIST-003 — Candidate moderation

Organization Member は Artist / Venue Candidate を作成できること。Candidate は作成 Organization の authorized member と Platform Admin のみが閲覧でき、`pending` 中だけ作成 Organization が編集できる。Platform Admin の correction、activation、rejection、merge 後に canonical Entity となる。merge は survivor ID へ参照を移し監査記録を残す。公開済み Entity の変更は Member が申請し Platform Admin が判断する change request とする。

#### REQ-VENUE-001 — Venue

Venue は名称、構造化住所、Prefecture、説明、Web サイト、将来の地図用座標を持つ独立 Entity とする。Event との関係は Schedule から Venue ID を参照して表現する。

### 4.4 Organizations and authorization

#### REQ-ORG-001 — Membership

Organization は複数 Member を持ち、User は複数 Organization に所属できること。最低限の権限は以下とする。

| Action | Owner | Admin | Editor | Platform Admin |
| --- | --- | --- | --- | --- |
| Organizationプロフィール編集 | Yes | Yes | No | No |
| Member・Role管理 | Yes | No | No | No |
| Event Revision の編集・提出 | Yes | Yes | Yes | No |
| 中止申請 | Yes | Yes | No | Yes (review) |
| Artist / Venue Candidate 作成 | Yes | Yes | Yes | Yes (review) |
| 審査・公開承認 | No | No | No | Yes |

Owner は常に最低 1 人残ること。Platform Admin は Organization Membership と別のプラットフォーム権限である。

#### REQ-ORG-002 — Organization application

認証済み User が Organization Application を提出し、Platform Admin が承認する。承認時に Organization と初期 Owner Membership を 1 transaction で作成する。却下時には Organization を作成しない。未承認 Application は Event を作成・公開する権限を与えない。

### 4.5 Authentication, media, and audit

#### REQ-AUTH-001 — Access control

Organizer 機能は認証を要求し、Organization の書込みと Candidate の閲覧を server-side authorization と Row Level Security の両方で制限する。Visitor は公開 Revision のみをログインなしで読めること。

#### REQ-MEDIA-001 — Main image

MVP の編集 UI は Event Revision ごとに main image を 1 枚だけ扱い、必須の alt text を保存する。スキーマは将来の複数 Media を許容する。

#### REQ-AUDIT-001 — Audit trail

Organization Application、Candidate、Event Revision の提出、差戻し、承認、merge、中止について、actor、時刻、判断理由を監査可能にする。

## 5. Constraints

- MVP の公開対象は東京都・神奈川県の Venue を持つ Event とする。
- 日時、日付境界、Calendar の表示・絞り込みは `Asia/Tokyo` を標準とする。
- 公開中の Event 内容は承認済み Revision からのみ提供する。
- Artist と Organization は別 Entity とし、両者の代表関係は MVP では扱わない。

## 6. Open Questions

- オンライン専用 Event をどのように地理検索と両立させるか。
- 市区町村・独自エリアを導入する時点と migration 方針。
- Artist Claim と Company / Collective membership を導入する条件。
