# p8ce — Deployment

**Status:** Accepted
**Last Updated:** 2026-09-01

## Stack

- Application: Next.js 16
- Runtime / hosting: Cloudflare Workers through a compatible Next.js adapter
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Media storage: Cloudflare R2
- Image delivery / transformation: Cloudflare Images where useful
- CI: GitHub Actions

These choices are accepted by ADR-0001 through ADR-0003. Implementation must validate the selected adapter and deployment path in the scaffold PR before production use.

## Object storage

Event main images live in a private R2 bucket bound as `MEDIA`
([ADR-0016](../adr/0016-event-main-image-delivery.md)). The binding is declared per
environment in `wrangler.jsonc`; run `pnpm cf-typegen` after changing it so
`cloudflare-env.d.ts` matches.

The bucket needs no credentials in the application: `next dev` and `wrangler dev` bind a
local simulation, so development and CI exercise upload and delivery without a real
bucket. A deployed environment needs the named buckets to exist.

Nothing is served from the bucket directly. `/events/{eventId}/image` is the only read
path, and it resolves the Event's approved Revision before streaming.

## Public origin

`NEXT_PUBLIC_SITE_URL` holds the public origin the deployment is served from. It is
optional so that builds and CI, which have no public origin, keep working.

A deployment that should be indexed must set it. Without it, `/sitemap.xml` is empty,
`robots.txt` carries no `Sitemap:` line, and Open Graph URLs stay relative, because the
alternative is emitting crawler-facing URLs built on a guessed host.
