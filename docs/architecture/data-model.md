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

## Venue

Venue is referenced by ID from Event. Venue names must not be used as the relational key.

## Organization

Organization is an operational / publishing entity. Users gain permissions through OrganizationMembership.

## Open design questions

- Whether Organization should have an optional explicit `artist_id` representation link.
- Whether Artist membership should be modeled in MVP or post-MVP.
- How region / geography should be normalized.
- Whether festivals contain child Events or are simply an Event Type in MVP.
