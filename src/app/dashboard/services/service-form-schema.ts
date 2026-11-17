import { z } from "zod";
import { MAX_PRICE } from "@/domain/pricing/validate-service";
import type { PricingRule } from "@/domain/pricing/types";
import { parseMoney } from "@/lib/parse-money";
import { parseDecimal } from "@/lib/parse-number";

const PRICE_ERROR = "Enter a price in UAH, for example 450 or 450.50";

export const price = z.string().transform((text, ctx) => {
  const amount = parseMoney(text);
  if (amount === null || amount <= 0 || amount > MAX_PRICE) {
    ctx.addIssue({ code: "custom", message: PRICE_ERROR });
    return z.NEVER;
  }
  return amount;
});

const optionalPrice = z
  .string()
  .optional()
  .transform((text) => text?.trim() || undefined)
  .pipe(price.optional());

const optionalHours = z
  .string()
  .optional()
  .transform((text, ctx) => {
    const trimmed = text?.trim();
    if (!trimmed) return undefined;
    const hours = parseDecimal(trimmed);
    if (hours === null || hours <= 0 || hours > 24) {
      ctx.addIssue({ code: "custom", message: "Enter hours between 0 and 24, for example 3" });
      return z.NEVER;
    }
    return hours;
  });

const name = z.string().trim().min(2, "Name must be at least 2 characters").max(80);

const ruleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("per_area"), ratePerSqm: price, minimumTotal: optionalPrice }),
  z.object({ kind: z.literal("per_hour"), ratePerHour: price, minimumHours: optionalHours }),
  z.object({ kind: z.literal("fixed"), price }),
]);

export const serviceFormSchema = z
  .object({ name })
  .and(ruleSchema)
  .transform(({ name, ...rule }) => ({ name, rule: withoutEmpty(rule) as PricingRule }));

function withoutEmpty<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}
