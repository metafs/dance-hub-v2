import { scheduleEndInstant } from "@/features/events/publication-state";
import { tokyoDateKey } from "@/lib/datetime";

import type { DiscoveryEventSummary, DiscoveryScheduleView } from "./projection";

export type ListingEntry = {
  event: DiscoveryEventSummary;
  /** The Schedule the Event is listed under, or null for an undated Event. */
  schedule: DiscoveryScheduleView | null;
};

export type ListingDay = { day: string; entries: ListingEntry[] };

export type DiscoveryListing = {
  /** Events still to come, on the Tokyo day of their next Schedule. */
  upcoming: ListingDay[];
  /** Published Events with no Schedule, such as an open call (REQ-EVENT-003). */
  undated: DiscoveryEventSummary[];
  /** Finished and cancelled Events, most recent day first (REQ-EVENT-007). */
  archive: ListingDay[];
};

function hasEnded(schedule: DiscoveryScheduleView, now: Date) {
  const end = scheduleEndInstant({
    starts_at: schedule.startsAt,
    ends_at: schedule.endsAt,
    all_day: schedule.allDay,
  });
  return end ? new Date(end).getTime() <= now.getTime() : false;
}

/**
 * The Schedule a listing places an Event on: its first Schedule that has not
 * ended, or its last one once they all have. A run of performances therefore
 * moves forward through the listing as its earlier dates pass.
 */
export function listingSchedule(
  event: DiscoveryEventSummary,
  now: Date = new Date(),
): DiscoveryScheduleView | null {
  if (event.schedules.length === 0) return null;
  return event.schedules.find((schedule) => !hasEnded(schedule, now))
    ?? event.schedules[event.schedules.length - 1];
}

/**
 * A cancelled Event stays beside the Events of its dates until they pass, so a
 * Visitor looking at that day sees that it will not happen (REQ-EVENT-007).
 */
export function isUpcoming(event: DiscoveryEventSummary, now: Date = new Date()) {
  if (event.state === "past") return false;
  if (event.state === "published") return true;
  if (event.schedules.length > 0) {
    return event.schedules.some((schedule) => !hasEnded(schedule, now));
  }
  return event.applicationDeadline
    ? new Date(event.applicationDeadline).getTime() > now.getTime()
    : false;
}

function pushEntry(days: Map<string, ListingEntry[]>, day: string, entry: ListingEntry) {
  const entries = days.get(day) ?? [];
  entries.push(entry);
  days.set(day, entries);
}

function startOf(entry: ListingEntry) {
  return entry.schedule?.startsAt ?? entry.event.applicationDeadline ?? "";
}

/**
 * Splits discovery results into the parts the listing shows. Each Event is
 * listed exactly once, under one day, so a filtered count stays a count of
 * Events rather than of Schedules.
 */
export function groupListing(
  events: readonly DiscoveryEventSummary[],
  now: Date = new Date(),
): DiscoveryListing {
  const upcoming = new Map<string, ListingEntry[]>();
  const archive = new Map<string, ListingEntry[]>();
  const undated: DiscoveryEventSummary[] = [];

  for (const event of events) {
    const schedule = listingSchedule(event, now);

    if (isUpcoming(event, now)) {
      const day = schedule ? tokyoDateKey(schedule.startsAt) : null;
      if (day) pushEntry(upcoming, day, { event, schedule });
      else undated.push(event);
      continue;
    }

    const instant = schedule?.startsAt ?? event.applicationDeadline;
    pushEntry(archive, (instant && tokyoDateKey(instant)) || "", { event, schedule });
  }

  const byStart = (left: ListingEntry, right: ListingEntry) =>
    startOf(left).localeCompare(startOf(right))
    || left.event.title.localeCompare(right.event.title, "ja");

  return {
    upcoming: [...upcoming.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([day, entries]) => ({ day, entries: entries.sort(byStart) })),
    undated: undated.sort((left, right) =>
      (left.applicationDeadline ?? "").localeCompare(right.applicationDeadline ?? "")
      || left.title.localeCompare(right.title, "ja")),
    archive: [...archive.entries()]
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([day, entries]) => ({ day, entries: entries.sort(byStart) })),
  };
}
