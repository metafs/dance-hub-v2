import Link from "next/link";

import { eventTypeOptions } from "@/features/revisions/schema";

import { monthGrid, resolveMonth, weekdayLabels } from "../calendar";
import { parseDiscoveryFilters, prefectures } from "../filters";
import { prefectureLabel } from "../projection";
import { listCalendarDays } from "../queries";

function monthHref(month: string, query: URLSearchParams) {
  const params = new URLSearchParams(query);
  params.set("month", month);
  return `/calendar?${params.toString()}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedMonth = Array.isArray(params.month) ? params.month[0] : params.month;
  const month = resolveMonth(requestedMonth);
  const grid = monthGrid(month);

  // The Calendar covers Schedule dates only, so the month bounds become the
  // date filter and application deadlines never appear (REQ-DISCOVERY-001).
  const filters = parseDiscoveryFilters(params);
  const days = await listCalendarDays({
    ...filters,
    from: grid.firstDay,
    to: grid.lastDay,
  });

  const eventsByDay = new Map(days.map((entry) => [entry.day, entry.events]));
  const navigationQuery = new URLSearchParams();
  if (filters.prefecture) navigationQuery.set("prefecture", filters.prefecture);
  if (filters.eventType) navigationQuery.set("type", filters.eventType);

  return (
    <main className="workspace-main">
      <Link className="back-link" href="/">← DANCE HUB</Link>
      <div className="section-heading">
        <h1>Calendar</h1>
        <div className="button-row">
          <Link
            className="button button-quiet"
            href={monthHref(grid.previousMonth, navigationQuery)}
          >
            ← {grid.previousMonth}
          </Link>
          <Link
            className="button button-quiet"
            href={monthHref(grid.nextMonth, navigationQuery)}
          >
            {grid.nextMonth} →
          </Link>
        </div>
      </div>

      <form action="/calendar" className="discovery-filters" method="get">
        <input name="month" type="hidden" value={month} />
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
        </div>
      </form>

      <div className="table-wrap">
        <table className="calendar-grid">
          <caption className="calendar-caption">{grid.label}（東京時間）</caption>
          <thead>
            <tr>
              {weekdayLabels.map((weekday) => <th key={weekday} scope="col">{weekday}</th>)}
            </tr>
          </thead>
          <tbody>
            {grid.weeks.map((week) => (
              <tr key={week[0].day}>
                {week.map((cell) => {
                  const events = eventsByDay.get(cell.day) ?? [];

                  return (
                    <td
                      className="calendar-cell"
                      data-in-month={cell.inMonth}
                      key={cell.day}
                    >
                      <p className="calendar-day-number">
                        {Number(cell.day.slice(-2))}
                      </p>
                      {events.length ? (
                        <ul className="calendar-day-events">
                          {events.map((event) => (
                            <li key={event.id}>
                              <Link className="text-link" href={`/events/${event.id}`}>
                                {event.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
