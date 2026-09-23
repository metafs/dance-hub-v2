import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
  it("cannot be closed early by user-supplied text", () => {
    const value = { name: "</script><script>alert(1)</script> & more" };
    const json = serializeJsonLd(value);

    expect(json).not.toContain("<");
    expect(json).not.toContain(">");
    expect(json).not.toContain("&");
    expect(JSON.parse(json)).toEqual(value);
  });

  it("escapes line and paragraph separators without changing the value", () => {
    const value = { description: `一行目${String.fromCharCode(0x2028)}二行目${String.fromCharCode(0x2029)}` };
    const json = serializeJsonLd(value);

    expect(json).toContain("\\u2028");
    expect(json).toContain("\\u2029");
    expect(JSON.parse(json)).toEqual(value);
  });
});
