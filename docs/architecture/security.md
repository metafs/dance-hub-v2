# p8ce — Security Rules

**Status:** Draft
**Version:** 0.2
**Last Updated:** 2026-09-01

- Never commit secrets or expose service-role credentials to browser code.
- Enforce Organization and Platform Admin authorization server-side and with RLS; never rely only on UI conditions.
- Keep all schema changes migration-driven and local tests independent of production credentials.
- Treat user-controlled input and uploaded media as untrusted; validate content type, size, object key, ownership, and delivery scope.
- Every response the application renders carries the headers in `next.config.ts`: no framing (`frame-ancestors 'none'`, `X-Frame-Options`), `nosniff`, only the origin as the referrer to other sites, HSTS for the serving host, and forms, `<base>` and plugins kept on this origin. A `script-src` policy is not set, because it needs a nonce on every inline script Next.js emits; add one only with that nonce, never with `'unsafe-inline'`. `tests/e2e/security-headers.spec.ts` checks them.
- A form that writes with the service role bypasses RLS, so the database checks what the form is about. A withdrawal or correction request is accepted only for an Event a Visitor can see, and every other id fails the same way.
- Do not expose drafts, in-review revisions, candidates, applications, decision notes, or unapproved media through public queries, metadata, or storage URLs.
- Perform Organization Application approval and the resulting Organization / initial Owner creation in one transaction.
- Preserve audit actor, time, state transition, and decision reason for moderation actions.
- Create review notifications only from trusted audit records in the same transaction. Restrict notification reads to the recipient and updates to read state; never expose decision content to anonymous or unrelated users.
- Supabase grants `anon` every privilege on new tables and functions in `public`. Every migration that adds one states the anonymous grant explicitly: revoke from `anon` as well as `public` (`revoke ... from public` alone leaves anon's own grant), and give anon only `SELECT` on columns the public pages read. `events` and `event_revisions` are readable by anon through column grants, so a new public column on either needs a grant in the migration that adds it. `event_revisions` is readable by `authenticated` through column grants too: the Platform Admin's review memo (`decision_reason`) is readable by no signed-in user through that table (DEC-R7); its recipients get it from `review_notifications` and `event_revision_audit_log`. `supabase/tests/database/anonymous_privileges.test.sql` pins the whole anonymous surface and fails when it widens.
