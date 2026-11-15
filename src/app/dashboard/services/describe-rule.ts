import type { PricingRule } from "@/domain/pricing/types";
import { assertNever } from "@/lib/assert-never";
import { formatMoney } from "@/lib/format-money";

export function describeRule(rule: PricingRule): string {
  switch (rule.kind) {
    case "per_area":
      return withMinimum(`${formatMoney(rule.ratePerSqm)} per m²`, rule.minimumTotal && formatMoney(rule.minimumTotal));
    case "per_hour":
      return withMinimum(`${formatMoney(rule.ratePerHour)} per hour`, rule.minimumHours && `${rule.minimumHours} h`);
    case "fixed":
      return `${formatMoney(rule.price)} per item`;
    default:
      return assertNever(rule);
  }
}

function withMinimum(text: string, minimum: string | undefined | 0): string {
  return minimum ? `${text}, minimum ${minimum}` : text;
}
