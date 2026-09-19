import { describe, expect, it } from "vitest";

import {
  detectImageContentType,
  isAcceptedImageContentType,
  mainImageObjectKey,
  maxMainImageBytes,
  validateMainImagePairing,
  validateMainImageUpload,
} from "./schema";

const eventId = "11111111-2222-4333-8444-555555555555";

function jpeg(extra = 0) {
  return new Uint8Array([0xff, 0xd8, 0xff, ...new Array(extra).fill(0)]);
}

function png() {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
}

function webp() {
  return new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x00, 0x00, 0x00, 0x00, // size
    0x57, 0x45, 0x42, 0x50, // WEBP
  ]);
}

describe("detectImageContentType", () => {
  it("recognises the formats we serve", () => {
    expect(detectImageContentType(jpeg())).toBe("image/jpeg");
    expect(detectImageContentType(png())).toBe("image/png");
    expect(detectImageContentType(webp())).toBe("image/webp");
  });

  it("returns null for anything else", () => {
    expect(detectImageContentType(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBeNull(); // %PDF
    expect(detectImageContentType(new Uint8Array([]))).toBeNull();
    expect(detectImageContentType(new Uint8Array([0xff, 0xd8]))).toBeNull(); // truncated
  });

  it("does not accept a RIFF container that is not WebP", () => {
    const wav = new Uint8Array([
      0x52, 0x49, 0x46, 0x46,
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x41, 0x56, 0x45, // WAVE
    ]);

    expect(detectImageContentType(wav)).toBeNull();
  });
});

describe("validateMainImageUpload", () => {
  it("accepts each supported format and names its extension", () => {
    expect(validateMainImageUpload({ declaredContentType: "image/jpeg", bytes: jpeg() }))
      .toEqual({ ok: true, contentType: "image/jpeg", extension: "jpg" });
    expect(validateMainImageUpload({ declaredContentType: "image/png", bytes: png() }))
      .toEqual({ ok: true, contentType: "image/png", extension: "png" });
    expect(validateMainImageUpload({ declaredContentType: "image/webp", bytes: webp() }))
      .toEqual({ ok: true, contentType: "image/webp", extension: "webp" });
  });

  it("ignores content-type parameters and casing", () => {
    expect(validateMainImageUpload({
      declaredContentType: "IMAGE/JPEG; charset=binary",
      bytes: jpeg(),
    })).toEqual({ ok: true, contentType: "image/jpeg", extension: "jpg" });
  });

  it("rejects an empty file", () => {
    expect(validateMainImageUpload({
      declaredContentType: "image/jpeg",
      bytes: new Uint8Array([]),
    })).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects a file over the size limit", () => {
    expect(validateMainImageUpload({
      declaredContentType: "image/jpeg",
      bytes: jpeg(maxMainImageBytes),
    })).toEqual({ ok: false, reason: "too_large" });
  });

  it("accepts a file exactly at the size limit", () => {
    const atLimit = validateMainImageUpload({
      declaredContentType: "image/jpeg",
      bytes: jpeg(maxMainImageBytes - 3),
    });

    expect(atLimit.ok).toBe(true);
  });

  it("rejects a type we do not serve", () => {
    expect(validateMainImageUpload({
      declaredContentType: "image/gif",
      bytes: new Uint8Array([0x47, 0x49, 0x46, 0x38]),
    })).toEqual({ ok: false, reason: "unsupported_type" });
    expect(validateMainImageUpload({
      declaredContentType: "application/pdf",
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    })).toEqual({ ok: false, reason: "unsupported_type" });
  });

  it("rejects bytes that disagree with the declared type", () => {
    // A PDF announced as a JPEG is the case the signature check exists for.
    expect(validateMainImageUpload({
      declaredContentType: "image/jpeg",
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
    })).toEqual({ ok: false, reason: "signature_mismatch" });

    expect(validateMainImageUpload({
      declaredContentType: "image/png",
      bytes: jpeg(),
    })).toEqual({ ok: false, reason: "signature_mismatch" });
  });
});

describe("isAcceptedImageContentType", () => {
  it("accepts only the stored content types we serve", () => {
    expect(isAcceptedImageContentType("image/jpeg")).toBe(true);
    expect(isAcceptedImageContentType("image/png")).toBe(true);
    expect(isAcceptedImageContentType("image/webp")).toBe(true);
    expect(isAcceptedImageContentType("image/svg+xml")).toBe(false);
    expect(isAcceptedImageContentType("IMAGE/JPEG")).toBe(false);
  });
});

describe("mainImageObjectKey", () => {
  it("namespaces the key by Event id", () => {
    expect(mainImageObjectKey(eventId, "0123abcd-4567", "jpg"))
      .toBe(`events/${eventId}/0123abcd-4567.jpg`);
  });

  it("lowercases the Event id so one Event has one prefix", () => {
    expect(mainImageObjectKey(eventId.toUpperCase(), "0123abcd-4567", "png"))
      .toBe(`events/${eventId}/0123abcd-4567.png`);
  });

  it("refuses an Event id that is not a UUID", () => {
    expect(mainImageObjectKey("../../etc", "0123abcd-4567", "jpg")).toBeNull();
    expect(mainImageObjectKey("", "0123abcd-4567", "jpg")).toBeNull();
  });

  it("refuses a token outside the generated alphabet", () => {
    expect(mainImageObjectKey(eventId, "../escape", "jpg")).toBeNull();
    expect(mainImageObjectKey(eventId, "short", "jpg")).toBeNull();
    expect(mainImageObjectKey(eventId, "a/b/cdefgh", "jpg")).toBeNull();
  });

  it("refuses an extension that is not one of ours", () => {
    expect(mainImageObjectKey(eventId, "0123abcd-4567", "svg")).toBeNull();
    expect(mainImageObjectKey(eventId, "0123abcd-4567", "")).toBeNull();
  });
});

describe("validateMainImagePairing", () => {
  it("accepts an object key together with its alt text", () => {
    expect(validateMainImagePairing({ hasObject: true, altText: "公演のメイン画像" }))
      .toEqual({ ok: true });
  });

  it("accepts a Revision with no main image at all", () => {
    expect(validateMainImagePairing({ hasObject: false, altText: null })).toEqual({ ok: true });
  });

  it("refuses an object with no alt text, because event_media requires both", () => {
    const result = validateMainImagePairing({ hasObject: true, altText: null });
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ field: "imageAlt" });
  });

  it("refuses alt text with no object, because alt text alone is not a row", () => {
    const result = validateMainImagePairing({ hasObject: false, altText: "画像の説明" });
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ field: "image" });
  });

  it("treats an empty alt text as absent", () => {
    expect(validateMainImagePairing({ hasObject: false, altText: "" })).toEqual({ ok: true });
  });
});
