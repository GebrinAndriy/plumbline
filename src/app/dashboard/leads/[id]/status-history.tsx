import { statusLabel } from "@/components/status-badge";
import type { LeadWithHistory } from "@/domain/leads/lead";
import { formatDateTime } from "@/lib/format-date";

export function StatusHistory({ lead, history }: LeadWithHistory) {
  const steps = [
    { key: "received", label: "Request received", at: lead.createdAt },
    ...history.map((change, index) => ({
      key: `${index}-${change.to}`,
      label: `${statusLabel(change.from)} → ${statusLabel(change.to)}`,
      at: change.at,
    })),
  ];

  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-4">
      <h2 id="history-title" className="font-serif text-xl font-medium">
        History
      </h2>
      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const latest = index === steps.length - 1;
          return (
            <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
              {!latest && <span aria-hidden className="absolute top-3 bottom-0 left-[5px] w-px bg-rule" />}
              <span
                aria-hidden
                className={`mt-1.5 size-[11px] shrink-0 rounded-full border-2 ${latest ? "border-accent bg-accent" : "border-control bg-paper"}`}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{step.label}</span>
                <time dateTime={step.at.toISOString()} className="text-xs text-muted">
                  {formatDateTime(step.at)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
