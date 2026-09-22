import { describe, expect, it } from "vitest";

import { groupListing, isUpcoming, listingSchedule } from "./listing";
import type { DiscoveryEventSummary, DiscoveryScheduleView } from "./projection";

const now = new Date("2026-09-21T03:00:00.000Z"); // 12:00 in Tokyo

function schedule(startsAt: string, endsAt: string | null = null): DiscoveryScheduleView {
  return {
    startsAt,
    endsAt,
    allDay: false,
    venueId: "venue",
    venueName: "Venue",
    prefecture: "TOKYO",
  };
}

function event(
  id: string,
  overrides: Partial<DiscoveryEventSummary> = {},
): DiscoveryEventSummary {
  return {
    id,
    publishedRevisionId: `${id}-revision`,
    title: id,
    description: null,
    eventType: "performance",
    typeLabel: "公演",
    state: "published",
    organizationName: null,
    applicationDeadline: null,
    parentEventId: null,
    schedules: [],
    artistNames: [],
    ...overrides,
  };
}

describe("groupListing", () => {
  it("lists an upcoming Event once, on the Tokyo day of its next Schedule", () => {
    const run = event("run", {
      schedules: [
        schedule("2026-09-20T10:30:00.000Z", "2026-09-20T11:15:00.000Z"),
        schedule("2026-09-25T10:30:00.000Z"),
        schedule("2026-09-26T10:00:00.000Z"),
      ],
    });

    const listing = groupListing([run], now);

    expect(listing.upcoming).toHaveLength(1);
    expect(listing.upcoming[0].day).toBe("2026-09-25");
    expect(listing.upcoming[0].entries[0].schedule?.startsAt).toBe("2026-09-25T10:30:00.000Z");
    expect(listing.archive).toEqual([]);
  });

  it("uses the Tokyo calendar day, not the UTC one", () => {
    // 16:00 UTC on the 25th is 01:00 on the 26th in Tokyo.
    const late = event("late", { schedules: [schedule("2026-09-25T16:00:00.000Z")] });

    expect(groupListing([late], now).upcoming[0].day).toBe("2026-09-26");
  });

  it("keeps a cancelled Event beside its dates until they pass, then archives it", () => {
    const soon = event("soon", {
      state: "cancelled",
      schedules: [schedule("2026-10-03T09:30:00.000Z")],
    });
    const gone = event("gone", {
      state: "cancelled",
      schedules: [schedule("2026-09-01T09:30:00.000Z")],
    });

    expect(isUpcoming(soon, now)).toBe(true);
    expect(isUpcoming(gone, now)).toBe(false);

    const listing = groupListing([gone, soon], now);
    expect(listing.upcoming.map((day) => day.day)).toEqual(["2026-10-03"]);
    expect(listing.archive.map((day) => day.day)).toEqual(["2026-09-01"]);
  });

  it("orders the archive most recent first and dates a past call by its deadline", () => {
    const older = event("older", { state: "past", schedules: [schedule("2026-05-01T10:00:00.000Z")] });
    const newer = event("newer", { state: "past", schedules: [schedule("2026-08-01T10:00:00.000Z")] });
    const closedCall = event("closed-call", {
      eventType: "open_call",
      state: "past",
      applicationDeadline: "2026-07-01T14:59:00.000Z",
    });

    const listing = groupListing([older, closedCall, newer], now);

    expect(listing.archive.map((day) => day.day)).toEqual([
      "2026-08-01",
      "2026-07-01",
      "2026-05-01",
    ]);
  });

  it("holds published Events without a Schedule apart, by deadline", () => {
    const later = event("later", { eventType: "open_call", applicationDeadline: "2026-10-31T14:59:00.000Z" });
    const sooner = event("sooner", { eventType: "audition", applicationDeadline: "2026-10-05T14:59:00.000Z" });

    const listing = groupListing([later, sooner], now);

    expect(listing.undated.map((item) => item.id)).toEqual(["sooner", "later"]);
    expect(listing.upcoming).toEqual([]);
  });
});

describe("listingSchedule", () => {
  it("falls back to the last Schedule once every Schedule has ended", () => {
    const finished = event("finished", {
      state: "past",
      schedules: [schedule("2026-09-01T10:00:00.000Z"), schedule("2026-09-02T10:00:00.000Z")],
    });

    expect(listingSchedule(finished, now)?.startsAt).toBe("2026-09-02T10:00:00.000Z");
  });
});
