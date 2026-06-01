import type { BirthProfile } from "../domain";

export function fortuneDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function birthProfileKey(profile: BirthProfile | null | undefined) {
  if (!profile) return "no-birth";
  return [profile.calendarType, profile.birthDate, profile.birthTime ?? "no-time", profile.gender ?? "unknown"].join(":");
}

export function dailyKernelKey(userId: string, dateKey = fortuneDateKey()) {
  return `fortune:daily:${userId}:${dateKey}`;
}

export function simpleInputHash(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
