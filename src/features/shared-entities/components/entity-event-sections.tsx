import { EventRow, monthDay } from "@/features/discovery/components/event-row";
import { isUpcoming, listingSchedule } from "@/features/discovery/listing";
import type { DiscoveryEventSummary } from "@/features/discovery/projection";
import { tokyoDateKey } from "@/lib/datetime";
import { EmptyState } from "@/ui/empty-state";
import { RowList } from "@/ui/list-row";
import { Section } from "@/ui/section";

/**
 * The Events an Artist or Venue relates to, split into what is still to come
 * and a record by year. Past and cancelled Events stay listed (REQ-EVENT-007).
 */
export function EntityEventSections({
  events,
  detailFor,
  showVenue,
  idPrefix,
}: {
  events: readonly DiscoveryEventSummary[];
  /** The line under each title: the Artist's role, or the credits. */
  detailFor?: (event: DiscoveryEventSummary) => string | null;
  showVenue: boolean;
  idPrefix: string;
}) {
  const now = new Date();
  const entries = events.map((event) => ({ event, schedule: listingSchedule(event, now) }));
  const dateOf = (entry: (typeof entries)[number]) =>
    entry.schedule?.startsAt ?? entry.event.applicationDeadline ?? "";

  const upcoming = entries
    .filter((entry) => isUpcoming(entry.event, now))
    .sort((left, right) => dateOf(left).localeCompare(dateOf(right)));
  const past = entries
    .filter((entry) => !isUpcoming(entry.event, now))
    .sort((left, right) => dateOf(right).localeCompare(dateOf(left)));

  const years = new Map<string, typeof past>();
  for (const entry of past) {
    const date = dateOf(entry);
    const year = (date && tokyoDateKey(date)?.slice(0, 4)) || "日付なし";
    years.set(year, [...(years.get(year) ?? []), entry]);
  }

  const row = (entry: (typeof entries)[number]) => (
    <EventRow
      detail={detailFor ? detailFor(entry.event) : undefined}
      event={entry.event}
      key={entry.event.id}
      lead={monthDay(dateOf(entry) || null) || "—"}
      schedule={entry.schedule}
      showVenue={showVenue}
    />
  );

  if (events.length === 0) {
    return <EmptyState>公開中のEventはまだありません。</EmptyState>;
  }

  return (
    <>
      <Section id={`${idPrefix}-upcoming`} title="これから">
        {upcoming.length ? (
          <RowList bordered variant="compact">{upcoming.map(row)}</RowList>
        ) : (
          <EmptyState>予定されている上演はありません。</EmptyState>
        )}
      </Section>
      {past.length ? (
        <Section id={`${idPrefix}-past`} title="これまで">
          <div>
            {[...years.entries()].map(([year, yearEntries]) => (
              <div className="year-group" key={year}>
                <span className="year-group-label">{year}</span>
                <RowList>{yearEntries.map(row)}</RowList>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
