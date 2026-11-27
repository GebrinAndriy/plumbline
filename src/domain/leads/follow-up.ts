// A follow-up is a calendar day ("2026-11-28"), not a moment: "call back on Thursday" has no hour.
export type CalendarDay = string;

export type FollowUpStatus = "overdue" | "today" | "upcoming";

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isCalendarDay(text: string): boolean {
  const match = DAY.exec(text);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects 2026-02-30, which Date would quietly roll over into March.
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// ISO days sort as text, so no time zone arithmetic is needed once "today" is known.
export function followUpStatus(on: CalendarDay, today: CalendarDay): FollowUpStatus {
  if (on < today) return "overdue";
  return on === today ? "today" : "upcoming";
}

export function addDays(day: CalendarDay, days: number): CalendarDay {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10);
}
