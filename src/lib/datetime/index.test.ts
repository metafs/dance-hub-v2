import { describe, expect, it } from "vitest";

import {
  formatTokyoDateTime,
  TOKYO_TIME_ZONE,
  toTokyoDateTimeLocal,
  tokyoDateTime,
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
