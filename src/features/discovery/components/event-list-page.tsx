import Link from "next/link";

import { eventTypeOptions } from "@/features/revisions/schema";

import DiscoveryEventList from "./discovery-event-list";
import { hasActiveFilter, parseDiscoveryFilters, prefectures } from "../filters";
import { prefectureLabel } from "../projection";
import { listPublicEvents } from "../queries";

export default async function EventListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDiscoveryFilters(await searchParams);
  const events = await listPublicEvents(filters);

  return (
    <main className="workspace-main">
      <Link className="back-link" href="/">← DANCE HUB</Link>
      <div className="section-heading">
        <h1>Event</h1>
        <p className="queue-count">{events.length}件</p>
      </div>

      {/*
        A plain GET form keeps the filters in the URL and working without
        client-side JavaScript, which is what makes a filtered view shareable.
      */}
      <form action="/events" className="discovery-filters" method="get">
        <label className="discovery-search">
          キーワード
          {/*
            One box over Event 名, Artist 名, Venue 名 and Organization 名
            (REQ-DISCOVERY-003). Matching happens on the loaded projection, so
            there is nothing to configure per field here (ADR-0020).
          */}
          <input
            defaultValue={filters.text ?? ""}
            maxLength={200}
            name="q"
            placeholder="Event名、出演者、会場、主催"
            type="search"
          />
        </label>
        <label>
          開始日
          <input defaultValue={filters.from ?? ""} name="from" type="date" />
        </label>
        <label>
          終了日
          <input defaultValue={filters.to ?? ""} name="to" type="date" />
        </label>
        <label>
          地域
          <select defaultValue={filters.prefecture ?? ""} name="prefecture">
            <option value="">すべて</option>
            {prefectures.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefectureLabel(prefecture)}
              </option>
            ))}
          </select>
        </label>
        <label>
          種別
          <select defaultValue={filters.eventType ?? ""} name="type">
            <option value="">すべて</option>
            {eventTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button className="button button-primary" type="submit">絞り込む</button>
          {hasActiveFilter(filters) ? (
            <Link className="button button-quiet" href="/events">条件をクリア</Link>
          ) : null}
        </div>
      </form>

      <DiscoveryEventList
        emptyMessage={
          hasActiveFilter(filters)
            ? "この条件に合うEventは見つかりませんでした。"
            : "公開中のEventはまだありません。"
        }
        events={events}
      />
    </main>
  );
}
