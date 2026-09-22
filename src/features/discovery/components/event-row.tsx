import Link from "next/link";
import type { ReactNode } from "react";

import { eventPublicationStateLabel, type EventPublicationState } from "@/features/events/publication-state";
import { dayLabel, formatTokyoTime, tokyoDateKey } from "@/lib/datetime";
import { ListRow } from "@/ui/list-row";
import { StateLabel } from "@/ui/state-label";

import { prefectureLabel, type DiscoveryEventSummary, type DiscoveryScheduleView } from "../projection";

/** 中止 and 終了 as labels; a published Event carries none. */
export function PublicationStateLabel({ state }: { state: EventPublicationState }) {
  if (state === "published") return null;
  return (
    <StateLabel tone={state === "cancelled" ? "outline" : "quiet"}>
      {eventPublicationStateLabel(state)}
    </StateLabel>
  );
}

export function scheduleTime(schedule: DiscoveryScheduleView | null) {
  if (!schedule) return "—";
  return schedule.allDay ? "終日" : formatTokyoTime(schedule.startsAt);
}

/** `9.25`, the way a listing sets the Tokyo day of an instant. */
export function monthDay(instant: string | null) {
  const day = instant ? tokyoDateKey(instant) : null;
  return (day && dayLabel(day)?.monthDay) || "";
}

/** `10.10 – 10.18`, the run of a Festival derived from its children (ADR-0009). */
export function festivalRun(event: DiscoveryEventSummary) {
  const first = event.schedules[0]?.startsAt ?? null;
  const last = event.schedules[event.schedules.length - 1]?.startsAt ?? null;
  const start = monthDay(first);
  const end = monthDay(last);
  return start && end && start !== end ? `${start} – ${end}` : start;
}

/** The credited Artists, or the organizer when nobody is credited. */
export function eventDetailLine(event: DiscoveryEventSummary) {
  if (event.eventType === "festival") {
    const run = festivalRun(event);
    return [run ? `会期　${run}` : null, event.organizationName ? `主催　${event.organizationName}` : null]
      .filter(Boolean)
      .join(" · ") || null;
  }
  if (event.artistNames.length) return `出演　${event.artistNames.join("、")}`;
  return event.organizationName ? `主催　${event.organizationName}` : null;
}

function venueLine(event: DiscoveryEventSummary, schedule: DiscoveryScheduleView | null) {
  if (!schedule) return { venue: null, area: null };

  const venueIds = new Set(event.schedules.map((item) => item.venueId));
  const prefectures = [...new Set(event.schedules.map((item) => prefectureLabel(item.prefecture)))];
  const others = venueIds.size - 1;

  return {
    venue: (
      <Link href={`/venues/${schedule.venueId}`}>{schedule.venueName}</Link>
    ),
    area: others > 0 ? `${prefectures.join("・")} · ほか${others}会場` : prefectures.join("・"),
  };
}

/**
 * One Event in a listing. The title links to the Event and the venue to its
 * Venue page, so every name in the row leads somewhere (G-002).
 */
export function EventRow({
  event,
  schedule,
  lead,
  detail,
  showVenue = true,
  aside,
}: {
  event: DiscoveryEventSummary;
  schedule: DiscoveryScheduleView | null;
  lead?: ReactNode;
  detail?: ReactNode;
  showVenue?: boolean;
  aside?: ReactNode;
}) {
  const place = showVenue ? venueLine(event, schedule) : { venue: null, area: null };

  return (
    <ListRow
      aside={aside ?? place.venue}
      asideSub={aside ? undefined : place.area}
      detail={detail === undefined ? eventDetailLine(event) : detail}
      kind={event.typeLabel}
      labels={<PublicationStateLabel state={event.state} />}
      lead={lead ?? (event.eventType === "festival" ? "会期" : scheduleTime(schedule))}
      title={<Link className="row-title" href={`/events/${event.id}`}>{event.title}</Link>}
    />
  );
}
