# DANCE HUB — Deployment

**Status:** Proposed

## Provisional stack

- Application: Next.js 16
- Runtime / hosting: Cloudflare Workers via a compatible Next.js adapter
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Media storage: Cloudflare R2
- Image delivery / transformation: Cloudflare Images where useful
- CI: GitHub Actions

These are provisional choices and must be represented by accepted ADRs before they are treated as fixed architecture.
