import { describe, expect, it } from "vitest";

import {
  formatTokyoDateTime,
  TOKYO_TIME_ZONE,
  toTokyoDateTimeLocal,
  tokyoDateKey,
  tokyoDateTime,
  tokyoDayEndExclusive,
  tokyoDayStart,
} from ".";

describe("Tokyo datetime utilities", () => {
  it("uses Asia/Tokyo for formatted display", () => {
    const value = "2026-09-01T15:30:00.000Z";
    const expected = new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: TOKYO_TIME_ZONE,
    }).format(new Date(value));

    expect(formatTokyoDateTime(value)).toBe(expected);
  });

  it("converts instants to datetime-local values in Tokyo", () => {
    expect(toTokyoDateTimeLocal("2026-01-01T00:30:00.000Z")).toBe("2026-01-01T09:30");
    expect(toTokyoDateTimeLocal(null)).toBe("");
  });

  it("persists datetime-local input as an explicit Tokyo instant", () => {
    expect(tokyoDateTime("2026-01-01T09:30")).toBe("2026-01-01T00:30:00.000Z");
    expect(tokyoDateTime("2026-01-01T09:30:45")).toBe("2026-01-01T00:30:45.000Z");
    expect(tokyoDateTime("invalid")).toBeNull();
    expect(tokyoDateTime("")).toBeNull();
  });
});

describe("Tokyo calendar-day boundaries", () => {
  it("resolves the Tokyo calendar day an instant falls on", () => {
    expect(tokyoDateKey("2026-04-01T10:00:00.000Z")).toBe("2026-04-01");
  });

  it("keeps late-evening Tokyo instants on the Tokyo day, not the UTC day", () => {
    // 2026-03-31T23:30+09:00 is still 2026-03-31 in Tokyo and already
    // 2026-03-31T14:30Z, but an instant just after Tokyo midnight rolls over.
    expect(tokyoDateKey("2026-03-31T14:30:00.000Z")).toBe("2026-03-31");
    expect(tokyoDateKey("2026-03-31T15:30:00.000Z")).toBe("2026-04-01");
  });

  it("returns null for values that are not instants", () => {
    expect(tokyoDateKey("invalid")).toBeNull();
  });

  it("expands a calendar date into a half-open Tokyo day range", () => {
    expect(tokyoDayStart("2026-04-01")).toBe("2026-03-31T15:00:00.000Z");
    expect(tokyoDayEndExclusive("2026-04-01")).toBe("2026-04-01T15:00:00.000Z");
  });

  it("crosses month and year boundaries in Tokyo", () => {
    expect(tokyoDayEndExclusive("2026-12-31")).toBe("2026-12-31T15:00:00.000Z");
    expect(tokyoDayStart("2027-01-01")).toBe("2026-12-31T15:00:00.000Z");
  });

  it("rejects anything that is not a YYYY-MM-DD calendar date", () => {
    expect(tokyoDayStart("2026-4-1")).toBeNull();
    expect(tokyoDayStart("2026-04-01T00:00")).toBeNull();
    expect(tokyoDayStart("")).toBeNull();
    expect(tokyoDayEndExclusive("invalid")).toBeNull();
  });

  it("round-trips a day start back to the same calendar day", () => {
    const start = tokyoDayStart("2026-04-01");
    expect(start && tokyoDateKey(start)).toBe("2026-04-01");
  });
});
