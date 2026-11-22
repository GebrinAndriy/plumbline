export const LEAD_STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

const TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ["contacted", "lost"],
  contacted: ["quoted", "lost"],
  quoted: ["won", "lost"],
  // Closed leads can be reopened: a mis-click, a cancelled job, a customer who calls again.
  won: ["quoted"],
  lost: ["contacted"],
};

const CLOSED: readonly LeadStatus[] = ["won", "lost"];

export function allowedTransitions(from: LeadStatus): readonly LeadStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isClosed(status: LeadStatus): boolean {
  return CLOSED.includes(status);
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}
