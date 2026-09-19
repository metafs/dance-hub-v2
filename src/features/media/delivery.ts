import "server-only";

import { getPublishedMainImage } from "@/features/events/queries";

import { getMainImage } from "./storage";

/**
 * The only read path into the media bucket (ADR-0016). Nothing is served from
 * R2 directly: this resolves the Event's approved Revision first, so a draft or
 * in-review object is unreachable even if its key were known.
 */
function notFound() {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function eventMainImageResponse(eventId: string) {
  const media = await getPublishedMainImage(eventId);
  if (!media) return notFound();

  const object = await getMainImage(media.objectKey);
  if (!object) return notFound();

  return new Response(object.body, {
    headers: {
      "Content-Type": media.contentType,
      "Content-Length": String(object.size),
      "ETag": object.httpEtag,
      // Deliberately not immutable: the URL is stable across replacements, and
      // an Event withdrawn for a rights complaint must stop being served within
      // a bounded time.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
