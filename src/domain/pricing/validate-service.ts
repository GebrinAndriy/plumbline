import { assertNever } from "@/lib/assert-never";
import { PricingConfigError } from "./errors";
import type { Money, PricingRule, Service, Surcharge } from "./types";

export const MAX_PRICE: Money = 100_000_000; // 1 000 000 UAH
export const MAX_SURCHARGES = 10;
const MAX_PERCENT = 100;
const MAX_LABEL_LENGTH = 60;
const MAX_MINIMUM_HOURS = 24;

export function validateService(service: Service): void {
  validateRule(service.rule);
  if (service.surcharges.length > MAX_SURCHARGES) {
    throw new PricingConfigError(`A service can have at most ${MAX_SURCHARGES} options`);
  }

  const ids = new Set<string>();
  for (const surcharge of service.surcharges) {
    if (ids.has(surcharge.id)) {
      throw new PricingConfigError("Surcharge ids must be unique");
    }
    ids.add(surcharge.id);
    validateSurcharge(surcharge);
  }
}

function validateRule(rule: PricingRule): void {
  switch (rule.kind) {
    case "per_area":
      assertPrice(rule.ratePerSqm, "ratePerSqm");
      if (rule.minimumTotal !== undefined) assertPrice(rule.minimumTotal, "minimumTotal");
      return;
    case "per_hour":
      assertPrice(rule.ratePerHour, "ratePerHour");
      if (rule.minimumHours !== undefined) {
        assertInRange(rule.minimumHours, 0, MAX_MINIMUM_HOURS, "minimumHours");
      }
      return;
    case "fixed":
      assertPrice(rule.price, "price");
      return;
    default:
      assertNever(rule);
  }
}

export function validateSurcharge(surcharge: Surcharge): void {
  const label = surcharge.label.trim();
  if (label.length === 0 || label.length > MAX_LABEL_LENGTH) {
    throw new PricingConfigError(`label must be 1 to ${MAX_LABEL_LENGTH} characters`);
  }
  switch (surcharge.kind) {
    case "flat":
      assertPrice(surcharge.amount, "amount");
      return;
    case "percent":
      assertInRange(surcharge.percent, 0, MAX_PERCENT, "percent");
      return;
    default:
      assertNever(surcharge);
  }
}

function assertPrice(value: Money, field: string): void {
  if (!Number.isInteger(value) || value <= 0 || value > MAX_PRICE) {
    throw new PricingConfigError(`${field} must be a whole number of kopiykas between 1 and ${MAX_PRICE}`);
  }
}

function assertInRange(value: number, min: number, max: number, field: string): void {
  if (!Number.isFinite(value) || value <= min || value > max) {
    throw new PricingConfigError(`${field} must be greater than ${min} and at most ${max}`);
  }
}
