export const TOKYO_TIME_ZONE = "Asia/Tokyo";

export function formatTokyoDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TOKYO_TIME_ZONE,
  }).format(new Date(value));
}

export function toTokyoDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function tokyoDateTime(value: string) {
  if (!value) return null;

  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const parsed = new Date(`${withSeconds}+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

const tokyoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const dayInMilliseconds = 24 * 60 * 60 * 1000;

/**
 * The Tokyo calendar day an instant falls on, as `YYYY-MM-DD`. Date-only and
 * all-day Schedules use this boundary rather than the UTC day (REQ-EVENT-003).
 */
export function tokyoDateKey(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

/** The instant a `YYYY-MM-DD` Tokyo calendar day starts. */
export function tokyoDayStart(date: string) {
  if (!tokyoDatePattern.test(date)) return null;

  const parsed = new Date(`${date}T00:00:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * The instant the next Tokyo calendar day starts, for use as an exclusive upper
 * bound in date-range filters. Japan observes no daylight saving time, so the
 * day is always exactly 24 hours long.
 */
export function tokyoDayEndExclusive(date: string) {
  const start = tokyoDayStart(date);
  if (!start) return null;

  return new Date(new Date(start).getTime() + dayInMilliseconds).toISOString();
}

const weekdayNames = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"] as const;

function isValidInstant(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

/** `HH:mm` of an instant on the Tokyo clock, or an empty string. */
export function formatTokyoTime(value: string) {
  if (!isValidInstant(value)) return "";
  return toTokyoDateTimeLocal(value).slice(11, 16);
}

/** `YYYY.MM.DD` of the Tokyo calendar day an instant falls on. */
export function formatTokyoDate(value: string) {
  const day = tokyoDateKey(value);
  return day ? day.replaceAll("-", ".") : "";
}

export type DayLabel = {
  year: number;
  /** `9.25`: the month unpadded, the day padded, as listings set dates. */
  monthDay: string;
  weekday: string;
};

/** The parts a listing shows for a `YYYY-MM-DD` Tokyo calendar day. */
export function dayLabel(day: string): DayLabel | null {
  if (!tokyoDatePattern.test(day)) return null;

  const [year, month, date] = day.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay();
  if (Number.isNaN(weekday)) return null;

  return {
    year,
    monthDay: `${month}.${String(date).padStart(2, "0")}`,
    weekday: weekdayNames[weekday],
  };
}
