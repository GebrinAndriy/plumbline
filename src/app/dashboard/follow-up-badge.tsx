import { followUpStatus, type CalendarDay } from "@/domain/leads/follow-up";
import { formatDay } from "@/lib/calendar-day";

const STYLES = {
  overdue: "bg-error-soft text-error",
  today: "bg-accent-soft text-accent-hover",
  upcoming: "bg-disabled text-muted",
} as const;

export function FollowUpBadge({ on, today }: { on: CalendarDay; today: CalendarDay }) {
  const status = followUpStatus(on, today);
  const text = status === "today" ? "Call back today" : status === "overdue" ? `Overdue · ${formatDay(on)}` : `Follow up ${formatDay(on)}`;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STYLES[status]}`}>
      <time dateTime={on}>{text}</time>
    </span>
  );
}
