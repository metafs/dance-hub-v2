import Link from "next/link";

import { formatTokyoDateTime } from "@/lib/datetime";
import {
  eventPublicationStateLabel,
} from "@/features/events/publication-state";
import {
  prefectureLabel,
  type DiscoveryEventSummary,
} from "@/features/discovery/projection";

/**
 * The shared Event list used by the Artist and Venue detail pages. Past and
 * cancelled Events stay listed with their state (REQ-EVENT-007).
 */
export default function PublicEventList({
  events,
  emptyMessage,
  roleByRevision,
}: {
  events: readonly DiscoveryEventSummary[];
  emptyMessage: string;
  roleByRevision?: ReadonlyMap<string, string>;
}) {
  if (events.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <ul className="public-event-list">
      {events.map((event) => {
        const first = event.schedules[0];
        const role = roleByRevision?.get(event.publishedRevisionId);

        return (
          <li key={event.id}>
            <Link className="text-link" href={`/events/${event.id}`}>{event.title}</Link>
            <p className="event-list-meta">
              {event.typeLabel ? <span>{event.typeLabel}</span> : null}
              {role ? <span>{role}</span> : null}
              {first ? (
                <span>
                  {formatTokyoDateTime(first.startsAt)}（東京時間）
                  {" / "}
                  {first.venueName}（{prefectureLabel(first.prefecture)}）
                </span>
              ) : null}
              {event.state === "published" ? null : (
                <span className="state-badge" data-state={event.state}>
                  {eventPublicationStateLabel(event.state)}
                </span>
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
