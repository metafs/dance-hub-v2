# ADR-0005: Moderate shared Artist and Venue records through candidates

**Status:** Accepted
**Accepted:** 2026-09-01

## Context

Artist and Venue are shared reference entities. Multiple Organizations may need the same real-world record, so assigning permanent editing ownership to the Organization that first creates a record produces duplicate records and blocks corrections by other legitimate users.

## Decision

- An Organization member may create an Artist or Venue candidate while editing an Event.
- A candidate is visible to all authorized members of its creating Organization and Platform Administrators, but not to public readers or other Organizations.
- Candidates use `pending`, `activated`, `rejected`, and `merged` states. The creating Organization may edit only `pending`; Platform Administrators may correct a pending submission and then activate, reject, or merge it with a canonical record.
- A merge retains the canonical survivor ID, rewrites candidate references to that ID, and preserves a merge audit record. Rejected and merged candidates are read-only to the creating Organization.
- Once active, a shared canonical record changes through a reviewed change request: any authorized Organization member may submit it, and a Platform Administrator approves, rejects, or directly corrects it with an audit reason.
- Record provenance may identify the creating Organization, but it is not a permanent ownership or authorization boundary.
- An explicit Organization-Artist representation link is deferred. It remains optional and requires a future dedicated decision before implementation.

## Alternatives considered

- Give permanent editing ownership to the first creating Organization.
- Allow all Organizations to edit shared records directly.
- Reserve all record creation for Platform Administrators.

## Consequences

- Event review includes referenced pending Artist and Venue candidates.
- Moderation screens must support candidate review, correction, and duplicate merging.
- Organizer-facing forms can remain efficient without allowing cross-Organization overwrites.

## Revisit when

- Artist self-claim or representation workflows enter MVP scope.
- Candidate review volume makes platform moderation a bottleneck.
