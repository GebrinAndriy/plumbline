import Link from "next/link";
import { statusLabel } from "@/components/status-badge";
import type { StatusTotals } from "@/domain/leads/lead";
import { LEAD_STATUSES, type LeadStatus } from "@/domain/leads/lead-status";
import { formatMoney } from "@/lib/format-money";
import { leadListHref } from "./lead-list-query";

export function LeadStats({ totals }: { totals: StatusTotals }) {
  const inProgress = totals.contacted.count + totals.quoted.count;
  const stats = [
    { label: "New requests", value: String(totals.new.count), note: "Call them back first" },
    { label: "In progress", value: String(inProgress), note: `${formatMoney(totals.contacted.total + totals.quoted.total)} in quotes` },
    { label: "Value of won jobs", value: formatMoney(totals.won.total), note: `${totals.won.count} won` },
  ];
  return (
    <dl className="grid gap-2 sm:grid-cols-3 sm:gap-3">
      {stats.map(({ label, value, note }) => (
        <div key={label} className="flex items-baseline justify-between gap-1 rounded-card border border-rule bg-surface px-4 py-3 sm:flex-col sm:items-start sm:px-5 sm:py-4">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="font-serif text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</dd>
          <dd className="hidden text-xs text-muted sm:block">{note}</dd>
        </div>
      ))}
    </dl>
  );
}

type StatusFilterProps = { current?: LeadStatus; q?: string; totals: StatusTotals };

// The counts are for all requests, not the search, so a search never hides how many are waiting.
export function StatusFilter({ current, q, totals }: StatusFilterProps) {
  const all = LEAD_STATUSES.reduce((sum, status) => sum + totals[status].count, 0);
  const tabs = [
    { status: undefined, label: "All", count: all },
    ...LEAD_STATUSES.map((status) => ({ status, label: statusLabel(status), count: totals[status].count })),
  ];
  return (
    <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex gap-1.5">
        {tabs.map(({ status, label, count }) => {
          const active = status === current;
          return (
            <li key={label}>
              <Link
                href={leadListHref({ status, q })}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? "border-ink bg-ink text-paper" : "border-rule hover:border-muted"
                }`}
              >
                {label}
                <span className={`tabular-nums ${active ? "text-paper/70" : "text-muted"}`}>{count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
