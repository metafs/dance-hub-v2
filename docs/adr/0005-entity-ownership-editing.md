# ADR-0005: Ownership-based editing for Venue and Artist, with an optional approved Organization-Artist link

**Status:** Proposed

## Context

Venue and Artist are shared reference entities: many different Organizations will want to relate their Events to the same real-world venue or the same real-world artist. The repository needed a decision on who may create and edit these records (`docs/product/requirements.md` Open Questions: "Venue情報を誰が作成・編集できるか", "Artist情報を誰が作成・編集できるか"), and on how the previously proposed optional Organization ↔ Artist representation link (`docs/architecture/data-model.md`) should be authorized.

Artist does not require a User account (Artist ≠ User, per the glossary), so an Artist record generally has no owner who can consent to being linked or corrected.

## Decision

- Venue and Artist each carry an `owner_organization_id`, set to the Organization that created the record.
- Only members (Editor role or above) of the owning Organization may edit that Venue or Artist record. Other Organizations may reference (select) the record when creating an Event, but cannot edit it.
- Administrator can edit any Venue or Artist record regardless of `owner_organization_id`, to correct duplicates or incorrect information, consistent with the Administrator's defined product role.
- The optional Organization ↔ Artist representation link (`organization_artist_link`) requires Administrator approval (`status = approved`) before it takes effect. A proposed-but-unapproved link has no authorization effect.
- The link remains optional on both sides: an Artist or Organization with no linked counterpart is valid and expected.

## Alternatives considered

- Fully open shared-pool editing (any Organization member can edit any Venue/Artist): rejected, since it allows uncoordinated overwrites of shared reference data with no ownership accountability.
- Administrator-only editing for all Venue/Artist records: rejected as an unnecessary bottleneck for MVP given expected volume, and inconsistent with letting Organizers register the venues/artists they work with directly.
- Wiki-style open creation with Administrator-moderated changes: deferred; higher moderation overhead than needed for MVP, could be reconsidered post-MVP if duplicate/quality issues from the ownership model become significant.
- Allowing self-service (unapproved) Organization-Artist linking: rejected due to impersonation / misrepresentation risk, since Artist records typically have no account holder able to contest an incorrect claim.

## Consequences

- Duplicate Venue/Artist records across Organizations are possible (e.g., two Organizations independently registering the same theatre). Resolving duplicates is an Administrator responsibility, not an automated process, for MVP.
- Organizations that need a correction to a Venue/Artist they do not own must go through Administrator intervention rather than editing directly.
- The Organization-Artist link table needs an approval workflow surface for Administrators (queue of `status = proposed` rows).

## Revisit when

- Duplicate Venue/Artist records become a frequent, high-friction problem for Organizers in practice.
- Artist self-claim / profile ownership (currently out of MVP scope) is introduced, which would change who can consent to a representation link.