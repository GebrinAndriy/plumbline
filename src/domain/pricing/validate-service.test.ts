import { describe, expect, it } from "vitest";
import { PricingConfigError } from "./errors";
import type { PricingRule, Service, Surcharge } from "./types";
import { MAX_SURCHARGES, validateService, validateSurcharge } from "./validate-service";

function service(rule: PricingRule, surcharges: Surcharge[] = []): Service {
  return { id: "s1", name: "Service", rule, surcharges };
}

describe("validateService", () => {
  it("accepts a valid service", () => {
    expect(() =>
      validateService(
        service({ kind: "per_area", ratePerSqm: 50_000, minimumTotal: 20_000 }, [
          { id: "install", label: "Installation", kind: "flat", amount: 50_000 },
          { id: "urgent", label: "Urgent", kind: "percent", percent: 20 },
        ]),
      ),
    ).not.toThrow();
  });

  it.each<PricingRule>([
    { kind: "per_area", ratePerSqm: -50_000 },
    { kind: "per_area", ratePerSqm: 0 },
    { kind: "per_area", ratePerSqm: 500.5 },
    { kind: "per_area", ratePerSqm: 50_000, minimumTotal: -1 },
    { kind: "per_hour", ratePerHour: Number.NaN },
    { kind: "per_hour", ratePerHour: 40_000, minimumHours: 0 },
    { kind: "per_hour", ratePerHour: 40_000, minimumHours: 25 },
    { kind: "fixed", price: 1_000_000_000 },
  ])("rejects rule %o", (rule) => {
    expect(() => validateService(service(rule))).toThrow(PricingConfigError);
  });

  it.each<Surcharge>([
    { id: "a", label: "A", kind: "flat", amount: -100 },
    { id: "a", label: "A", kind: "percent", percent: 0 },
    { id: "a", label: "A", kind: "percent", percent: 150 },
  ])("rejects surcharge %o", (surcharge) => {
    expect(() => validateService(service({ kind: "fixed", price: 1_000 }, [surcharge]))).toThrow(
      PricingConfigError,
    );
  });

  it("rejects duplicate surcharge ids", () => {
    const duplicate: Surcharge = { id: "a", label: "A", kind: "flat", amount: 100 };
    expect(() =>
      validateService(service({ kind: "fixed", price: 1_000 }, [duplicate, duplicate])),
    ).toThrow(PricingConfigError);
  });
});

describe("validateSurcharge", () => {
  it("accepts flat and percent options", () => {
    expect(() => validateSurcharge({ id: "a", label: "Installation", kind: "flat", amount: 50_000 })).not.toThrow();
    expect(() => validateSurcharge({ id: "b", label: "Urgent", kind: "percent", percent: 100 })).not.toThrow();
  });

  it.each<Surcharge>([
    { id: "a", label: "  ", kind: "flat", amount: 100 },
    { id: "a", label: "x".repeat(61), kind: "flat", amount: 100 },
    { id: "a", label: "Free", kind: "flat", amount: 0 },
    { id: "a", label: "Huge", kind: "percent", percent: 101 },
  ])("rejects %o", (surcharge) => {
    expect(() => validateSurcharge(surcharge)).toThrow(PricingConfigError);
  });

  it("limits the number of options per service", () => {
    const options = Array.from({ length: MAX_SURCHARGES + 1 }, (_, i): Surcharge => ({
      id: `o${i}`,
      label: `Option ${i}`,
      kind: "flat",
      amount: 100,
    }));
    expect(() => validateService(service({ kind: "fixed", price: 1_000 }, options))).toThrow(PricingConfigError);
  });
});
