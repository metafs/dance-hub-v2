# ADR-0006: Create Organizations through approved applications

**Status:** Accepted
**Accepted:** 2026-09-01

## Context

Organization is the operational entity that owns Event drafts and publishing work. The service needs to prevent unreviewed Organizations from acquiring publishing authority while avoiding Organizations with no accountable Owner.

## Decision

- An authenticated User submits an Organization Application instead of creating a live Organization directly.
- A Platform Administrator reviews the application for legitimacy and duplication.
- Approval creates the Organization and the applicant's initial Owner membership in one transaction.
- Rejection records the decision without creating an Organization.
- The MVP does not provide an emergency or self-service bypass for this approval path.

## Alternatives considered

- Create a pending Organization immediately and approve it later.
- Allow unrestricted self-service Organization creation.
- Make Organization creation invitation-only.

## Consequences

- An applicant cannot create Event drafts until the Organization is approved and created.
- Approval operations require an auditable trusted server path.
- The initial Owner invariant is guaranteed at creation time.

## Revisit when

- Review volume requires verified or invitation-based fast paths.
- Organization onboarding needs to preserve drafts before approval.
