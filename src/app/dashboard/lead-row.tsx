import Link from "next/link";
import type { Lead } from "@/domain/leads/lead";
import { describeLeadItem } from "@/lib/describe-lead-item";
import { formatMoney } from "@/lib/format-money";
import { formatPhone } from "@/lib/format-phone";
import { formatDateTime } from "@/lib/format-date";
import { isClosed } from "@/domain/leads/lead-status";
import { FollowUpBadge } from "./follow-up-badge";
import { LeadStatusControl } from "./lead-status-control";

export function LeadRow({ lead, today }: { lead: Lead; today: string }) {
  return (
    <li
      id={`lead-${lead.id}`}
      className="flex scroll-mt-6 flex-col gap-4 px-4 py-5 transition-colors target:bg-accent-soft sm:flex-row sm:items-start sm:justify-between sm:px-5"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <Link href={`/dashboard/leads/${lead.id}`} className="tap-target text-base font-semibold underline-offset-4 hover:underline">
            {lead.customerName}
          </Link>
          <time dateTime={lead.createdAt.toISOString()} className="text-xs text-muted">
            {formatDateTime(lead.createdAt)}
          </time>
          {/* A won or lost request needs no call back, whatever day was set before. */}
          {lead.followUpOn && !isClosed(lead.status) && <FollowUpBadge on={lead.followUpOn} today={today} />}
        </p>
        <a href={`tel:${lead.phone}`} className="tap-target self-start text-sm font-medium text-accent underline-offset-4 hover:underline">
          {formatPhone(lead.phone)}
        </a>
        <ul className="text-sm text-muted">
          {lead.items.map((item, index) => (
            <li key={index}>{describeLeadItem(item)}</li>
          ))}
        </ul>
        {lead.comment && <p className="mt-1 border-l-2 border-rule pl-3 text-sm italic">{lead.comment}</p>}
      </div>
      <div className="flex items-start justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-serif text-2xl font-semibold tabular-nums">{formatMoney(lead.total)}</p>
        <LeadStatusControl leadId={lead.id} status={lead.status} />
      </div>
    </li>
  );
}
