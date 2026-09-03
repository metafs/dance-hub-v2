# Cross-cutting track — Event main-image delivery

**Status:** Planned — MVP blocker

**Understood as:** The existing Revision-owned `event_media` record is metadata, not an upload system. MVP completion requires a real, authorized path from image selection through private draft storage to approved public delivery.

## Requirements

- REQ-EVENT-002
- REQ-EVENT-008
- REQ-MEDIA-001
- REQ-AUTH-001

## Scope

- One main image per Event Revision in the MVP editor.
- Cloudflare R2 object storage as accepted by ADR-0003.
- Required alt text, validated image type and size, server-derived object keys, and Organization ownership checks.
- Draft/in-review media remains private; public delivery resolves only media owned by the Event's current approved Revision.
- Replacement, abandoned-draft cleanup, deletion, and recovery behavior.
- Local, CI, and Cloudflare staging verification of upload authorization and public/private delivery.

## Out of scope

- Multiple-image editing, Flyer PDF, video upload, and a general-purpose asset library.
- Image transformation beyond what is needed for the main-image release gate.

## Architecture gates

Implementation must resolve and record these points before storage code is merged:

1. How Workers receive R2 bindings in local, preview, and production environments.
2. Whether upload bytes pass through the application or use a short-lived direct-upload grant.
3. How object ownership and Revision state are verified without exposing R2 credentials.
4. How an approved object becomes publicly deliverable while draft and in-review objects remain private.
5. Size, MIME, content-signature, filename, cache, replacement, cleanup, and recovery rules.

If these choices extend ADR-0003 materially, update it or add a focused ADR before implementation.

## Test plan

- Unit: object-key construction and file validation boundaries.
- Integration: Organization/Revision authorization, mutable-state restriction, replacement, and cleanup metadata.
- E2E: upload a valid image, reject invalid/oversized content, keep an unapproved image private, and serve the approved main image with alt text.
- Staging: verify the real R2 binding, cache headers, object delivery, and recovery procedure.

## Completion criteria

M4 editing no longer accepts a user-authored object key as a substitute for upload, M5 renders the approved image, and M6 staging proves private draft isolation and public approved delivery.
