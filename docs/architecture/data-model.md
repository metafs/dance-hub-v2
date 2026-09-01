# DANCE HUB — Data Model

**Status:** Draft  
**Version:** 0.1  
**Last Updated:** 2026-08-28

## Core entities

```text
User
  |
  v
OrganizationMembership --> Organization --> Event --> EventSchedule
                                   |           |
                                   |           +--> EventArtist --> Artist
                                   |           +--> TicketType
                                   |           +--> EventMedia
                                   |
                                   +------------------------------+
                                                                  |
Event ----------------------------------------------------------> Venue
```

## Artist

Artist represents a creative or performing subject.

Initial types:
- Individual
- Company
- Collective
- Other

An Artist does not require a DANCE HUB User account.

A company or collective may also have a corresponding Organization used for operational ownership and publishing, but the two representations remain separate.

Potential later relation:

```text
Organization --optional representation link--> Artist
```

This relation is intentionally not required for the initial MVP.

Potential later Artist membership relation:

```text
Artist (Company / Collective)
  |
  +-- ArtistMembership --> Artist (member)
```

Membership history is not required for the initial MVP.

## Event

Event is the core activity entity. Performance is an Event Type, not the root entity.

An Event may have multiple schedules and multiple credited Artists. Recruitment listings (`apply` group, below) may have zero schedules.

## Event Type

```text
Event.type   enum(performance, open_studio, talk, workshop,
                  audition, open_call, residency, festival, other)   required
```

Event Typeは必須・単一値。複数指定は許容しない。

Event Type Groupはenumではなく、Event Type → Groupのマッピングをアプリケーション層で保持する。Venueの`prefecture` → `region_group`と同じ方針であり、Groupの見直しにスキーマ変更を不要にする。

```text
watch       = performance, open_studio, talk
participate = workshop
apply       = audition, open_call, residency
container   = festival
other       = other
```

Groupは絞り込みの単位であると同時に、Eventの主要な日付が何かを分ける境界でもある。詳細はADR-0008を参照。

## Application Deadline

```text
Event.application_deadline   timestamptz (nullable)
```

応募型Event（`apply` グループ）における応募締切。`apply` グループでは必須、それ以外のグループではnullとする。この制約はEvent Typeに依存するため単純なNOT NULLでは表現できず、アプリケーション層で強制する。

Scheduleとは別概念であり、Calendarおよび日付による絞り込みの対象に含めない。

過去判定（Past Event）はGroupによって分岐する。

```text
apply    -> application_deadline < now()
それ以外 -> すべてのEventSchedule < now()
```

## Festival Child Events

```text
Event.parent_event_id   Event (FK, nullable, self-reference)
```

Festivalは独立したEntityではなくEventであり、親子関係はEventの自己参照で表現する。中間テーブルは用いない（1子Eventが複数Festivalに属する要件は存在しない）。

制約:

```text
親は type = festival のみ
子の type は festival 以外
親自身は parent_event_id を持てない（入れ子は1段まで／循環防止）
親子の owner_organization_id は同一（MVP制約）
```

Discovery上は子EventがCalendar・日付絞り込みの対象となり、Festival自身はEvent一覧に1件として会期（子Eventの日程範囲）で現れる。詳細はADR-0009を参照。

## Region

```text
Venue.prefecture   enum (all 47 prefectures, for future extensibility)
```

`region_group`（KANTO / KANSAI）はDBのenumではなく、prefecture → region_groupのマッピングをアプリケーション層で保持する。MVPで対象とするのは関東・関西の2グループのみだが、`prefecture`自体はフルセットを許容し、対象地域を拡張する際にスキーマ変更を不要にする。

関東 = 東京都, 神奈川県, 埼玉県, 千葉県, 茨城県, 栃木県, 群馬県
関西 = 大阪府, 京都府, 兵庫県, 奈良県, 和歌山県, 滋賀県

## Entity Ownership (Venue / Artist)

```text
Venue.owner_organization_id    Organization (FK, required)
Artist.owner_organization_id   Organization (FK, required)
```

Venue / Artistは作成したOrganizationが編集権を持つ（owner）。他Organizationは参照・選択（Eventへの関連付け）のみ可能で、編集はできない。Administratorはowner_organization_idに関わらず全レコードを編集できる。詳細はADR-0005を参照。

## Organization Artist Link

```text
organization_artist_link
  organization_id   Organization (FK, unique)
  artist_id         Artist (FK, unique)
  status            enum(proposed, approved)
  requested_by      User
  approved_by       User (nullable, Administrator)
```

ArtistとOrganizationの相互representation linkは任意の1:1とし、行が存在しない場合は未リンクを意味する。Artistは通常User Accountを持たないため、リンクの成立にはAdministrator承認（status = approved）を必須とする。詳細はADR-0005を参照。

## Organization Approval

```text
Organization.status   enum(pending, approved, rejected)
```

新規Organizationはstatus = pendingで作成される。Draft Eventの作成はpending状態でも可能だが、Eventの公開はstatus = approvedのOrganizationに限る。詳細はADR-0006を参照。

## Venue

Venue is referenced by ID from Event. Venue names must not be used as the relational key.

## Organization

Organization is an operational / publishing entity. Users gain permissions through OrganizationMembership.

## Event Publication

Eventの公開は、所属Organizationが`approved`であれば即時に反映される。Event単位の承認状態はスキーマ上に存在せず、`Event.status`はDraft / Published / Cancelledの3値のままである。詳細はADR-0007を参照。

## Open design questions

- Whether Artist membership (Company / Collective) should be modeled in MVP or post-MVP.
- How to authorize Festival child Events owned by a different Organization than the parent (deferred to post-MVP by ADR-0009; the MVP schema constraint assumes same-Organization).
- Whether Administrator takedown of a published Event needs an explicit requirement, given that ADR-0007 makes publication immediate and moves quality control after the fact.

Resolved: Organization/Artist representation link (see "Organization Artist Link" above, ADR-0005). Resolved: region normalization (see "Region" above). Resolved: Event Type taxonomy and the `apply` group date semantics (see "Event Type" / "Application Deadline" above, ADR-0008). Resolved: Festival child Events (see "Festival Child Events" above, ADR-0009). Resolved: per-event publication approval (see "Event Publication" above, ADR-0007).