import type { LeadStatus } from "@/domain/leads/lead-status";

const STYLES: Record<LeadStatus, { label: string; badge: string; dot: string }> = {
  new: { label: "New", badge: "bg-accent-soft text-accent-hover", dot: "bg-accent" },
  contacted: { label: "Contacted", badge: "bg-info-soft text-info", dot: "bg-info" },
  quoted: { label: "Quoted", badge: "bg-quoted-soft text-quoted", dot: "bg-quoted" },
  won: { label: "Won", badge: "bg-success-soft text-success", dot: "bg-success" },
  lost: { label: "Lost", badge: "bg-disabled text-disabled-text", dot: "bg-disabled-text" },
};

export const statusLabel = (status: LeadStatus) => STYLES[status].label;

export function StatusBadge({ status }: { status: LeadStatus }) {
  const { label, badge, dot } = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
