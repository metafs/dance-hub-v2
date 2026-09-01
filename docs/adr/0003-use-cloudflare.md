# ADR-0003: Use Cloudflare for application delivery and media

**Status:** Accepted
**Accepted:** 2026-09-01

## Context

DANCE HUB will be public-content and media heavy. The project also wants an infrastructure setup that remains cost-conscious and works well for distributed content delivery.

## Decision

Use Cloudflare for:

- DNS / CDN
- Next.js runtime hosting on Workers where compatibility is acceptable
- R2 for media object storage
- Images for image transformation / delivery where useful

Keep PostgreSQL and authentication in Supabase.

## Alternatives considered

- Vercel + Supabase Storage
- Vercel + R2
- Cloudflare Pages / static-only deployment

## Consequences

- Next.js compatibility depends on the Cloudflare/OpenNext ecosystem rather than first-party Vercel runtime behavior.
- Media and database responsibilities remain separated.
- Cloudflare-specific services should only be added when the requirement justifies them.

## Revisit when

- Next.js compatibility creates significant friction.
- Vercel significantly reduces development complexity for required functionality.
- Media requirements change substantially.
