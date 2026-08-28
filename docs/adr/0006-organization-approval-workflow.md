# ADR-0006: Require Administrator pre-approval for new Organizations

**Status:** Proposed

## Context

`docs/product/requirements.md` Open Questions left the Organization creation/approval flow undecided. Organization is the publishing entity for Events (`Event.owner` is effectively an approved Organization via membership), so an unapproved or malicious Organization gaining publish rights carries direct public-facing risk (spam, impersonation of a real dance company, low-quality listings damaging trust in the platform).

## Decision

- A newly created Organization is assigned `status = pending`.
- A `pending` Organization is not publicly visible and cannot publish Events (`REQ-PUBLISH-004`), but its members may still create and edit Draft Events, so work is not blocked while awaiting review.
- Administrator reviews and sets `status = approved` (or `rejected`) before the Organization can publish.
- This approval gate is independent from, and a precondition for, the Organization-Artist link approval described in ADR-0005 — an unapproved Organization cannot propose a representation link.

## Alternatives considered

- Immediate self-service creation with post-hoc Administrator audit: rejected for MVP because it allows a brief but real window where unreviewed Organizations could publish public-facing content; revisit if the approval queue becomes an onboarding bottleneck.
- Approval required only at first Event publish (Organization itself created instantly): rejected because it still allows an unreviewed Organization to exist and be referenced (e.g., in an Organization-Artist link proposal) before any human review has occurred.

## Consequences

- Administrator needs a review queue / UI surface for `pending` Organizations (even a minimal one for MVP).
- Legitimate Organizers experience a delay between signup and first publish, which should be communicated clearly in the product UI to avoid confusion ("your organization is awaiting approval").
- The approval step becomes a single choke point; if Administrator review capacity does not scale with signups, this becomes an onboarding bottleneck (see Revisit when).

## Revisit when

- Organization signup volume makes manual Administrator review a bottleneck.
- A verified-identity or invite-based onboarding path becomes available, which could allow trusted Organizations to skip manual review.