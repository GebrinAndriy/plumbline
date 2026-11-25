import type { LeadItem } from "@/domain/leads/lead";
import type { Quote, Service } from "@/domain/pricing/types";
import { describeLeadItem, receiptQuote } from "@/lib/describe-lead-item";
import type { ItemPayload } from "./lead-request-schema";
import { EMPTY_FIELDS, previewQuote, toQuoteInput, type QuoteFields } from "./preview-quote";

// One item as the form holds it: what the customer typed and picked, before the server checks it.
export type ItemDraft = {
  serviceId: string;
  fields: QuoteFields;
  surchargeIds: string[];
  choices: Record<string, string>;
};

export type PricedItem = { draft: ItemDraft; service: Service | null; quote: Quote | null };

export function priceItem(services: readonly Service[], draft: ItemDraft): PricedItem {
  const service = services.find((s) => s.id === draft.serviceId) ?? null;
  return { draft, service, quote: service && previewQuote(service, draft.fields, draft.surchargeIds, draft.choices) };
}

// Untouched since it was opened: left out when other items are already in the request.
export function isBlank({ fields }: ItemDraft): boolean {
  return (Object.keys(EMPTY_FIELDS) as (keyof QuoteFields)[]).every((name) => fields[name].trim() === EMPTY_FIELDS[name]);
}

export function toPayload({ serviceId, fields, surchargeIds, choices }: ItemDraft, service: Service): ItemPayload {
  return { serviceId, input: { kind: service.rule.kind, ...fields }, surchargeIds, choices };
}

export function describeDraft({ draft, service, quote }: PricedItem): string {
  if (!service) return "";
  const input = toQuoteInput(service.rule.kind, draft.fields);
  return quote ? describeLeadItem({ serviceId: service.id, serviceName: service.name, input, quote }) : service.name;
}

// The receipt for several items, or null while any of them has no price yet.
export function combinedQuote(items: readonly PricedItem[]): Quote | null {
  const priced: LeadItem[] = [];
  for (const { draft, service, quote } of items) {
    if (!service || !quote) return null;
    priced.push({ serviceId: service.id, serviceName: service.name, input: toQuoteInput(service.rule.kind, draft.fields), quote });
  }
  return priced.length > 0 ? receiptQuote(priced) : null;
}

// "200 × 150 cm · 3 m² · 2 pcs" for an area service; the receipt detail for the others.
export function sizeSummary(service: Service, fields: QuoteFields, detail = ""): string {
  if (service.rule.kind !== "per_area") return detail;
  const pieces = Number(fields.quantity) > 1 ? ` · ${fields.quantity} pcs` : "";
  return `${fields.widthCm} × ${fields.heightCm} cm · ${detail}${pieces}`;
}
