# DANCE HUB — Data Model

**Status:** Draft  
**Version:** 0.1  
**Last Updated:** 2026-08-21

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

Event is the core time-based activity entity. Performance is an Event Type, not the root entity.

An Event may have multiple schedules and multiple credited Artists.

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

## Open design questions

- Whether Artist membership (Company / Collective) should be modeled in MVP or post-MVP.
- Whether festivals contain child Events or are simply an Event Type in MVP.
- Whether individual Event publication requires per-event Administrator approval, separate from Organization-level approval.

Resolved: Organization/Artist representation link (see "Organization Artist Link" above, ADR-0005). Resolved: region normalization (see "Region" above).