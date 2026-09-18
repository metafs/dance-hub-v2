import { describe, expect, it } from "vitest";

import {
  filterQueryString,
  hasActiveFilter,
  parseDiscoveryFilters,
} from "./filters";

describe("parseDiscoveryFilters", () => {
  it("reads every supported filter from the query string", () => {
    expect(parseDiscoveryFilters({
      from: "2026-05-01",
      to: "2026-05-31",
      prefecture: "KANAGAWA",
      type: "workshop",
    })).toEqual({
      from: "2026-05-01",
      to: "2026-05-31",
      prefecture: "KANAGAWA",
      eventType: "workshop",
    });
  });

  it("returns empty filters for an empty query string", () => {
    expect(parseDiscoveryFilters({})).toEqual({
      from: null,
      to: null,
      prefecture: null,
      eventType: null,
    });
  });

  it("drops values that are not valid rather than failing", () => {
    expect(parseDiscoveryFilters({
      from: "2026-5-1",
      to: "not-a-date",
      prefecture: "OSAKA",
      type: "concert",
    })).toEqual({
      from: null,
      to: null,
      prefecture: null,
      eventType: null,
    });
  });

  it("keeps the valid half of a partly invalid query string", () => {
    expect(parseDiscoveryFilters({ from: "2026-05-01", prefecture: "OSAKA" }))
      .toEqual({
        from: "2026-05-01",
        to: null,
        prefecture: null,
        eventType: null,
      });
  });

  it("takes the first value when a parameter is repeated", () => {
    expect(parseDiscoveryFilters({ prefecture: ["TOKYO", "KANAGAWA"] }).prefecture)
      .toBe("TOKYO");
  });

  it("trims surrounding whitespace", () => {
    expect(parseDiscoveryFilters({ type: " festival " }).eventType).toBe("festival");
  });
});

describe("filterQueryString", () => {
  it("round-trips a set of filters", () => {
    const filters = {
      from: "2026-05-01",
      to: "2026-05-31",
      prefecture: "TOKYO" as const,
      eventType: "performance" as const,
    };

    expect(parseDiscoveryFilters(
      Object.fromEntries(new URLSearchParams(filterQueryString(filters).slice(1))),
    )).toEqual(filters);
  });

  it("omits the question mark when nothing is filtered", () => {
    expect(filterQueryString({})).toBe("");
    expect(filterQueryString({ from: null, prefecture: null })).toBe("");
  });

  it("writes only the filters that are set", () => {
    expect(filterQueryString({ prefecture: "KANAGAWA" })).toBe("?prefecture=KANAGAWA");
  });
});

describe("hasActiveFilter", () => {
  it("distinguishes a filtered view from the default one", () => {
    expect(hasActiveFilter({})).toBe(false);
    expect(hasActiveFilter({ from: null, to: null })).toBe(false);
    expect(hasActiveFilter({ eventType: "talk" })).toBe(true);
  });
});
