import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("keeps a path on this site with its query", () => {
    expect(safeRedirectPath("/workspace/org-1/events?tab=draft")).toBe("/workspace/org-1/events?tab=draft");
    expect(safeRedirectPath("/admin/events")).toBe("/admin/events");
  });

  it("falls back when there is no usable value", () => {
    expect(safeRedirectPath(null)).toBe("/workspace");
    expect(safeRedirectPath(undefined)).toBe("/workspace");
    expect(safeRedirectPath("")).toBe("/workspace");
    expect(safeRedirectPath("workspace")).toBe("/workspace");
  });

  it("refuses anything a browser would send to another site", () => {
    for (const value of [
      "//example.com",
      "/\\example.com",
      "/\t/example.com",
      "/\n/example.com",
      "/\\/example.com",
      "https://example.com/workspace",
      "javascript:alert(1)",
    ]) {
      expect(safeRedirectPath(value), JSON.stringify(value)).toBe("/workspace");
    }
  });

  it("does not return to the sign-in form itself", () => {
    expect(safeRedirectPath("/login?next=/admin")).toBe("/workspace");
  });

  it("uses the given fallback", () => {
    expect(safeRedirectPath("//example.com", "/")).toBe("/");
  });
});
