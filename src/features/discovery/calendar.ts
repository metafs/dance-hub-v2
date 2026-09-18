import { tokyoDateKey } from "@/lib/datetime";

const monthPattern = /^\d{4}-\d{2}$/;
const dayInMilliseconds = 24 * 60 * 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Calendar arithmetic on `YYYY-MM-DD` strings, done in UTC so that the result
 * never depends on the server's own time zone. The strings are Tokyo calendar
 * days; UTC is only the arithmetic frame.
 */
function dayNumber(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date);
}

function dayString(value: number) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(day: string, days: number) {
  return dayString(dayNumber(day) + days * dayInMilliseconds);
}

/** 0 is Sunday, matching the column order of the rendered grid. */
export function weekdayIndex(day: string) {
  return new Date(dayNumber(day)).getUTCDay();
}

export function addMonths(month: string, months: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const zeroBased = (year * 12) + (monthNumber - 1) + months;
  return `${Math.floor(zeroBased / 12)}-${pad((zeroBased % 12) + 1)}`;
}

export function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${year}年${monthNumber}月`;
}

/**
 * The month a Calendar opens on: the requested one when it is a valid
 * `YYYY-MM`, otherwise the current Tokyo month, so the default view is
 * "what is happening now" in the platform's own time zone.
 */
export function resolveMonth(requested: string | null | undefined, now = new Date()) {
  if (requested && monthPattern.test(requested)) return requested;

  const today = tokyoDateKey(now.toISOString());
  return today ? today.slice(0, 7) : "";
}

export type CalendarGrid = {
  month: string;
  label: string;
  previousMonth: string;
  nextMonth: string;
  firstDay: string;
  lastDay: string;
  weeks: { day: string; inMonth: boolean }[][];
};

/**
 * A Sunday-first grid covering the whole month, padded with the adjacent
 * months' days so every week has seven cells.
 */
export function monthGrid(month: string): CalendarGrid {
  const firstOfMonth = `${month}-01`;
  const nextMonth = addMonths(month, 1);
  const lastOfMonth = addDays(`${nextMonth}-01`, -1);

  const gridStart = addDays(firstOfMonth, -weekdayIndex(firstOfMonth));
  const gridEnd = addDays(lastOfMonth, 6 - weekdayIndex(lastOfMonth));

  const weeks: CalendarGrid["weeks"] = [];
  let cursor = gridStart;

  while (dayNumber(cursor) <= dayNumber(gridEnd)) {
    const week: CalendarGrid["weeks"][number] = [];
    for (let column = 0; column < 7; column += 1) {
      week.push({ day: cursor, inMonth: cursor.startsWith(`${month}-`) });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  return {
    month,
    label: monthLabel(month),
    previousMonth: addMonths(month, -1),
    nextMonth,
    firstDay: firstOfMonth,
    lastDay: lastOfMonth,
    weeks,
  };
}

export const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
