# DANCE HUB — Architecture Overview

**Status:** Draft
**Version:** 0.3
**Last Updated:** 2026-09-03

## Purpose

This document is the high-level map of DANCE HUB. Detailed decisions live in `docs/adr/`; product behavior lives in `docs/product/requirements.md`.

## Principles

- Model domain entities and relationships explicitly; do not use duplicated text as a relation.
- Separate public approved-revision reads from authenticated, Organization-scoped writes.
- Enforce authorization below the UI layer and record moderation decisions.
- Keep schema changes migration-driven and public pages server-rendered and indexable.
- Prefer a simple system over premature service decomposition.

## Runtime

```text
Browser -> Cloudflare -> Next.js -> Supabase (PostgreSQL, Auth)
                         |
                         +-> Cloudflare R2 / Images for media
```

Next.js, Supabase, and Cloudflare are accepted decisions (ADR-0001 through ADR-0003).

## Core domain

An Event is stable identity. Event Revision contains mutable content; only the Event's approved `published_revision_id` is public. Revisions own Schedules, Artist credits, ticket offers, ticket/registration links, external links, and media. A Ticket Offer describes pricing independently from the external Ticket Link used to sell or register. A Schedule references a Venue; a Venue references the Tokyo or Kanagawa Prefecture in the MVP.

Organization Members create and submit work. Platform Admin is a separate role that approves Organization Applications, shared Artist / Venue Candidates, Event Revisions, and cancellations. Artist and Organization stay distinct; Artist / Venue are shared canonical records after moderation.

## Application structure

Application code follows [ADR-0013](docs/adr/0013-use-feature-modules-for-application-domains.md). `src/app` contains App Router composition and routing; implemented domain behavior lives in `src/features/<domain>/`. The initial feature modules are auth, discovery, organizations, events, revisions, shared-entities, media, and moderation. A feature uses only the schema, query, command, policy, and component layers that its existing behavior requires. `src/lib` remains shared infrastructure and cross-domain primitives, while `src/ui` is limited to domain-agnostic presentation.

## Source documents

- Product requirements: `docs/product/requirements.md`
- Product scope: `docs/product/scope.md`
- Domain model: `docs/architecture/data-model.md`
- Authorization: `docs/architecture/auth.md`
- ADR index: `docs/adr/README.md`
- Implementation roadmap: `docs/plans/mvp-implementation-roadmap.md`
