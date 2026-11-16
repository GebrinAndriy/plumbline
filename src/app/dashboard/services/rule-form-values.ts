import type { PricingRule } from "@/domain/pricing/types";
import { assertNever } from "@/lib/assert-never";
import { formatMoneyInput } from "@/lib/format-money";

export type RuleFormValues = Partial<Record<string, string>>;

const optionalMoney = (value: number | undefined) =>
  value === undefined ? undefined : formatMoneyInput(value);

// Turns a stored rule back into the text the service form expects, so editing starts from current prices.
export function ruleFormValues(rule: PricingRule): RuleFormValues {
  switch (rule.kind) {
    case "per_area":
      return { ratePerSqm: formatMoneyInput(rule.ratePerSqm), minimumTotal: optionalMoney(rule.minimumTotal) };
    case "per_hour":
      return { ratePerHour: formatMoneyInput(rule.ratePerHour), minimumHours: rule.minimumHours?.toString() };
    case "fixed":
      return { price: formatMoneyInput(rule.price) };
    default:
      return assertNever(rule);
  }
}
