# ADR-0001: Use Next.js for the application framework

**Status:** Proposed

## Context

DANCE HUB requires public SEO-friendly pages, organizer application flows, server-side data access, and a single TypeScript-oriented development environment suitable for Codex and Claude Code.

## Decision

Use Next.js 16 with the App Router as the primary application framework.

## Alternatives considered

- Separate SPA frontend + API backend
- Remix / React Router framework mode
- Astro with separate application backend

## Consequences

- Public pages can use server rendering.
- Server and UI concerns can live in one repository.
- Framework-specific runtime compatibility must be considered when deploying outside Vercel.

## Revisit when

- Runtime restrictions materially block required features.
- Application/backend boundaries become difficult to maintain in one framework.
