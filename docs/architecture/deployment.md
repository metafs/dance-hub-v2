# DANCE HUB — Deployment

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
