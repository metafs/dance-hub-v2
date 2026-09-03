export function formText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function formRawText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function httpUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function tokyoDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = "00"] = match;
  const [year, month, day, hour, minute, second] = [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    calendarCheck.getUTCFullYear() !== year
    || calendarCheck.getUTCMonth() !== month - 1
    || calendarCheck.getUTCDate() !== day
    || calendarCheck.getUTCHours() !== hour
    || calendarCheck.getUTCMinutes() !== minute
    || calendarCheck.getUTCSeconds() !== second
  ) return null;

  const withSeconds = `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}`;
  const parsed = new Date(`${withSeconds}+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
