import { calculateQuote } from "@/domain/pricing/calculate-quote";
import type { PricingKind, PricingRule, QuoteInput } from "@/domain/pricing/types";
import { explainQuote } from "@/lib/explain-quote";
import { serviceFormSchema } from "./service-form-schema";

const SAMPLE_ORDERS: Record<PricingKind, QuoteInput> = {
  per_area: { kind: "per_area", widthCm: 200, heightCm: 150, quantity: 1 },
  per_hour: { kind: "per_hour", hours: 3 },
  fixed: { kind: "fixed", quantity: 2 },
};

// What a typical order would cost, written out the way the customer's receipt shows it.
export function priceExample(rule: PricingRule): string {
  const input = SAMPLE_ORDERS[rule.kind];
  const quote = calculateQuote({ id: "example", name: "Example", rule, surcharges: [] }, input);
  return explainQuote(rule, input, quote.total).formula;
}

// Reads the half-filled form; returns null until the prices are valid enough to quote.
export function draftPriceExample(fields: Record<string, unknown>): string | null {
  const parsed = serviceFormSchema.safeParse({ ...fields, name: "Example" });
  return parsed.success ? priceExample(parsed.data.rule) : null;
}
