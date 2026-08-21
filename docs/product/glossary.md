# DANCE HUB — Glossary

**Status:** Draft  
**Version:** 0.1  
**Last Updated:** 2026-08-21

本書はDANCE HUBで使用するDomain用語を定義する。コード、Database、Issue、Documentationでは原則として本書の用語を使用する。

## Event
DANCE HUBに掲載される、日時を伴う活動。Performance / Workshop / Talk / Audition / Open Studio / Festival等を含む。Eventは1つ以上のScheduleを持つことができ、終了後もデータは保持される。

## Performance
Event Typeの一種。舞台上演・作品上演等を指す。すべてのEventがPerformanceとは限らない。

## Event Type
Eventの種類。初期候補は Performance / Workshop / Talk / Audition / Open Studio / Festival / Other。

## Schedule
Eventが実際に行われる1つの日時。1 Eventは複数Scheduleを持つことができる。

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
すべてのScheduleが過去となったEvent。これはEvent Statusそのものではない。

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
- Archive ≠ Event copy
- Requirement ≠ Acceptance Criteria
