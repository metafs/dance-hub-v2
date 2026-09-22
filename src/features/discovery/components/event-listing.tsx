import { dayLabel, tokyoDateKey } from "@/lib/datetime";
import { DayGroup, DayGroups } from "@/ui/day-group";
import { EmptyState } from "@/ui/empty-state";
import { RowList } from "@/ui/list-row";

import { groupListing, type ListingDay } from "../listing";
import type { DiscoveryEventSummary } from "../projection";
import { EventRow, monthDay } from "./event-row";

function DayList({
  days,
  compact = false,
  currentYear,
}: {
  days: readonly ListingDay[];
  compact?: boolean;
  currentYear: number;
}) {
  return (
    <DayGroups compact={compact}>
      {days.map(({ day, entries }) => {
        const label = dayLabel(day);
        const sub = label
          ? label.year === currentYear ? label.weekday : `${label.year}年 · ${label.weekday}`
          : undefined;

        return (
          <DayGroup date={label?.monthDay ?? "日付なし"} key={day || "none"} sub={sub}>
            <RowList>
              {entries.map(({ event, schedule }) => (
                <EventRow event={event} key={event.id} schedule={schedule} />
              ))}
            </RowList>
          </DayGroup>
        );
      })}
    </DayGroups>
  );
}

/**
 * The Event listing shared by the home page and 探す: upcoming Events under
 * the day of their next Schedule, undated calls apart, and the archive of
 * finished and cancelled Events last (REQ-EVENT-001, REQ-EVENT-007).
 */
export function EventListing({
  events,
  emptyMessage,
  showArchive = true,
  compact = false,
  limit,
  now = new Date(),
}: {
  events: readonly DiscoveryEventSummary[];
  emptyMessage: string;
  showArchive?: boolean;
  /** A narrower date column, for a listing beside the filters. */
  compact?: boolean;
  /** Caps the upcoming part, for the home page. */
  limit?: number;
  now?: Date;
}) {
  const listing = groupListing(events, now);
  const currentYear = Number(tokyoDateKey(now.toISOString())?.slice(0, 4));

  let remaining = limit ?? Number.POSITIVE_INFINITY;
  const upcoming: ListingDay[] = [];
  for (const day of listing.upcoming) {
    if (remaining <= 0) break;
    upcoming.push({ day: day.day, entries: day.entries.slice(0, remaining) });
    remaining -= day.entries.length;
  }

  const undated = limit ? [] : listing.undated;
  const archive = showArchive ? listing.archive : [];

  if (!upcoming.length && !undated.length && !archive.length) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <>
      {upcoming.length ? <DayList compact={compact} currentYear={currentYear} days={upcoming} /> : null}
      {undated.length ? (
        <>
          <h2 className="discovery-part-title">日程の決まっていないもの</h2>
          <RowList bordered variant="lead-wide">
            {undated.map((event) => (
              <EventRow
                event={event}
                key={event.id}
                lead={event.applicationDeadline ? `締切 ${monthDay(event.applicationDeadline)}` : "—"}
                schedule={null}
              />
            ))}
          </RowList>
        </>
      ) : null}
      {archive.length ? (
        <>
          <h2 className="discovery-part-title">終わった上演・中止</h2>
          <DayList compact currentYear={currentYear} days={archive} />
        </>
      ) : null}
    </>
  );
}
