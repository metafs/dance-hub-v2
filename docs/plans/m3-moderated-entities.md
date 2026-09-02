# M3 — Moderated Artist and Venue data

**Status:** Complete

**Understood as:** A Member can search canonical Artist and Venue data, submit and edit only their Organization's pending candidates, and a Platform Admin can activate, reject, or merge them without exposing pending data to another Organization.

## Requirements

- REQ-ARTIST-001
- REQ-ARTIST-003
- REQ-VENUE-001
- REQ-ORG-001
- REQ-AUTH-001
- REQ-AUDIT-001

The canonical lifecycle, merge behavior, audit fields, and Role matrix are defined in `docs/product/requirements.md`, `docs/architecture/data-model.md`, and `docs/architecture/auth.md`.

## Acceptance criteria

- Organization Members can create Artist and Venue Candidates from their Workspace.
- Pending Candidates are visible only to their creator Organization and Platform Admin.
- Canonical Artist and Venue search is available before a Candidate is created.
- Platform Admin can activate, reject, or merge a pending Candidate through trusted database transitions.
- Members can submit canonical change requests; direct canonical mutation remains unavailable.
- An E2E journey verifies activation makes a Candidate selectable as canonical data and rejects another Organization's pending-data access.
