# ADR-0016: Event main-image upload and delivery on R2

**Status:** Proposed

## Context

ADR-0003 chose Cloudflare R2 for media object storage and left the delivery mechanics
open. `docs/plans/media-delivery.md` records the resulting gap as an MVP blocker and
requires five architecture points to be resolved and recorded before any storage code
is merged. This ADR exists to hold those points as stated options. It does not decide
them.

What exists today:

- `event_media` stores Revision-owned metadata: object key, content type, alt text, and
  a `is_main` uniqueness index per Revision.
- `src/features/media/schema.ts` validates that object key, content type, and alt text
  are supplied together and that the content type begins with `image/`. The object key
  is taken from user input; nothing proves an object exists or who wrote it.
- `wrangler.jsonc` declares `ASSETS`, `WORKER_SELF_REFERENCE`, and `IMAGES` bindings.
  There is no R2 bucket binding.
- `src/features/events/components/public-event-page.tsx` renders a placeholder element
  carrying the alt text instead of an image.

So the MVP has main-image *metadata* and no upload, no storage, and no delivery.
REQ-EVENT-008 already requires an alt-texted main image at review submission, which
means the review gate currently depends on a field no upload path produces.

## Decision

**Not decided.** Each gate below lists the options identified from the existing
architecture and requirements. Deciding is a separate step, per the repository's ADR
convention.

### Gate 1 — How Workers receive R2 bindings across environments

- **1a.** One bucket per environment, bound as `MEDIA` in `wrangler.jsonc`, with
  `wrangler dev` using local R2 emulation for development.
- **1b.** One bucket with environment-prefixed object keys and a single binding.
- **1c.** S3-compatible API with credentials in environment variables instead of a
  Worker binding.

Open: whether local development and CI run against emulated R2, a real preview bucket,
or a filesystem stub, and what `.env.example` and `docs/architecture/deployment.md` must
then state.

### Gate 2 — Whether upload bytes pass through the application

- **2a.** Bytes pass through a Server Action or Route Handler, which validates and
  writes to R2. Simplest authorization story; Worker request-size limits apply.
- **2b.** Server issues a short-lived presigned PUT for a server-derived key; the
  browser uploads directly. Avoids the size limit; needs a confirmation step so
  metadata is only recorded for an object that actually landed.
- **2c.** Cloudflare Images direct-creator upload instead of raw R2.

Open: the maximum accepted image size, and whether the size that decides between 2a and
2b is a product constraint or an infrastructure one.

### Gate 3 — How ownership and Revision state are verified

- **3a.** Server derives the object key from `event_revision_id` plus a server-generated
  random component, and never accepts a client-supplied key. The existing
  `parseMainImage` signature changes accordingly.
- **3b.** Authorization reuses the existing Revision edit policy: media is writable only
  while the Revision is `draft` or `changes_requested`, and only by a Member of the
  owning Organization.
- **3c.** A `supabase/tests/database/` negative test proves a non-member and an
  in-review Revision cannot write `event_media`, per the `area:db` / `area:auth`
  evidence rule in `AGENTS.md`.

3a, 3b, and 3c are complementary rather than alternatives; the open point is whether
anything beyond them is required.

### Gate 4 — How an approved object becomes publicly deliverable

- **4a.** Private bucket for everything; a Worker route resolves an Event's current
  `published_revision_id`, checks that the requested object belongs to that Revision,
  and streams it. Draft objects are never reachable by URL.
- **4b.** Two buckets: private for draft and in-review, public for approved. Approval
  copies or moves the object. Delivery is a plain public URL; approval becomes a
  storage operation that can fail independently of the database transaction.
- **4c.** Single public bucket with unguessable keys. Rejected on its face by
  `docs/architecture/security.md`, which prohibits public exposure of unapproved media
  or its storage URLs, but recorded so the reason is not re-litigated.

Open: whether 4a's per-request authorization check is acceptable at CDN cache
granularity, and how 4b keeps storage and `published_revision_id` consistent when the
copy fails after the transaction commits.

### Gate 5 — Validation, cache, replacement, cleanup, and recovery rules

Points that need stated values rather than a choice between designs:

- Accepted MIME types and whether a content-signature (magic-byte) check is required in
  addition to the declared content type.
- Maximum byte size and maximum pixel dimensions.
- Filename handling: whether any part of the client filename survives into the key.
- Cache-control and immutability of delivered objects, and how a replacement
  invalidates a cached response.
- What happens to the previous object when a main image is replaced, and whether
  abandoned draft objects are swept on a schedule or on Revision transition.
- Whether an object deleted in error is recoverable, and from what.

## Alternatives considered

- **Defer media to post-MVP and publish without images.** Contradicts REQ-EVENT-008,
  which requires an alt-texted main image at review submission, and would require
  changing the publication validation that M4 already implements.
- **Keep user-authored object keys and treat upload as an operator task.** Leaves
  `event_media` pointing at objects the platform never verified, and leaves the review
  gate unable to confirm that an approved Event has a deliverable image.
- **Store images in Supabase Storage instead of R2.** Departs from ADR-0003 and splits
  media across two providers. Recorded because it would remove Gates 1 and 4 by using
  Supabase's own RLS-backed object access, which is the strongest argument against the
  current split.

## Consequences

Stated here so they are visible before a decision is made, not as accepted outcomes.

- `parseMainImage` and the M4 Revision editor change under every option in Gate 3: the
  editor stops accepting an object key as a text field.
- Whatever Gate 4 chooses becomes the only path by which M5 renders an approved image,
  so `docs/plans/m5-public-discovery.md` cannot close its main-image acceptance
  criterion before this ADR is decided.
- Gate 1's choice determines whether CI can exercise upload at all, which decides
  whether the `media-delivery.md` test plan runs in CI or only against staging.

## Revisit when

- The five gates above are decided, at which point this ADR is rewritten as an Accepted
  decision or superseded by one.
- Multiple images, Flyer PDF, or video upload enter scope, which `docs/product/scope.md`
  currently defers to After Core MVP.
- Image transformation beyond the main-image release gate becomes a requirement.
