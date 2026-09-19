# DANCE HUB - Media Architecture

**Status:** Draft  
**Last Updated:** 2026-09-03

## Current contract

Media belongs to an Event Revision through `event_media`; the schema supports ordered
multiple media. The MVP editor and publication validation expose one main image with
required alt text. This is defined by
[REQ-MEDIA-001](../product/requirements.md#45-authentication-media-and-audit) and the
[data model](data-model.md#media).

The selected storage runtime is Cloudflare R2. Cloudflare Images may be used for image
delivery or transformation where useful; the current stack decision is recorded in
[deployment](deployment.md). `src/features/media/schema.ts` accepts only JPEG, PNG,
and WebP uploads, validates their leading bytes, and derives the object key from the
authorized Event ID.

## Security boundary

User-controlled media is untrusted. The security rules require validation of content
type, size, object key, ownership, and delivery scope, and prohibit public exposure of
unapproved media or its storage URLs. Server-side authorization and RLS remain required
alongside UI behavior.

## Decided contract

[ADR-0016](../adr/0016-event-main-image-delivery.md) resolves the upload and delivery
design. In summary:

- A private R2 bucket per environment, bound as `MEDIA`.
- Upload bytes pass through the Server Action that already authorizes the Revision
  edit. The object key is server-derived as `events/{event_id}/{random}.{ext}` and a
  client-supplied key is never accepted.
- `/events/{eventId}/image` streams only the main image of the Event's current approved
  Revision, so nothing is served directly from R2 and approval stays a single database
  transition.
- `image/jpeg`, `image/png`, `image/webp`, 10 MB, with a leading-byte signature check
  against the declared type.
- Replacement writes a new object and keeps the old one. The MVP deletes nothing,
  because Revision drafts copy object keys and an object may be referenced by more than
  one Revision.

## Implementation status

DH-10 and DH-11 implement the R2 binding, authorized upload path, and approved-only
delivery route. The remaining staging verification is tracked as DH-14 in the
[initial release breakdown](../plans/initial-release-breakdown.md).
