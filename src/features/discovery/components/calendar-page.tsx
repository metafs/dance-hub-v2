import Link from "next/link";

import { eventTypeOptions } from "@/features/revisions/schema";
import { dayLabel, tokyoDateKey } from "@/lib/datetime";

import { monthGrid, resolveMonth, weekdayLabels } from "../calendar";
import { parseDiscoveryFilters, prefectures } from "../filters";
import { prefectureLabel } from "../projection";
import { listCalendarDays } from "../queries";
import { scheduleTime } from "./event-row";

function monthHref(month: string, query: URLSearchParams) {
  const params = new URLSearchParams(query);
  params.set("month", month);
  return `/calendar?${params.toString()}`;
}

/** `8月`, or `2025年12月` when the neighbouring month is in another year. */
function neighbourLabel(month: string, current: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return month.slice(0, 4) === current.slice(0, 4) ? `${monthNumber}月` : `${year}年${monthNumber}月`;
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
  const today = tokyoDateKey(new Date().toISOString());

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
    <div className="container">
      <div className="page-head">
        <div className="calendar-toolbar">
          <div className="calendar-month-nav">
            <Link
              className="button button-quiet button-small"
              href={monthHref(grid.previousMonth, navigationQuery)}
            >
              ← {neighbourLabel(grid.previousMonth, month)}
            </Link>
            <h1>{grid.label}</h1>
            <Link
              className="button button-quiet button-small"
              href={monthHref(grid.nextMonth, navigationQuery)}
            >
              {neighbourLabel(grid.nextMonth, month)} →
            </Link>
          </div>
          <p className="section-note">開催日で並べています。応募締切は含みません。日時は日本時間です。</p>
        </div>

        <form action="/calendar" className="calendar-filters" method="get">
          <input name="month" type="hidden" value={month} />
          <div className="field">
            <label className="filter-label" htmlFor="calendar-prefecture">地域</label>
            <select defaultValue={filters.prefecture ?? ""} id="calendar-prefecture" name="prefecture">
              <option value="">すべて</option>
              {prefectures.map((prefecture) => (
                <option key={prefecture} value={prefecture}>{prefectureLabel(prefecture)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="filter-label" htmlFor="calendar-type">種別</label>
            <select defaultValue={filters.eventType ?? ""} id="calendar-type" name="type">
              <option value="">すべて</option>
              {eventTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button className="button" type="submit">絞り込む</button>
        </form>
      </div>

      {/*
        One table serves every width: on a narrow screen the stylesheet turns
        it into a list of the days that have Events, so no Event is rendered
        twice.
      */}
      <table className="calendar">
        <caption className="visually-hidden">{grid.label}のEvent（日本時間）</caption>
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
                const label = dayLabel(cell.day);

                return (
                  <td
                    aria-current={cell.day === today ? "date" : undefined}
                    data-empty={events.length === 0}
                    data-in-month={cell.inMonth}
                    key={cell.day}
                  >
                    <p className="calendar-day">
                      <span>{label ? (cell.day === today ? `${Number(cell.day.slice(-2))}（今日）` : Number(cell.day.slice(-2))) : ""}</span>
                      <span className="calendar-day-weekday">{label?.weekday}</span>
                    </p>
                    {events.length ? (
                      <ul className="calendar-events">
                        {events.map((event) => {
                          const schedule = event.schedules.find(
                            (item) => tokyoDateKey(item.startsAt) === cell.day,
                          ) ?? null;

                          return (
                            <li key={event.id}>
                              <Link href={`/events/${event.id}`}>{event.title}</Link>
                              <span className="calendar-event-meta">
                                {[scheduleTime(schedule), event.typeLabel, event.state === "cancelled" ? "中止" : null]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </li>
                          );
                        })}
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
  );
}
