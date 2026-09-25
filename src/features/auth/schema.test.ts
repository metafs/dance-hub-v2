import { describe, expect, it } from "vitest";

import { normalizeEmail, passwordProblem } from "./schema";

describe("normalizeEmail", () => {
  it("trims and lower-cases an address", () => {
    expect(normalizeEmail("  Organizer@Example.COM ")).toBe("organizer@example.com");
  });

  it("rejects what cannot be an address", () => {
    for (const value of [null, "", "organizer", "organizer@", "@example.com", "a b@example.com", `${"a".repeat(250)}@example.com`]) {
      expect(normalizeEmail(value), String(value)).toBeNull();
    }
  });
});

describe("passwordProblem", () => {
  it("accepts a password of eight or more characters typed twice", () => {
    expect(passwordProblem("dance-hub-8", "dance-hub-8")).toBeNull();
  });

  it("names what is wrong", () => {
    expect(passwordProblem("short", "short")).toBe("too-short");
    expect(passwordProblem("a".repeat(73), "a".repeat(73))).toBe("too-long");
    expect(passwordProblem("あ".repeat(25), "あ".repeat(25))).toBe("too-long");
    expect(passwordProblem("dance-hub-8", "dance-hub-9")).toBe("mismatch");
  });
});
