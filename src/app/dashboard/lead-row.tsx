import type { LeadSummary } from "@/domain/leads/lead";
import { describeInput } from "@/lib/describe-input";
import { formatMoney } from "@/lib/format-money";
import { formatPhone } from "@/lib/format-phone";
import { LeadStatusControl } from "./lead-status-control";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Kyiv",
});

export function LeadRow({ lead }: { lead: LeadSummary }) {
  const [base, ...options] = lead.quote.lines;
  const details = [base.label, describeInput(lead.input), ...options.map((line) => line.label)].join(" · ");

  return (
    <li className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-base font-semibold">{lead.customerName}</span>
          <time dateTime={lead.createdAt.toISOString()} className="text-xs text-muted">
            {dateFormat.format(lead.createdAt)}
          </time>
        </p>
        <a href={`tel:${lead.phone}`} className="self-start text-sm font-medium text-accent underline-offset-4 hover:underline">
          {formatPhone(lead.phone)}
        </a>
        <p className="text-sm text-muted">{details}</p>
        {lead.comment && <p className="mt-1 border-l-2 border-rule pl-3 text-sm italic">{lead.comment}</p>}
      </div>
      <div className="flex items-start justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-serif text-2xl font-semibold tabular-nums">{formatMoney(lead.quote.total)}</p>
        <LeadStatusControl leadId={lead.id} status={lead.status} />
      </div>
    </li>
  );
}
