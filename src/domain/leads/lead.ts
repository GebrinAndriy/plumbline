import type { Money, Quote, QuoteInput } from "../pricing/types";
import { LEAD_STATUSES, type LeadStatus } from "./lead-status";
import type { StatusChange } from "./transition-lead";

export type Lead = {
  id: string;
  businessId: string;
  serviceId: string | null;
  customerName: string;
  phone: string;
  comment: string | null;
  input: QuoteInput;
  quote: Quote;
  status: LeadStatus;
  createdAt: Date;
  history: StatusChange[];
};

export type LeadSummary = Omit<Lead, "history">;

export type StatusTotals = Record<LeadStatus, { count: number; total: Money }>;

export const emptyStatusTotals = (): StatusTotals =>
  Object.fromEntries(LEAD_STATUSES.map((status) => [status, { count: 0, total: 0 }])) as StatusTotals;

export type NewLead = {
  businessId: string;
  serviceId: string;
  customerName: string;
  phone: string;
  comment?: string;
  input: QuoteInput;
  quote: Quote;
  idempotencyKey: string;
};

export class LeadConflictError extends Error {
  constructor() {
    super("Lead was changed by someone else, reload and try again");
    this.name = "LeadConflictError";
  }
}

export interface LeadRepository {
  /** Returns the existing lead when the idempotency key was already used. */
  create(lead: NewLead): Promise<{ lead: Lead; created: boolean }>;
  findById(businessId: string, leadId: string): Promise<Lead | null>;
  listByBusiness(
    businessId: string,
    options?: { status?: LeadStatus; limit?: number },
  ): Promise<LeadSummary[]>;
  /** Counts and sums every lead of the business, not just one page of them. */
  summarizeByStatus(businessId: string): Promise<StatusTotals>;
  /** Throws LeadConflictError if the lead's status changed since it was read. */
  saveTransition(businessId: string, leadId: string, change: StatusChange): Promise<void>;
}
