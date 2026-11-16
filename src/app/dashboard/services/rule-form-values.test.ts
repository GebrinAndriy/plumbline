import { describe, expect, it } from "vitest";
import type { PricingRule } from "@/domain/pricing/types";
import { ruleFormValues } from "./rule-form-values";
import { serviceFormSchema } from "./service-form-schema";

const rules: PricingRule[] = [
  { kind: "per_area", ratePerSqm: 120_050, minimumTotal: 150_000 },
  { kind: "per_area", ratePerSqm: 120_000 },
  { kind: "per_hour", ratePerHour: 45_000, minimumHours: 2.5 },
  { kind: "fixed", price: 80_001 },
];

describe("ruleFormValues", () => {
  it("shows prices as hryvnias", () => {
    expect(ruleFormValues(rules[0])).toEqual({ ratePerSqm: "1200.50", minimumTotal: "1500" });
  });

  it("parses back to the same rule when saved unchanged", () => {
    for (const rule of rules) {
      const parsed = serviceFormSchema.parse({ name: "Service", kind: rule.kind, ...ruleFormValues(rule) });
      expect(parsed.rule).toEqual(rule);
    }
  });
});
