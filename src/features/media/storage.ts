import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * The private R2 bucket holding Event main images (ADR-0016). Nothing is served
 * from it directly: writes go through the Revision edit action and reads through
 * the delivery route, which resolves the Event's approved Revision first.
 *
 * `next dev` and `wrangler dev` bind a local simulation, so development and CI
 * need neither a real bucket nor R2 credentials.
 */
async function mediaBucket() {
  const { env } = await getCloudflareContext({ async: true });
  return env.MEDIA;
}

export async function putMainImage(
  objectKey: string,
  bytes: Uint8Array,
  contentType: string,
) {
  const bucket = await mediaBucket();
  await bucket.put(objectKey, bytes, { httpMetadata: { contentType } });
}

export async function getMainImage(objectKey: string) {
  const bucket = await mediaBucket();
  return bucket.get(objectKey);
}
