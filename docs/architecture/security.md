# p8ce — Security Rules

**Status:** Draft
**Version:** 0.2
**Last Updated:** 2026-09-01

- Never commit secrets or expose service-role credentials to browser code.
- Enforce Organization and Platform Admin authorization server-side and with RLS; never rely only on UI conditions.
- Keep all schema changes migration-driven and local tests independent of production credentials.
- Treat user-controlled input and uploaded media as untrusted; validate content type, size, object key, ownership, and delivery scope.
- Do not expose drafts, in-review revisions, candidates, applications, decision notes, or unapproved media through public queries, metadata, or storage URLs.
- Perform Organization Application approval and the resulting Organization / initial Owner creation in one transaction.
- Preserve audit actor, time, state transition, and decision reason for moderation actions.
- Create review notifications only from trusted audit records in the same transaction. Restrict notification reads to the recipient and updates to read state; never expose decision content to anonymous or unrelated users.
- Supabase grants `anon` every privilege on new tables and functions in `public`. Every migration that adds one states the anonymous grant explicitly: revoke from `anon` as well as `public` (`revoke ... from public` alone leaves anon's own grant), and give anon only `SELECT` on columns the public pages read. `events` and `event_revisions` are readable by anon through column grants, so a new public column on either needs a grant in the migration that adds it. `supabase/tests/database/anonymous_privileges.test.sql` pins the whole anonymous surface and fails when it widens.
