# ADR-0016: Event main-image upload and delivery on R2

**Status:** Accepted
**Accepted:** 2026-09-19

## Context

ADR-0003 chose Cloudflare R2 for media object storage and left the delivery
mechanics open. `docs/plans/media-delivery.md` records the resulting gap as an MVP
blocker and requires five architecture points to be resolved and recorded before any
storage code is merged. This ADR resolves them.

What exists today:

- `event_media` stores Revision-owned metadata: object key, content type, alt text, and
  a `is_main` uniqueness index per Revision.
- `src/features/media/schema.ts` validates that object key, content type, and alt text
  are supplied together and that the content type begins with `image/`. The object key
  is taken from user input: the Revision editor renders text inputs labelled
  `object key` and `content type`, so an Organizer types them by hand. Nothing proves
  an object exists or who wrote it.
- `wrangler.jsonc` declares `ASSETS`, `WORKER_SELF_REFERENCE`, and `IMAGES` bindings.
  There is no R2 bucket binding.
- `src/features/events/components/public-event-page.tsx` renders a placeholder element
  carrying the alt text instead of an image.

So the MVP has main-image *metadata* and no upload, no storage, and no delivery, while
REQ-EVENT-008 already requires an alt-texted main image at review submission. The
review gate depends on a field that no upload path produces.

### One constraint that shapes the whole design

`create_event_revision_draft` copies `event_media` rows — including `object_key` —
from the approved Revision into the new draft (`20260902120000`, and again in
`20260902150000`). **One stored object is therefore referenced by an unbounded number
of Revisions.**

Two consequences follow, and the decisions below are built around them:

- An object key must not be namespaced by `event_revision_id`. A copied row would
  otherwise carry another Revision's id, and any authorization rule of the form "the
  key's prefix must match the Revision being edited" would either reject inherited
  media or have to be weakened until it proves nothing.
- Replacing a draft's image must not delete the object it replaces. The currently
  published Revision may still reference that key, and deleting it would blank a live
  public page.

## Decision

### 1. R2 bindings

One R2 bucket per environment, bound as `MEDIA` in `wrangler.jsonc`. Application code
reaches it through `getCloudflareContext().env.MEDIA` from `@opennextjs/cloudflare`.

`next dev` and `wrangler dev` use local R2 simulation, so local development and CI need
no real bucket and no R2 credentials. `pnpm cf-typegen` generates the binding types
that already feed `CloudflareEnv`.

Rejected: a single bucket with environment-prefixed keys, which makes a production
mistake in staging indistinguishable from correct behaviour; and the S3-compatible API
with credentials in environment variables, which puts long-lived secrets in the
environment when a binding needs none.

### 2. Upload path

Upload bytes pass through the application. The existing Revision editor gains a file
input, and the existing Server Action validates the bytes and writes them to R2.

A Cloudflare Worker accepts a request body up to 100 MB on the account plans in
question, which is far above the limit in point 5, so the body size is not a reason to
push bytes around the application. Next.js caps a Server Action body at 1 MB by
default, so `experimental.serverActions.bodySizeLimit` is raised to `'11mb'` — the
10 MB limit below plus room for multipart boundaries and part headers.

This keeps the editor working without client-side JavaScript, which is how every other
form in the application behaves, and keeps authorization in one place: the action that
already decides whether this member may edit this Revision is the action that writes
the object.

Rejected: a short-lived direct-upload grant, which requires client-side JavaScript and
introduces a window in which an object exists with no metadata row, or a metadata row
points at an object that never arrived; and Cloudflare Images direct creator upload,
which departs from the R2 decision in ADR-0003 for a benefit the MVP does not need.

### 3. Ownership and Revision state

- The server derives the object key as `events/{event_id}/{random}.{ext}`, where
  `{random}` is server-generated and `{ext}` is fixed by the verified content type.
  The application never accepts a client-supplied object key. `parseMainImage` changes
  shape accordingly and the editor's `object key` and `content type` inputs are removed.
- The key is namespaced by `event_id`, not `event_revision_id`, because Revision drafts
  inherit keys from the Revision they were copied from. `event_id` is stable for the
  life of the Event and its owning Organization does not change.
- Writing media reuses the Revision edit authorization that already exists: a member of
  the owning Organization, and a Revision in `draft` or `changes_requested`. The
  existing `assert_event_revision_content_editable` trigger already enforces the state
  half at the database level.
- A negative RLS test in `supabase/tests/database/` proves that a non-member and an
  in-review Revision cannot write `event_media`, per the `area:db` / `area:auth`
  evidence rule in `AGENTS.md`.

### 4. Public delivery

The bucket is private in every environment. Nothing is ever served directly from R2,
and no storage URL is exposed.

A route at `/events/{eventId}/image` resolves the Event's `published_revision_id`,
reads the `is_main` row of that Revision, and streams that object. A draft or
in-review object is unreachable because no published Revision points at it. The route
responds 404 for an Event with no approved Revision and for an Event whose approved
Revision has no main image.

The URL carries no object key, so a key is never disclosed even for approved media.
The URL is stable across replacements, which is what makes the cache policy in point 5
work.

Approval therefore remains exactly what it is today: an update of
`published_revision_id` inside the existing trusted transition. No object is copied,
moved, or made public, so approval gains no step that can fail after the transaction
commits.

Rejected: separate private and public buckets with a copy on approval, which splits
approval into a database transaction plus a storage operation and leaves a published
Event with no image when the second half fails; and a single public bucket with
unguessable keys, which `docs/architecture/security.md` already prohibits by
forbidding public exposure of unapproved media or its storage URLs.

### 5. Validation, cache, replacement, and cleanup

- **Accepted types:** `image/jpeg`, `image/png`, `image/webp`.
- **Content signature:** the declared content type is not trusted. The leading bytes
  are checked against the declared type and the upload is rejected on a mismatch.
- **Maximum size:** 10 MB per image.
- **Dimensions:** not checked in the MVP. Decoding an image to measure it is work the
  release gate does not require, and the size limit already bounds the cost.
- **Filename:** no part of the client filename is retained. The extension comes from
  the verified content type.
- **Cache:** the delivery route responds `Cache-Control: public, max-age=3600`.
  It is deliberately not `immutable`: the URL is stable across replacements, and an
  Event that has to be taken down for a rights complaint must stop being served within
  a bounded time. A denied or missing response is `Cache-Control: no-store`.
- **Pairing:** an `event_media` row is an object *and* the text describing it, because
  the table requires both `object_key` and `alt_text`. Object key, content type, and
  alt text are therefore written together or not at all, and a save carrying only one
  half is rejected with a field error rather than passed to the database. This
  restates the rule `parseMainImage` held before this ADR; it is recorded here because
  moving key derivation to the server moved the rule's home with it.
- **Replacement:** uploading a new main image writes a new object and repoints the
  draft's `event_media` row. The previous object is left in place.
- **Deletion:** the MVP deletes nothing from R2. Because Revision drafts copy object
  keys, an object may be referenced by Revisions other than the one being edited, and
  the cost of a wrong deletion is a blank image on a live page. Sweeping objects that
  no `event_media` row references any more is a separate, post-MVP task.
- **Recovery:** with nothing deleted, recovery within the MVP means repointing metadata
  at an object that still exists. Bucket-level recovery is an operations concern and
  belongs in the runbook, not here.

## Alternatives considered

- **Defer media to post-MVP and publish without images.** Contradicts REQ-EVENT-008,
  which requires an alt-texted main image at review submission, and would require
  changing the publication validation that M4 already implements.
- **Keep user-authored object keys and treat upload as an operator task.** Leaves
  `event_media` pointing at objects the platform never verified, and leaves the review
  gate unable to confirm that an approved Event has a deliverable image.
- **Store images in Supabase Storage instead of R2.** Departs from ADR-0003 and splits
  media across two providers. Recorded because it would remove points 1 and 4 by using
  Supabase's own RLS-backed object access, which is the strongest argument against the
  current split. Rejected because the application is deployed on Workers and a binding
  to a bucket in the same platform is the shorter path, and because the delivery rule
  in point 4 is a single query the application already knows how to make.
- **Reference-counted deletion instead of keeping every object.** Rejected for the MVP:
  it makes the correctness of a destructive operation depend on a join that the draft
  copy semantics make easy to get wrong, in exchange for storage that costs little at
  MVP volume.

## Consequences

- `parseMainImage` and the M4 Revision editor change: the `object key` and
  `content type` text inputs disappear and a file input takes their place. The E2E
  coverage in `tests/e2e/m4-event-review.spec.ts` that fills those fields changes with
  them.
- Draft creation carries no main image. The object key is namespaced by Event id,
  which does not exist until that call returns, so the create form offers neither the
  file nor its alt text and both are set from the Event's edit page afterwards.
- REQ-EVENT-008 becomes satisfiable for the first time: an Organizer can supply a real
  main image, so the review gate stops depending on a field with no supply path.
- `docs/plans/m5-public-discovery.md` can close its main-image acceptance criterion:
  the public Event page replaces the placeholder with the delivery route.
- CI can exercise upload and delivery, because local R2 simulation needs no
  credentials. The staging verification in `docs/plans/media-delivery.md` remains the
  first exercise of a real bucket and of cache headers at the edge.
- Storage grows without bound during the MVP. This is an accepted, recorded cost of the
  deletion decision, not an oversight.
- `next.config.ts` gains an `experimental.serverActions.bodySizeLimit` entry, which
  applies to every Server Action in the application, not only this one.

## Revisit when

- Object storage growth becomes a real cost, at which point the orphan sweep deferred
  in point 5 becomes worth its risk.
- Multiple images, Flyer PDF, or video upload enter scope, which `docs/product/scope.md`
  currently defers to After Core MVP. Several of these decisions are sized for exactly
  one image per Revision.
- An unpublish state for rights complaints is introduced, which would make the cache
  window in point 5 a stated requirement rather than a judgement.
- Image transformation beyond the main-image release gate becomes a requirement, at
  which point the `IMAGES` binding already in `wrangler.jsonc` is the place to start.
