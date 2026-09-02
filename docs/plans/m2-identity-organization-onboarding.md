# M2 — Identity and Organization Onboarding

**Status:** Active

**Understood as:** M2 is complete only when a cookie-backed Supabase session, Organization application and review UI, Organization workspace selection, and server-side role checks form one tested end-to-end journey.

## Goal

Enable an organizer and a Platform Admin to safely complete Organization onboarding and enter an authorized workspace.

## Requirement IDs

- REQ-ORG-001
- REQ-ORG-002
- REQ-AUTH-001
- REQ-AUDIT-001

## Acceptance Criteria

- A user can sign in and sign out with an SSR-safe cookie session.
- An authenticated user without a Membership can submit and view an Organization Application.
- Only a Platform Admin can view the review queue and approve or reject an Application.
- Approval creates the Organization and initial Owner atomically through the trusted database transition.
- A Member can select only their Organizations and enter the selected workspace.
- Server-side authorization distinguishes Owner, Admin, Editor, and Platform Admin capabilities.
- Unauthenticated, unapproved, other-Organization, and insufficient-role access is rejected.
- An E2E journey covers application, approval, initial Owner login, and workspace display.

## Implementation Steps

1. Add Supabase SSR clients and session refresh proxy.
2. Add login, logout, and protected-route authorization helpers.
3. Add Organization Application and Platform Admin review flows.
4. Add Organization selector and role-aware workspace.
5. Add deterministic local Auth fixtures and E2E coverage.
6. Run fast, production-build, database, and E2E validation.

## Security / Authorization

- Browser code receives only the public Supabase key.
- Server Actions validate the authenticated user before each mutation.
- RLS and trusted database functions remain the mutation boundary.
- Workspace routes verify Membership against the requested Organization ID.
- Platform Admin is checked separately from Organization Membership.

## Completion Criteria

`pnpm verify`, database verification, and the critical M2 Playwright journey pass in CI.
