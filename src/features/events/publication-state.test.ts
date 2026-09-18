import { describe, expect, it } from "vitest";

import {
  eventPublicationState,
  eventPublicationStateLabel,
  scheduleEndInstant,
} from "./publication-state";

const now = new Date("2026-04-10T03:00:00.000Z"); // 2026-04-10 12:00 in Tokyo

function schedule(
  starts_at: string,
  ends_at: string | null = null,
  all_day = false,
) {
  return { starts_at, ends_at, all_day };
}

describe("scheduleEndInstant", () => {
  it("uses the explicit end of a timed Schedule", () => {
    expect(scheduleEndInstant(schedule("2026-04-01T10:00:00.000Z", "2026-04-01T12:00:00.000Z")))
      .toBe("2026-04-01T12:00:00.000Z");
  });

  it("falls back to the start when a timed Schedule has no end", () => {
    expect(scheduleEndInstant(schedule("2026-04-01T10:00:00.000Z")))
      .toBe("2026-04-01T10:00:00.000Z");
  });

  it("runs an all-day Schedule to the end of its Tokyo calendar day", () => {
    // 2026-04-01T00:00+09:00 is 2026-03-31T15:00Z; the day ends 24h later.
    expect(scheduleEndInstant(schedule("2026-03-31T15:00:00.000Z", null, true)))
      .toBe("2026-04-01T15:00:00.000Z");
  });
});

describe("eventPublicationState", () => {
  it("reports a cancelled Event as cancelled even when its dates are still ahead", () => {
    const state = eventPublicationState({
      eventType: "performance",
      cancelledAt: "2026-04-05T00:00:00.000Z",
      applicationDeadline: null,
      schedules: [schedule("2026-05-01T10:00:00.000Z")],
    }, now);

    expect(state).toBe("cancelled");
  });

  it("marks a non-apply Event past only once every Schedule has ended", () => {
    const partlyPast = eventPublicationState({
      eventType: "performance",
      cancelledAt: null,
      applicationDeadline: null,
      schedules: [
        schedule("2026-04-01T10:00:00.000Z", "2026-04-01T12:00:00.000Z"),
        schedule("2026-05-01T10:00:00.000Z", "2026-05-01T12:00:00.000Z"),
      ],
    }, now);
    const allPast = eventPublicationState({
      eventType: "performance",
      cancelledAt: null,
      applicationDeadline: null,
      schedules: [
        schedule("2026-04-01T10:00:00.000Z", "2026-04-01T12:00:00.000Z"),
        schedule("2026-04-02T10:00:00.000Z", "2026-04-02T12:00:00.000Z"),
      ],
    }, now);

    expect(partlyPast).toBe("published");
    expect(allPast).toBe("past");
  });

  it("uses the application deadline for apply Events and ignores Schedules", () => {
    const open = eventPublicationState({
      eventType: "open_call",
      cancelledAt: null,
      applicationDeadline: "2026-05-01T00:00:00.000Z",
      schedules: [],
    }, now);
    const closed = eventPublicationState({
      eventType: "open_call",
      cancelledAt: null,
      applicationDeadline: "2026-04-01T00:00:00.000Z",
      schedules: [schedule("2026-12-01T10:00:00.000Z")],
    }, now);

    expect(open).toBe("published");
    expect(closed).toBe("past");
  });

  it("keeps a Schedule-free apply Event published while its deadline is unknown", () => {
    const state = eventPublicationState({
      eventType: "residency",
      cancelledAt: null,
      applicationDeadline: null,
      schedules: [],
    }, now);

    expect(state).toBe("published");
  });

  it("derives a Festival from the child Schedules it is given", () => {
    const ongoing = eventPublicationState({
      eventType: "festival",
      cancelledAt: null,
      applicationDeadline: null,
      schedules: [schedule("2026-04-20T10:00:00.000Z", "2026-04-20T12:00:00.000Z")],
    }, now);
    const finished = eventPublicationState({
      eventType: "festival",
      cancelledAt: null,
      applicationDeadline: null,
      schedules: [schedule("2026-04-01T10:00:00.000Z", "2026-04-02T12:00:00.000Z")],
    }, now);

    expect(ongoing).toBe("published");
    expect(finished).toBe("past");
  });

  it("holds an all-day Schedule current until the Tokyo day is over", () => {
    // Tokyo is already 2026-04-10 12:00, so an all-day Schedule on that date
    // has not ended yet even though its start instant is in the past.
    const today = eventPublicationState({
      eventType: "performance",
      cancelledAt: null,
      applicationDeadline: null,
      schedules: [schedule("2026-04-09T15:00:00.000Z", null, true)],
    }, now);
    const yesterday = eventPublicationState({
      eventType: "performance",
      cancelledAt: null,
      applicationDeadline: null,
      schedules: [schedule("2026-04-08T15:00:00.000Z", null, true)],
    }, now);

    expect(today).toBe("published");
    expect(yesterday).toBe("past");
  });
});

describe("eventPublicationStateLabel", () => {
  it("labels each state in Japanese", () => {
    expect(eventPublicationStateLabel("cancelled")).toBe("中止");
    expect(eventPublicationStateLabel("past")).toBe("終了");
    expect(eventPublicationStateLabel("published")).toBe("公開中");
  });
});
