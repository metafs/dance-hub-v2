import { describe, expect, it } from "vitest";

import { parseMainImage } from "./schema";

describe("parseMainImage", () => {
  it("accepts empty metadata for a draft", () => {
    expect(parseMainImage("", "", "")).toEqual({
      imageAlt: null,
      imageContentType: null,
      imageObjectKey: null,
    });
  });

  it("requires all main-image metadata together", () => {
    expect(parseMainImage("events/cover.jpg", "image/jpeg", "")).toBeNull();
  });

  it("accepts image content types only", () => {
    expect(
      parseMainImage("events/cover.jpg", "image/jpeg", "Event poster"),
    ).toEqual({
      imageAlt: "Event poster",
      imageContentType: "image/jpeg",
      imageObjectKey: "events/cover.jpg",
    });
    expect(
      parseMainImage("events/cover.pdf", "application/pdf", "Event poster"),
    ).toBeNull();
  });
});
