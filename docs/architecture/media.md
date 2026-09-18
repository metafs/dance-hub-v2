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
[deployment](deployment.md). `src/features/media/schema.ts` requires the main-image
object key, content type, and alt text to be supplied together, and accepts only image
content types.

## Security boundary

User-controlled media is untrusted. The security rules require validation of content
type, size, object key, ownership, and delivery scope, and prohibit public exposure of
unapproved media or its storage URLs. Server-side authorization and RLS remain required
alongside UI behavior.

## Implementation status and TBDs

The current application source has validation for main-image metadata but does not
implement an R2 upload API, object-key convention, signed upload flow, delivery URL
policy, image transformation policy, or media lifecycle cleanup. These are TBDs, not
implicit product behavior. Any implementation must preserve revision visibility and the
security rules above.
