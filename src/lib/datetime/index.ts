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
