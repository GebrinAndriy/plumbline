import type { CalendarDay } from "@/domain/leads/follow-up";
import { MARKET } from "./market";

// en-CA formats as YYYY-MM-DD; the time zone makes "today" Dublin's today, not the server's (UTC on Vercel).
const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: MARKET.timeZone, year: "numeric", month: "2-digit", day: "2-digit" });

export function todayInMarket(now: Date = new Date()): CalendarDay {
  return isoDay.format(now);
}

const shortDay = new Intl.DateTimeFormat(MARKET.locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

// "Thu 28 Nov"; read at noon UTC so no time zone can shift it to the day before.
export function formatDay(day: CalendarDay): string {
  return shortDay.format(new Date(`${day}T12:00:00Z`)).replace(",", "");
}
