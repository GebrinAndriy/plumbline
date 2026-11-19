"use client";

import { useActionState } from "react";
import { StatusBadge, statusLabel } from "@/components/status-badge";
import { allowedTransitions, type LeadStatus } from "@/domain/leads/lead-status";
import { changeLeadStatusAction } from "./actions";

const button = "rounded-field border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

export function LeadStatusControl({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [state, formAction, pending] = useActionState(changeLeadStatusAction, {});
  const next = allowedTransitions(status);
  const forward = next.filter((to) => to !== "lost");

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="from" value={status} />
      <StatusBadge status={status} />
      {next.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {next.includes("lost") && (
            <button type="submit" name="to" value="lost" disabled={pending} className={`${button} border-transparent text-muted hover:text-error`}>
              Mark lost
            </button>
          )}
          {forward.map((to) => (
            <button key={to} type="submit" name="to" value={to} disabled={pending} className={`${button} border-ink hover:bg-surface`}>
              {status === "lost" ? "Reopen" : `→ ${statusLabel(to)}`}
            </button>
          ))}
        </div>
      )}
      {state.message && (
        <p role="alert" className="animate-rise text-xs text-error">
          {state.message}
        </p>
      )}
    </form>
  );
}
