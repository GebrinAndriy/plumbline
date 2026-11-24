import { assertNever } from "@/lib/assert-never";
import { parseDecimal } from "@/lib/parse-number";
import { calculateQuote } from "@/domain/pricing/calculate-quote";
import { QuoteInputError } from "@/domain/pricing/errors";
import type { ChoiceSelection, PricingKind, Quote, QuoteInput, Service } from "@/domain/pricing/types";

export type QuoteFields = {
  widthCm: string;
  heightCm: string;
  quantity: string;
  hours: string;
};

export const EMPTY_FIELDS: QuoteFields = { widthCm: "", heightCm: "", quantity: "1", hours: "" };

// Same parsing as the server, so the preview never shows a price the server would refuse.
const toNumber = (text: string) => parseDecimal(text) ?? Number.NaN;

export function toQuoteInput(kind: PricingKind, fields: QuoteFields): QuoteInput {
  switch (kind) {
    case "per_area":
      return {
        kind,
        widthCm: toNumber(fields.widthCm),
        heightCm: toNumber(fields.heightCm),
        quantity: toNumber(fields.quantity),
      };
    case "per_hour":
      return { kind, hours: toNumber(fields.hours) };
    case "fixed":
      return { kind, quantity: toNumber(fields.quantity) };
    default:
      return assertNever(kind);
  }
}

// Returns null while the customer is still typing, the form shows a hint instead of an error.
export function previewQuote(
  service: Service,
  fields: QuoteFields,
  surchargeIds: readonly string[],
  choices: ChoiceSelection = {},
): Quote | null {
  try {
    return calculateQuote(service, toQuoteInput(service.rule.kind, fields), surchargeIds, choices);
  } catch (error) {
    if (error instanceof QuoteInputError) return null;
    throw error;
  }
}
