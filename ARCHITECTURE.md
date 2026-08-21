# DANCE HUB — Architecture Overview

**Status:** Draft  
**Version:** 0.1  
**Last Updated:** 2026-08-21

## 1. Purpose

This document is the high-level map of the DANCE HUB system. Detailed decisions belong in `docs/architecture/` and `docs/adr/`.

## 2. Architectural principles

- Domain entities are modeled explicitly rather than embedded as duplicated text.
- Public read paths and organizer write paths are separated conceptually.
- Authorization must be enforced below the UI layer.
- Database schema changes are migration-driven and reproducible.
- Public content should remain indexable and suitable for server rendering.
- The system should remain simple enough for reliable Codex / Claude Code operation.
- Premature service decomposition is avoided.

## 3. Provisional runtime architecture

```text
Browser
   |
   v
Cloudflare
   |
   v
Next.js
   |
   +-- Server Components
   +-- Server Actions / Route Handlers
   |
   v
Supabase
   +-- PostgreSQL
   +-- Auth

Cloudflare R2
   +-- Event / Artist / Venue media
```

The Cloudflare hosting and media choices are provisional until the related ADRs are accepted.

## 4. Core domain

Primary domain entities:

- User
- Artist
- Organization
- Event
- Venue

Supporting entities include schedules, organization memberships, event credits, ticket types, and media.

`Artist` includes individuals, dance companies, collectives, and other creative / performing entities.

`Artist` and `Organization` remain separate concepts. The same real-world group may have both an Artist representation (creative subject) and an Organization representation (operational / publishing subject).

## 5. Source documents

- Product requirements: `docs/product/requirements.md`
- Domain model: `docs/architecture/data-model.md`
- Authorization: `docs/architecture/auth.md`
- Security: `docs/architecture/security.md`
- Deployment: `docs/architecture/deployment.md`
- Testing: `docs/architecture/testing.md`
