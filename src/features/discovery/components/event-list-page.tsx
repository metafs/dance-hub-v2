import Link from "next/link";

import { eventTypeLabel } from "@/features/revisions/schema";

import { hasActiveFilter, parseDiscoveryFilters } from "../filters";
import { prefectureLabel, type DiscoveryFilters } from "../projection";
import { listPublicEvents } from "../queries";
import { DiscoveryFilterForm } from "./discovery-filters";
import { EventListing } from "./event-listing";

function filterSummary(filters: DiscoveryFilters) {
  const parts: string[] = [];
  if (filters.text) parts.push(`「${filters.text}」`);
  if (filters.from || filters.to) {
    parts.push(`${(filters.from ?? "").replaceAll("-", ".")}〜${(filters.to ?? "").replaceAll("-", ".")}`);
  }
  if (filters.prefecture) parts.push(prefectureLabel(filters.prefecture));
  if (filters.eventType) parts.push(eventTypeLabel(filters.eventType));
  return parts.join(" · ");
}

export default async function EventListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDiscoveryFilters(await searchParams);
  const events = await listPublicEvents(filters);
  const active = hasActiveFilter(filters);

  return (
    <div className="container discovery-layout">
      <DiscoveryFilterForm filters={filters} />

      <div>
        <div className="discovery-results-head">
          <h1>探す</h1>
          <div className="discovery-summary">
            {active ? <span>{filterSummary(filters)}</span> : null}
            <span className="tabular">{events.length}件</span>
            {active ? <Link className="text-link" href="/events">条件をクリア</Link> : null}
          </div>
        </div>
        <p className="section-note">日時はすべて日本時間です。</p>

        <EventListing
          compact
          emptyMessage={
            active
              ? "この条件に合うEventは見つかりませんでした。"
              : "公開中のEventはまだありません。"
          }
          events={events}
        />
      </div>
    </div>
  );
}
