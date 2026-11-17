import { z } from "zod";
import { parseDecimal } from "@/lib/parse-number";
import { price } from "./service-form-schema";

const label = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Keep the name under 60 characters");

const percent = z.string().transform((text, ctx) => {
  const value = parseDecimal(text);
  if (value === null || !Number.isInteger(value) || value < 1 || value > 100) {
    ctx.addIssue({ code: "custom", message: "Enter a whole percent from 1 to 100" });
    return z.NEVER;
  }
  return value;
});

export const surchargeFormSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("flat"), label, amount: price }),
  z.object({ kind: z.literal("percent"), label, percent }),
]);
