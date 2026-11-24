import { QuoteInputError } from "./errors";
import type { Money, PricingKind, PricingRule, QuoteInput } from "./types";

export interface PricingStrategy {
  // m², billable hours or items: what a per-rate choice is multiplied by.
  units(input: QuoteInput): number;
  basePrice(input: QuoteInput): Money;
}

type RuleOf<K extends PricingKind> = Extract<PricingRule, { kind: K }>;
type InputOf<K extends PricingKind> = Extract<QuoteInput, { kind: K }>;

const CM2_PER_SQM = 10_000;
export const MAX_DIMENSION_CM = 10_000;
export const MAX_QUANTITY = 1_000;
export const MAX_HOURS = 1_000;

export function perAreaStrategy(rule: RuleOf<"per_area">): PricingStrategy {
  const units = (input: QuoteInput) => {
    const { widthCm, heightCm, quantity } = expectInput(input, "per_area");
    assertPositive(widthCm, MAX_DIMENSION_CM, "widthCm");
    assertPositive(heightCm, MAX_DIMENSION_CM, "heightCm");
    assertPositiveInteger(quantity, MAX_QUANTITY, "quantity");
    return ((widthCm * heightCm) / CM2_PER_SQM) * quantity;
  };
  return {
    units,
    basePrice: (input) => Math.max(Math.round(units(input) * rule.ratePerSqm), rule.minimumTotal ?? 0),
  };
}

export function perHourStrategy(rule: RuleOf<"per_hour">): PricingStrategy {
  const units = (input: QuoteInput) => {
    const { hours } = expectInput(input, "per_hour");
    assertPositive(hours, MAX_HOURS, "hours");
    return Math.max(hours, rule.minimumHours ?? 0);
  };
  return { units, basePrice: (input) => Math.round(units(input) * rule.ratePerHour) };
}

export function fixedStrategy(rule: RuleOf<"fixed">): PricingStrategy {
  const units = (input: QuoteInput) => {
    const { quantity } = expectInput(input, "fixed");
    assertPositiveInteger(quantity, MAX_QUANTITY, "quantity");
    return quantity;
  };
  return { units, basePrice: (input) => rule.price * units(input) };
}

function expectInput<K extends PricingKind>(
  input: QuoteInput,
  kind: K,
): InputOf<K> {
  if (input.kind !== kind) {
    throw new QuoteInputError("Input does not match the pricing rule of this service");
  }
  // TS can't narrow a union by a generic K, the check above makes this safe.
  return input as InputOf<K>;
}

function assertPositive(value: number, max: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0 || value > max) {
    throw new QuoteInputError(`${field} must be greater than 0 and at most ${max}`);
  }
}

function assertPositiveInteger(value: number, max: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0 || value > max) {
    throw new QuoteInputError(`${field} must be a whole number from 1 to ${max}`);
  }
}
