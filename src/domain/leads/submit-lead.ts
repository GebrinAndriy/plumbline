import type { CatalogRepository } from "../catalog/catalog";
import { calculateQuote } from "../pricing/calculate-quote";
import { QuoteInputError } from "../pricing/errors";
import type { Money, QuoteInput } from "../pricing/types";
import { MAX_LEAD_ITEMS, type LeadItem, type LeadRepository } from "./lead";
import type { LeadEvent } from "./lead-events";

export type LeadItemRequest = {
  serviceId: string;
  input: QuoteInput;
  surchargeIds: string[];
  choices: Record<string, string>;
};

export type LeadRequest = {
  customerName: string;
  phone: string;
  comment?: string;
  items: LeadItemRequest[];
  idempotencyKey: string;
};

export type SubmitLeadResult =
  | { ok: true; leadId: string; total: Money }
  | { ok: false; reason: "not_found" | "invalid_input"; message: string };

type Deps = {
  catalog: CatalogRepository;
  leads: LeadRepository;
  publish: (event: LeadEvent) => void;
};

export async function submitLead(
  { catalog, leads, publish }: Deps,
  businessSlug: string,
  request: LeadRequest,
): Promise<SubmitLeadResult> {
  if (request.items.length === 0 || request.items.length > MAX_LEAD_ITEMS) {
    return { ok: false, reason: "invalid_input", message: `Add 1 to ${MAX_LEAD_ITEMS} items` };
  }
  const business = (await catalog.findBusinessBySlug(businessSlug)) ?? (await findMovedBusiness(catalog, businessSlug));
  if (!business) return { ok: false, reason: "not_found", message: "This service is no longer available" };

  const items: LeadItem[] = [];
  for (const [index, item] of request.items.entries()) {
    const service = await catalog.findService(business.id, item.serviceId);
    // Numbered so the customer knows which of several items to fix.
    const which = request.items.length > 1 ? `Item ${index + 1}: ` : "";
    if (!service) return { ok: false, reason: "not_found", message: `${which}this service is no longer available` };
    try {
      // The price shown in the browser is only a preview; the saved one is always recalculated here.
      const quote = calculateQuote(service, item.input, item.surchargeIds, item.choices);
      items.push({ serviceId: service.id, serviceName: service.name, input: item.input, quote });
    } catch (error) {
      if (error instanceof QuoteInputError) return { ok: false, reason: "invalid_input", message: `${which}${error.message}` };
      throw error;
    }
  }

  const { lead, created } = await leads.create({
    businessId: business.id,
    customerName: request.customerName,
    phone: request.phone,
    comment: request.comment,
    items,
    idempotencyKey: request.idempotencyKey,
  });

  if (created) publish({ type: "lead.created", lead, business });
  return { ok: true, leadId: lead.id, total: lead.total };
}

// The form may have been opened before the business moved to a new address.
async function findMovedBusiness(catalog: CatalogRepository, oldSlug: string) {
  const slug = await catalog.findMovedSlug(oldSlug);
  return slug ? catalog.findBusinessBySlug(slug) : null;
}
