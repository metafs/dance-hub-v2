import Link from "next/link";

import { formatTokyoDateTime } from "@/lib/datetime";
import { eventPublicationStateLabel } from "@/features/events/publication-state";

import { prefectureLabel, type DiscoveryEventSummary } from "../projection";

function scheduleRange(event: DiscoveryEventSummary) {
  const [first] = event.schedules;
  if (!first) return null;

  const last = event.schedules[event.schedules.length - 1];
  const start = formatTokyoDateTime(first.startsAt);

  if (event.schedules.length === 1) return `${start}（東京時間）`;
  return `${start} — ${formatTokyoDateTime(last.startsAt)}（東京時間）`;
}

function venueSummary(event: DiscoveryEventSummary) {
  const venues = [...new Set(event.schedules.map((schedule) => schedule.venueName))];
  if (venues.length === 0) return null;

  const prefecturesUsed = [
    ...new Set(event.schedules.map((schedule) => prefectureLabel(schedule.prefecture))),
  ];
  const name = venues.length === 1 ? venues[0] : `${venues[0]} ほか${venues.length - 1}会場`;

  return `${name}（${prefecturesUsed.join("・")}）`;
}

/**
 * The Event list used by the discovery views. Past and cancelled Events stay
 * listed and carry their state (REQ-EVENT-001, REQ-EVENT-007).
 */
export default function DiscoveryEventList({
  events,
  emptyMessage,
}: {
  events: readonly DiscoveryEventSummary[];
  emptyMessage: string;
}) {
  if (events.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <ul className="discovery-list">
      {events.map((event) => {
        const range = scheduleRange(event);
        const venue = venueSummary(event);

        return (
          <li className="discovery-card" key={event.id}>
            <p className="eyebrow">
              {event.typeLabel}
              {event.state === "published" ? null : (
                <span className="state-badge" data-state={event.state}>
                  {eventPublicationStateLabel(event.state)}
                </span>
              )}
            </p>
            <h3>
              <Link href={`/events/${event.id}`}>{event.title}</Link>
            </h3>
            <dl className="discovery-meta">
              {range ? (
                <div>
                  <dt>日程</dt>
                  <dd>{range}</dd>
                </div>
              ) : null}
              {venue ? (
                <div>
                  <dt>会場</dt>
                  <dd>{venue}</dd>
                </div>
              ) : null}
              {event.applicationDeadline ? (
                <div>
                  <dt>応募締切</dt>
                  <dd>{formatTokyoDateTime(event.applicationDeadline)}（東京時間）</dd>
                </div>
              ) : null}
              {event.organizationName ? (
                <div>
                  <dt>主催</dt>
                  <dd>{event.organizationName}</dd>
                </div>
              ) : null}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
