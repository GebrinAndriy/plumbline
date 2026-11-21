import type { Money, PricingRule, QuoteInput } from "@/domain/pricing/types";
import { assertNever } from "@/lib/assert-never";
import { formatMoney } from "@/lib/format-money";
import { MARKET } from "@/lib/market";

const decimal = new Intl.NumberFormat(MARKET.locale, { maximumFractionDigits: 2 });
const CM2_PER_SQM = 10_000;

type InputOf<K extends QuoteInput["kind"]> = Extract<QuoteInput, { kind: K }>;

export type QuoteExplanation = {
  // Short detail for the receipt line: "3.36 m²", "3 h", "2 pcs".
  detail: string;
  // The arithmetic behind the base price, so the customer can check it.
  formula: string;
};

export function explainQuote(rule: PricingRule, input: QuoteInput, base: Money): QuoteExplanation {
  if (rule.kind !== input.kind) throw new Error("Input does not match the pricing rule");
  switch (rule.kind) {
    case "per_area": {
      const { widthCm, heightCm, quantity } = input as InputOf<"per_area">;
      const area = ((widthCm * heightCm) / CM2_PER_SQM) * quantity;
      const size = `${quantity > 1 ? `${quantity} × ` : ""}${widthCm} × ${heightCm} cm`;
      const formula = `${size} = ${decimal.format(area)} m² × ${formatMoney(rule.ratePerSqm)}`;
      const raised = Math.round(area * rule.ratePerSqm) < base;
      return {
        detail: `${decimal.format(area)} m²`,
        formula: raised ? `${formula}, raised to the minimum order ${formatMoney(base)}` : `${formula} = ${formatMoney(base)}`,
      };
    }
    case "per_hour": {
      const { hours } = input as InputOf<"per_hour">;
      const billable = Math.max(hours, rule.minimumHours ?? 0);
      const formula = `${decimal.format(billable)} h × ${formatMoney(rule.ratePerHour)} = ${formatMoney(base)}`;
      return {
        detail: `${decimal.format(hours)} h`,
        formula: billable > hours ? `${formula} (minimum ${decimal.format(billable)} h)` : formula,
      };
    }
    case "fixed": {
      const { quantity } = input as InputOf<"fixed">;
      return { detail: `${quantity} pcs`, formula: `${quantity} × ${formatMoney(rule.price)} = ${formatMoney(base)}` };
    }
    default:
      return assertNever(rule);
  }
}
