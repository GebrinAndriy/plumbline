import { assertNever } from "@/lib/assert-never";
import { PricingConfigError } from "./errors";
import type { ChoiceGroup, Money, PricingRule, Service, Surcharge } from "./types";

export const MAX_PRICE: Money = 100_000_000; // €1,000,000
export const MAX_SURCHARGES = 10;
export const MAX_CHOICE_GROUPS = 5;
export const MIN_CHOICE_OPTIONS = 2;
export const MAX_CHOICE_OPTIONS = 12;
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

  const groups = service.choices ?? [];
  if (groups.length > MAX_CHOICE_GROUPS) {
    throw new PricingConfigError(`A service can have at most ${MAX_CHOICE_GROUPS} choice groups`);
  }
  const groupIds = new Set<string>();
  for (const group of groups) {
    if (groupIds.has(group.id)) throw new PricingConfigError("Choice group ids must be unique");
    groupIds.add(group.id);
    validateChoiceGroup(group);
  }
}

export function validateChoiceGroup(group: ChoiceGroup): void {
  assertLabel(group.label);
  if (group.options.length < MIN_CHOICE_OPTIONS || group.options.length > MAX_CHOICE_OPTIONS) {
    throw new PricingConfigError(`A choice group needs ${MIN_CHOICE_OPTIONS} to ${MAX_CHOICE_OPTIONS} options`);
  }
  const ids = new Set<string>();
  for (const option of group.options) {
    if (ids.has(option.id)) throw new PricingConfigError("Choice option ids must be unique");
    ids.add(option.id);
    assertLabel(option.label);
    if (option.kind !== "rate" && option.kind !== "flat") throw new PricingConfigError("Unknown choice kind");
    // Zero is allowed: the cheapest fabric is usually included in the rate.
    if (!Number.isInteger(option.amount) || option.amount < 0 || option.amount > MAX_PRICE) {
      throw new PricingConfigError(`amount must be a whole number of cents between 0 and ${MAX_PRICE}`);
    }
    if (option.imageUrl !== undefined && !option.imageUrl.startsWith("https://")) {
      throw new PricingConfigError("imageUrl must be an https address");
    }
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

function assertLabel(text: string): void {
  const label = text.trim();
  if (label.length === 0 || label.length > MAX_LABEL_LENGTH) {
    throw new PricingConfigError(`label must be 1 to ${MAX_LABEL_LENGTH} characters`);
  }
}

export function validateSurcharge(surcharge: Surcharge): void {
  assertLabel(surcharge.label);
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
    throw new PricingConfigError(`${field} must be a whole number of cents between 1 and ${MAX_PRICE}`);
  }
}

function assertInRange(value: number, min: number, max: number, field: string): void {
  if (!Number.isFinite(value) || value <= min || value > max) {
    throw new PricingConfigError(`${field} must be greater than ${min} and at most ${max}`);
  }
}
