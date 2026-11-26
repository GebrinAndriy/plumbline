import type { Money, Quote, QuoteInput } from "../pricing/types";
import type { LeadSearch } from "./lead-search";
import { LEAD_STATUSES, type LeadStatus } from "./lead-status";

export const MAX_LEAD_ITEMS = 10;

// One line of a request: a service, what the customer entered for it and the price quoted for it.
export type LeadItem = {
  // Null once the service is deleted; the name and quote stay as the customer saw them.
  serviceId: string | null;
  serviceName: string;
  input: QuoteInput;
  quote: Quote;
};

export type Lead = {
  id: string;
  businessId: string;
  customerName: string;
  phone: string;
  comment: string | null;
  items: LeadItem[];
  total: Money;
  status: LeadStatus;
  createdAt: Date;
};

export const itemsTotal = (items: readonly LeadItem[]): Money => items.reduce((sum, item) => sum + item.quote.total, 0);

export type StatusChange = { from: LeadStatus; to: LeadStatus; at: Date };

export const MAX_NOTE_LENGTH = 1000;

export type LeadNote = { id: string; body: string; createdAt: Date };

export type LeadWithHistory = { lead: Lead; history: StatusChange[]; notes: LeadNote[] };

export type StatusTotals = Record<LeadStatus, { count: number; total: Money }>;

export const emptyStatusTotals = (): StatusTotals =>
  Object.fromEntries(LEAD_STATUSES.map((status) => [status, { count: 0, total: 0 }])) as StatusTotals;

export type NewLead = {
  businessId: string;
  customerName: string;
  phone: string;
  comment?: string;
  items: LeadItem[];
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
  listByBusiness(
    businessId: string,
    options?: { status?: LeadStatus; search?: LeadSearch; limit?: number; offset?: number },
  ): Promise<Lead[]>;
  /** Null for an unknown id or a lead of another business, so a link cannot reveal it exists. */
  findWithHistory(businessId: string, leadId: string): Promise<LeadWithHistory | null>;
  /** Null when the lead does not exist or belongs to another business. */
  addNote(businessId: string, leadId: string, body: string, at: Date): Promise<LeadNote | null>;
  removeNote(businessId: string, noteId: string): Promise<void>;
  /** Counts and sums every lead of the business, not just one page of them. */
  summarizeByStatus(businessId: string): Promise<StatusTotals>;
  /** Throws LeadConflictError if the lead's status changed since it was read. */
  saveTransition(businessId: string, leadId: string, change: StatusChange): Promise<void>;
}
