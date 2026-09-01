# DANCE HUB — Glossary

**Status:** Draft  
**Version:** 0.1  
**Last Updated:** 2026-08-28

本書はDANCE HUBで使用するDomain用語を定義する。コード、Database、Issue、Documentationでは原則として本書の用語を使用する。

## Event
DANCE HUBに掲載される活動。上演や参加型プログラムに加え、オーディション・公募・レジデンスといった募集も含む。Eventは複数のScheduleを持つことができ、終了後もデータは保持される。

応募型のEvent（Event Type Groupが `apply`）はScheduleを持たないことがあり、その場合の時間軸はApplication Deadlineが担う。

## Performance
Event Typeの一種。舞台上演・作品上演等を指す。すべてのEventがPerformanceとは限らない。

## Event Type
Eventの種類。必須であり、1 Eventにつき1つのみ設定する。値は以下の9種。

`performance` / `open_studio` / `talk` / `workshop` / `audition` / `open_call` / `residency` / `festival` / `other`

## Event Type Group
Event Typeを用途別にまとめた区分。`watch`（観る） / `participate`（参加する） / `apply`（応募する） / `container`（まとめる） / `other`。

GroupはDBに保持せず、Event Type → Groupのマッピングをアプリケーション層で管理する（Regionにおける`region_group`と同じ方針）。Groupは絞り込みの単位であると同時に、Eventの主要な日付がScheduleかApplication Deadlineかを分ける境界でもある。

## Open Call
Event Typeの一種。作品・企画・プログラム参加者の公募。AuditionおよびResidencyとともに `apply` グループに属する。

## Residency
Event Typeの一種。滞在制作（Artist in Residence）の募集を指す。DANCE HUB上のEventは募集そのものであり、滞在の実施記録ではない。

## Festival
Event Typeの一種であり、複数の子Eventを束ねる会期を表す。他の8つのEvent Typeが「何が行われるか」を表すのに対し、Festivalは「束ねるものである」という構造上の役割を表す。

Festivalは独立したEntityではなくEventである。詳細はADR-0009を参照。

## Child Event
Festivalに属するEvent。親Eventを`festival`に限り、入れ子は1段まで。MVPでは親子の所有Organizationは同一とする。

Calendarと日付による絞り込みの対象になるのは子Eventであり、Festival自身ではない。

## Schedule
Eventが実際に行われる1つの日時。1 Eventは複数Scheduleを持つことができる。応募型Eventでは0件を許容する。

## Application Deadline
応募型Event（Event Type Groupが `apply`）における応募受付の期限。

Scheduleが「開催日時」を表すのに対し、Application Deadlineは「応募を締め切る日時」を表す。両者は別概念であり、Application DeadlineはCalendarの対象に含めない。

**Schedule ≠ Application Deadline**

## Artist
ダンス・パフォーマンス領域における創作・表現主体を表すDomain Entity。

Artistには以下を含む。
- Individual
- Dance Company
- Collective
- Other creative / performing entity

ArtistがDANCE HUBのUser Accountを持つ必要はない。

**Artist ≠ User**

また、CompanyやCollectiveが運営主体でもある場合でも、ArtistとOrganizationは別Entityとして扱う。

**Artist ≠ Organization**

同じ実世界の団体が両方のEntityとして存在することを許容する。

## Artist Type
Artistの主体種別。初期候補は Individual / Company / Collective / Other。

## User
DANCE HUBへログインするAccount主体。認証システム上のユーザー。UserがArtistであるとは限らず、ArtistがUserであるとも限らない。

## Profile
Userに関連する公開・アプリケーション用プロフィール情報。認証情報とは分離する。

## Organization
Eventを主催・制作・運営し、DANCE HUB上で情報を管理する運営主体を表すDomain Entity。Dance CompanyやCollectiveがOrganizationとして存在する場合もあるが、その創作主体としてのArtist表現とは分離する。

## Organizer
Eventを主催・登録・管理する主体を説明する一般用語。Database上では可能な限りOrganizationまたはそのMemberとして表現する。

**Organizer ≠ Organization**

Organizerは役割・概念を表す語であり、OrganizationはDomain Entityである。

## Organization Member
UserとOrganizationの所属関係。MembershipはOwner / Admin / Editor等のRoleを持つ。

## Venue
Eventが実施される場所を表すDomain Entity。Theatre / Studio / Gallery / Alternative space / Outdoor location等を含む。Eventとの関係は名称文字列ではなくEntity relationで表現する。

## Credit
EventにおけるArtistの役割。Choreography / Performance / Direction / Music / Lighting / Costume / Dramaturgy等。自由記述を許容する。

## Event Artist
EventとArtistの多対多Relation。Event / Artist / Credit or Role / Display order等を保持する。

## Ticket Type
Eventの料金区分。General / Student / U25 / Advance / Door等。金額と通貨を可能な限り構造化して保持する。

## Media
Event、Artist、Venue等に関連付けられるメディア情報。Main visual / Flyer / Production photo / Profile image / Video thumbnail等。

## Draft
まだ一般公開されていない編集状態。

## Published
一般利用者が閲覧できる公開状態。公開日時とEvent開催日時は別概念である。

## Cancelled
中止されたEventの状態。Cancelled Eventを削除することとは異なり、原則として情報を保持する。

## Past Event
終了したとみなされるEvent。判定条件はEvent Type Groupによって異なる。

- `apply` グループ: Application Deadlineを経過したEvent
- それ以外のグループ: すべてのScheduleが過去となったEvent

いずれもEvent Statusそのものではなく、そこから派生する概念である。

## Archive
終了したEventおよび関連情報を長期的に保持・探索する機能・データ集合。Archiveは独立したEventコピーを意味しない。

## Region
EventまたはVenueを地理的に絞り込むための区分。具体的な区分方法は未確定。

## Search
ユーザーがEvent・Artist・Venue・Organization等を文字列から探索する機能。

## Discovery
Calendar、Filter、Search、Artist/Venue traversalなどを含む、ユーザーが未知のEventを見つける行為全体。

## Authentication
「誰であるか」を確認する処理。Login / Session等。

## Authorization
認証されたUserが「何をしてよいか」を判断する処理。

**Authentication ≠ Authorization**

## RLS
Row Level Security。Databaseの行単位でアクセス権限を制御する仕組み。具体的採用技術はArchitecture Decisionに従う。

## Requirement
プロダクトが満たすべき条件。REQ-EVENT-001等のRequirement IDを持つ。

## Acceptance Criteria
IssueまたはTaskが完了したと判断するための具体的条件。Requirementより実装Taskに近い粒度で記述する。

## ADR
Architecture Decision Record。重要な技術・設計判断についてContext / Decision / Alternatives / Consequencesを記録する文書。

## Source of Truth
特定の仕様・判断について最終的に参照すべき文書またはデータ。同じ仕様を複数文書へ重複記載することを可能な限り避ける。

## Important Distinctions

- User ≠ Artist
- Artist ≠ Organization
- Organizer ≠ Organization
- Event ≠ Performance
- Event ≠ Schedule
- Authentication ≠ Authorization
- Past Event ≠ Cancelled Event
- Schedule ≠ Application Deadline
- Festival ≠ Child Event
- Archive ≠ Event copy
- Requirement ≠ Acceptance Criteria
