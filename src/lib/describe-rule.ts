import type { PricingRule, Surcharge } from "@/domain/pricing/types";
import { assertNever } from "@/lib/assert-never";
import { formatMoney } from "@/lib/format-money";

// The headline price alone, for places with no room for minimums: "€50 per m²".
export function describeRate(rule: PricingRule): string {
  switch (rule.kind) {
    case "per_area":
      return `${formatMoney(rule.ratePerSqm)} per m²`;
    case "per_hour":
      return `${formatMoney(rule.ratePerHour)} per hour`;
    case "fixed":
      return `${formatMoney(rule.price)} per item`;
    default:
      return assertNever(rule);
  }
}

export function describeRule(rule: PricingRule): string {
  switch (rule.kind) {
    case "per_area":
      return withMinimum(describeRate(rule), rule.minimumTotal && formatMoney(rule.minimumTotal));
    case "per_hour":
      return withMinimum(describeRate(rule), rule.minimumHours && `${rule.minimumHours} h`);
    case "fixed":
      return describeRate(rule);
    default:
      return assertNever(rule);
  }
}

function withMinimum(text: string, minimum: string | undefined | 0): string {
  return minimum ? `${text}, minimum ${minimum}` : text;
}

export function describeSurcharge(surcharge: Surcharge): string {
  switch (surcharge.kind) {
    case "flat":
      return `+${formatMoney(surcharge.amount)}`;
    case "percent":
      return `+${surcharge.percent}%`;
    default:
      return assertNever(surcharge);
  }
}
