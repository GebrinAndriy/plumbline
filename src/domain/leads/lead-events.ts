import type { Business } from "../catalog/catalog";
import type { Lead } from "./lead";

export type LeadEvent = { type: "lead.created"; lead: Lead; business: Business };

export interface LeadEventListener {
  handle(event: LeadEvent): Promise<void>;
}

// One failing listener must not stop the others, and none may fail the customer's request.
export async function notifyAll(
  listeners: readonly LeadEventListener[],
  event: LeadEvent,
  onError: (error: unknown) => void,
): Promise<void> {
  const results = await Promise.allSettled(listeners.map((listener) => listener.handle(event)));
  for (const result of results) {
    if (result.status === "rejected") onError(result.reason);
  }
}
