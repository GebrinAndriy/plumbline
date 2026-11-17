"use client";

import { useActionState } from "react";
import { allowedTransitions, type LeadStatus } from "@/domain/leads/lead-status";
import { changeLeadStatusAction } from "./actions";

const ACTION_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

export function LeadStatusControl({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [state, formAction, pending] = useActionState(changeLeadStatusAction, {});
  const next = allowedTransitions(status);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="from" value={status} />
      <p className="text-xs uppercase tracking-wide text-muted">{status}</p>
      {next.length > 0 && (
        <div className="flex gap-1">
          {next.map((to) => (
            <button
              key={to}
              type="submit"
              name="to"
              value={to}
              disabled={pending}
              className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:bg-surface disabled:opacity-50"
            >
              {status === "lost" ? "Reopen" : `→ ${ACTION_LABELS[to]}`}
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
