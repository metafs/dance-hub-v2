import { describe, expect, it } from "vitest";

import {
  buildEventStructuredData,
  minorUnitToDecimal,
  tokyoIsoDateTime,
  type StructuredEventInput,
} from "./structured-data";

const venue = {
  id: "venue-1",
  name: "森下スタジオ",
  prefecture: "TOKYO",
  addressLine1: "江東区森下3-5-6",
  addressLine2: null,
};

function input(overrides: Partial<StructuredEventInput> = {}): StructuredEventInput {
  return {
    eventId: "event-1",
    origin: "https://p8ce.example",
    title: "新作公演",
    description: "二日間の公演",
    cancelled: false,
    organizationName: "Fixture Dance Organization",
    hasMainImage: false,
    schedules: [
      { startsAt: "2026-10-03T10:00:00.000Z", endsAt: "2026-10-03T11:30:00.000Z", allDay: false, venue },
    ],
    contributors: [],
    offers: [],
    offerUrl: null,
    ...overrides,
  };
}

describe("tokyoIsoDateTime", () => {
  it("states an instant in Tokyo local time with its fixed offset", () => {
    expect(tokyoIsoDateTime("2026-10-03T10:00:00.000Z")).toBe("2026-10-03T19:00:00+09:00");
    expect(tokyoIsoDateTime("2026-10-03T16:30:00.000Z")).toBe("2026-10-04T01:30:00+09:00");
  });

  it("rejects an unparseable value", () => {
    expect(tokyoIsoDateTime("not a date")).toBeNull();
  });
});

describe("minorUnitToDecimal", () => {
  it("keeps a zero-decimal currency whole", () => {
    expect(minorUnitToDecimal("3500", "JPY")).toBe("3500");
    expect(minorUnitToDecimal(0, "JPY")).toBe("0");
  });

  it("places the decimal point by the currency's minor unit", () => {
    expect(minorUnitToDecimal("250050", "USD")).toBe("2500.50");
    expect(minorUnitToDecimal("5", "EUR")).toBe("0.05");
  });

  it("rejects malformed amounts and currencies", () => {
    expect(minorUnitToDecimal("-1", "JPY")).toBeNull();
    expect(minorUnitToDecimal("100", "yen")).toBeNull();
  });
});

describe("buildEventStructuredData", () => {
  it("describes a scheduled Event with its Venue, organizer and absolute URLs", () => {
    const [event] = buildEventStructuredData(input({ hasMainImage: true }));

    expect(event).toEqual({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "新作公演",
      description: "二日間の公演",
      url: "https://p8ce.example/events/event-1",
      image: ["https://p8ce.example/events/event-1/image"],
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      organizer: { "@type": "Organization", name: "Fixture Dance Organization" },
      startDate: "2026-10-03T19:00:00+09:00",
      endDate: "2026-10-03T20:30:00+09:00",
      location: {
        "@type": "Place",
        name: "森下スタジオ",
        url: "https://p8ce.example/venues/venue-1",
        address: {
          "@type": "PostalAddress",
          streetAddress: "江東区森下3-5-6",
          addressRegion: "東京都",
          addressCountry: "JP",
        },
      },
    });
  });

  it("emits one Event per Schedule so each performance keeps its own date and Venue", () => {
    const other = { ...venue, id: "venue-2", name: "神奈川芸術劇場", prefecture: "KANAGAWA" };
    const events = buildEventStructuredData(input({
      schedules: [
        { startsAt: "2026-10-03T10:00:00.000Z", endsAt: null, allDay: false, venue },
        { startsAt: "2026-10-04T05:00:00.000Z", endsAt: null, allDay: false, venue: other },
      ],
    }));

    expect(events.map((event) => [event.startDate, (event.location as { name: string }).name])).toEqual([
      ["2026-10-03T19:00:00+09:00", "森下スタジオ"],
      ["2026-10-04T14:00:00+09:00", "神奈川芸術劇場"],
    ]);
    expect(events[0]).not.toHaveProperty("endDate");
  });

  it("uses the Tokyo calendar day for an all-day Schedule", () => {
    const [event] = buildEventStructuredData(input({
      schedules: [{ startsAt: "2026-10-02T15:00:00.000Z", endsAt: "2026-10-04T14:59:00.000Z", allDay: true, venue }],
    }));

    expect(event.startDate).toBe("2026-10-03");
    expect(event.endDate).toBe("2026-10-04");
  });

  it("marks a cancelled Event as cancelled rather than dropping it", () => {
    const [event] = buildEventStructuredData(input({ cancelled: true }));
    expect(event.eventStatus).toBe("https://schema.org/EventCancelled");
  });

  it("emits nothing for an Event without a dated Schedule", () => {
    expect(buildEventStructuredData(input({ schedules: [] }))).toEqual([]);
  });

  it("leaves URLs out rather than guessing a host when no origin is configured", () => {
    const [event] = buildEventStructuredData(input({ origin: null, hasMainImage: true }));

    expect(event).not.toHaveProperty("url");
    expect(event).not.toHaveProperty("image");
    expect(event.location).not.toHaveProperty("url");
  });

  it("credits Artists as contributors typed by Artist type, once each", () => {
    const [event] = buildEventStructuredData(input({
      contributors: [
        { id: "a1", name: "山田 花子", artistType: "individual" },
        { id: "a2", name: "カンパニーX", artistType: "company" },
        { id: "a1", name: "山田 花子", artistType: "individual" },
        { id: "a3", name: "その他", artistType: "other" },
      ],
    }));

    expect(event).not.toHaveProperty("performer");
    expect(event.contributor).toEqual([
      { "@type": "Person", name: "山田 花子", url: "https://p8ce.example/artists/a1" },
      { "@type": "PerformingGroup", name: "カンパニーX", url: "https://p8ce.example/artists/a2" },
      { "@type": "Organization", name: "その他", url: "https://p8ce.example/artists/a3" },
    ]);
  });

  it("states only prices that carry an amount", () => {
    const [event] = buildEventStructuredData(input({
      offerUrl: "https://tickets.example/show",
      offers: [
        { priceType: "fixed", label: "一般", currency: "JPY", amountMinor: "3500", minAmountMinor: null, maxAmountMinor: null },
        { priceType: "range", label: null, currency: "JPY", amountMinor: null, minAmountMinor: "1000", maxAmountMinor: "3000" },
        { priceType: "donation", label: null, currency: null, amountMinor: null, minAmountMinor: null, maxAmountMinor: null },
        { priceType: "pay_what_you_can", label: null, currency: null, amountMinor: null, minAmountMinor: null, maxAmountMinor: null },
      ],
    }));

    expect(event.offers).toEqual([
      { "@type": "Offer", name: "一般", price: "3500", priceCurrency: "JPY", url: "https://tickets.example/show" },
      {
        "@type": "Offer",
        priceCurrency: "JPY",
        priceSpecification: { "@type": "PriceSpecification", minPrice: "1000", maxPrice: "3000", priceCurrency: "JPY" },
        url: "https://tickets.example/show",
      },
    ]);
    expect(event).not.toHaveProperty("isAccessibleForFree");
  });

  it("marks an Event free only when every offer is free", () => {
    const free = { priceType: "free" as const, label: null, currency: null, amountMinor: null, minAmountMinor: null, maxAmountMinor: null };
    const [event] = buildEventStructuredData(input({ offers: [free] }));

    expect(event.isAccessibleForFree).toBe(true);
    expect(event).not.toHaveProperty("offers");
  });

  it("derives a Festival's dates and Venues from its child Events", () => {
    const other = { ...venue, id: "venue-2", name: "神奈川芸術劇場", prefecture: "KANAGAWA", addressLine1: null };
    const [festival, ...rest] = buildEventStructuredData(input({
      title: "ダンスフェスティバル",
      schedules: [],
      festivalChildren: [
        { id: "child-2", title: "最終日", schedules: [{ startsAt: "2026-10-10T09:00:00.000Z", endsAt: "2026-10-10T10:00:00.000Z", allDay: false, venue: other }] },
        { id: "child-1", title: "初日", schedules: [{ startsAt: "2026-10-03T10:00:00.000Z", endsAt: null, allDay: false, venue }] },
      ],
    }));

    expect(rest).toEqual([]);
    expect(festival.startDate).toBe("2026-10-03T19:00:00+09:00");
    expect(festival.endDate).toBe("2026-10-10T19:00:00+09:00");
    expect((festival.location as { name: string }[]).map((place) => place.name)).toEqual(["神奈川芸術劇場", "森下スタジオ"]);
    expect(festival.subEvent).toEqual([
      { "@type": "Event", name: "最終日", url: "https://p8ce.example/events/child-2", startDate: "2026-10-10T18:00:00+09:00" },
      { "@type": "Event", name: "初日", url: "https://p8ce.example/events/child-1", startDate: "2026-10-03T19:00:00+09:00" },
    ]);
  });

  it("emits nothing for a Festival whose children have no Schedule yet", () => {
    expect(buildEventStructuredData(input({ schedules: [], festivalChildren: [] }))).toEqual([]);
  });
});
