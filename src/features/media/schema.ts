/**
 * Main-image validation and object-key construction, per ADR-0016.
 *
 * The object key is always derived here from the Event id and a server-generated
 * token. A client-supplied key is never accepted, and the key is namespaced by
 * `event_id` rather than `event_revision_id` because `create_event_revision_draft`
 * copies `event_media` rows — object key included — into each new draft, so one
 * object is referenced by an unbounded number of Revisions.
 */

export const acceptedImageContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AcceptedImageContentType = (typeof acceptedImageContentTypes)[number];

export const maxMainImageBytes = 10 * 1024 * 1024;

const extensionByContentType: Record<AcceptedImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tokenPattern = /^[0-9a-z-]{8,64}$/;

function startsWithBytes(bytes: Uint8Array, signature: readonly number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * The content type the bytes themselves claim, ignoring what the client declared.
 * Returns null when the leading bytes match none of the accepted formats.
 */
export function detectImageContentType(
  bytes: Uint8Array,
): AcceptedImageContentType | null {
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  // RIFF....WEBP
  if (
    startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46])
    && startsWithBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }

  return null;
}

export type MainImageRejection =
  | "empty"
  | "too_large"
  | "unsupported_type"
  | "signature_mismatch";

export type MainImageValidation =
  | { ok: true; contentType: AcceptedImageContentType; extension: string }
  | { ok: false; reason: MainImageRejection };

function normalizeContentType(value: string) {
  return value.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function isAcceptedImageContentType(value: string): value is AcceptedImageContentType {
  return acceptedImageContentTypes.some((accepted) => accepted === value);
}

/**
 * Accepts an upload only when its declared type is one we serve, its size is
 * within the limit, and its leading bytes agree with the declared type. The
 * declared type comes from the browser and is not trusted on its own.
 */
export function validateMainImageUpload(upload: {
  declaredContentType: string;
  bytes: Uint8Array;
}): MainImageValidation {
  const { bytes } = upload;

  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if (bytes.length > maxMainImageBytes) return { ok: false, reason: "too_large" };

  const declared = normalizeContentType(upload.declaredContentType);
  if (!isAcceptedImageContentType(declared)) {
    return { ok: false, reason: "unsupported_type" };
  }

  if (detectImageContentType(bytes) !== declared) {
    return { ok: false, reason: "signature_mismatch" };
  }

  return {
    ok: true,
    contentType: declared,
    extension: extensionByContentType[declared],
  };
}

/**
 * `events/{event_id}/{token}.{ext}`. Returns null for an Event id that is not a
 * UUID or a token outside the generated alphabet, so nothing a caller passes can
 * escape the Event's prefix.
 */
export function mainImageObjectKey(
  eventId: string,
  token: string,
  extension: string,
): string | null {
  if (!uuidPattern.test(eventId)) return null;
  if (!tokenPattern.test(token)) return null;
  if (!Object.values(extensionByContentType).includes(extension)) return null;

  return `events/${eventId.toLowerCase()}/${token}.${extension}`;
}

export const mainImageRejectionMessages: Record<MainImageRejection, string> = {
  empty: "画像ファイルを選択してください。",
  too_large: "画像は10MB以内にしてください。",
  unsupported_type: "画像はJPEG、PNG、WebPのいずれかにしてください。",
  signature_mismatch: "画像ファイルが壊れているか、形式が一致していません。",
};

export type MainImagePairingError = { field: "image" | "imageAlt"; message: string };

export type MainImagePairing = { ok: true } | ({ ok: false } & MainImagePairingError);

/**
 * An `event_media` row is an object *and* the text describing it: the table
 * requires both `object_key` and `alt_text`, so neither half is a row on its
 * own. Callers therefore send all three image values together or none of them,
 * and this reports which half is missing.
 *
 * It takes `hasObject` rather than the key itself so a caller can ask the
 * question before writing the object, and so a save that would be rejected
 * anyway does not leave an unreferenced object behind.
 */
export function validateMainImagePairing({
  hasObject,
  altText,
}: {
  hasObject: boolean;
  altText: string | null;
}): MainImagePairing {
  if (hasObject && !altText) {
    return { ok: false, field: "imageAlt", message: "画像には代替テキストが必要です。" };
  }
  if (!hasObject && altText) {
    return { ok: false, field: "image", message: "代替テキストを保存するには画像ファイルを選択してください。" };
  }
  return { ok: true };
}
