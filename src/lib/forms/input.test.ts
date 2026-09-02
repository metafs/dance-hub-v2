import { describe, expect, it } from "vitest";

import { formRawText, formText, httpUrl, tokyoDateTime } from "./input";

describe("form input helpers", () => {
  it("normalizes text without stringifying non-text entries", () => {
    const formData = new FormData();
    formData.set("text", "  value  ");
    formData.set("password", "  secret  ");
    formData.set("file", new File(["content"], "sample.txt"));

    expect(formText(formData, "text")).toBe("value");
    expect(formRawText(formData, "password")).toBe("  secret  ");
    expect(formText(formData, "file")).toBe("");
  });

  it("accepts only HTTP(S) URLs", () => {
    expect(httpUrl(" https://example.com/path ")).toBe("https://example.com/path");
    expect(httpUrl("javascript:alert(1)")).toBeNull();
    expect(httpUrl("not a url")).toBeNull();
  });

  it("converts valid Tokyo local datetimes and rejects normalized calendar dates", () => {
    expect(tokyoDateTime("2030-04-01T19:00")).toBe("2030-04-01T10:00:00.000Z");
    expect(tokyoDateTime("2030-02-30T19:00")).toBeNull();
    expect(tokyoDateTime("2030-04-01")).toBeNull();
  });
});
