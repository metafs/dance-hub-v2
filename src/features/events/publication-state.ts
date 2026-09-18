import { tokyoDateKey, tokyoDayEndExclusive } from "@/lib/datetime";
import { isApplyEventType, type EventType } from "@/features/revisions/schema";

export type EventPublicationState = "cancelled" | "past" | "published";

export type PublicScheduleBoundary = {
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
};

/**
 * The instant a Schedule stops being current. An all-day Schedule runs to the
 * end of its Tokyo calendar day rather than to its start instant
 * (REQ-EVENT-003); a timed Schedule without an explicit end is treated as
 * ending when it starts.
 */
export function scheduleEndInstant(schedule: PublicScheduleBoundary) {
  if (schedule.all_day) {
    const day = tokyoDateKey(schedule.ends_at ?? schedule.starts_at);
    return day ? tokyoDayEndExclusive(day) : null;
  }

  return schedule.ends_at ?? schedule.starts_at;
}

/**
 * Past determination branches by Event Type group (REQ-EVENT-007, ADR-0008):
 * `apply` Events are past once the application deadline passes, and every
 * other Event once all of its Schedules have ended. Cancelled Events stay
 * public and are reported as cancelled rather than past.
 *
 * A Festival derives its dates from its child Events, so the caller passes the
 * children's Schedules. With no Schedules and no deadline the state stays
 * `published`, which is the correct answer for a published `apply` Event whose
 * execution date is undetermined.
 */
export function eventPublicationState(
  event: {
    eventType: EventType | null;
    cancelledAt: string | null;
    applicationDeadline: string | null;
    schedules: readonly PublicScheduleBoundary[];
  },
  now: Date = new Date(),
): EventPublicationState {
  if (event.cancelledAt) return "cancelled";

  const instant = now.getTime();

  if (event.eventType && isApplyEventType(event.eventType)) {
    if (!event.applicationDeadline) return "published";
    const deadline = new Date(event.applicationDeadline).getTime();
    return Number.isNaN(deadline) || deadline > instant ? "published" : "past";
  }

  if (event.schedules.length === 0) return "published";

  const ends = event.schedules.map(scheduleEndInstant);
  if (ends.some((end) => end === null)) return "published";

  return ends.every((end) => new Date(end as string).getTime() <= instant)
    ? "past"
    : "published";
}

export function eventPublicationStateLabel(state: EventPublicationState) {
  if (state === "cancelled") return "中止";
  return state === "past" ? "終了" : "公開中";
}
