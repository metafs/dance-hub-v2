# M4 — Event draft and review workflow

**Status:** Complete

**Understood as:** Event content is editable only while draft or changes-requested, submitted and reviewed through trusted database transitions, and an approved revision becomes the sole public pointer while prior approved content remains visible during a later review.

Editors, Admins, and Owners may edit and submit an Event Revision. Only an Owner or Admin may request cancellation; only a Platform Admin may request changes or approve publication and cancellation. A cancellation leaves the published Revision public with its cancellation reason and prevents further Revision creation.

## Requirements

- REQ-EVENT-005 through REQ-EVENT-008
- REQ-ARTIST-002
- REQ-AUTH-001
- REQ-AUDIT-001

## Acceptance criteria

- Members create and edit drafts with schedules, canonical Artist credits, structured Ticket Offers, independent access links, external links, and one main-image record with alt text.
- Submission and review use the trusted Revision functions.
- Platform Admin can request changes or approve; a later approved Revision supersedes the published pointer atomically.
- Owner and Admin can request cancellation and Platform Admin can approve it.
- E2E covers the complete revision and cancellation journeys.

The current main-image record and publication validation establish the Revision data contract. Actual upload, private storage, and approved public delivery are tracked as the independent MVP blocker in `docs/plans/media-delivery.md`.
