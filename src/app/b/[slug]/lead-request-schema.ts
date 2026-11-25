import { z } from "zod";
import { MAX_LEAD_ITEMS } from "@/domain/leads/lead";
import type { LeadRequest } from "@/domain/leads/submit-lead";
import { MAX_DIMENSION_CM, MAX_HOURS, MAX_QUANTITY } from "@/domain/pricing/strategies";
import { toFieldErrors, type FieldErrors } from "@/lib/field-errors";
import { decimalInput } from "@/lib/parse-number";
import { phoneSchema } from "@/lib/phone-schema";

export const CHOICE_PREFIX = "choice.";

const dimension = decimalInput().pipe(
  z
    .number()
    .positive("Must be greater than 0")
    .max(MAX_DIMENSION_CM, `At most ${MAX_DIMENSION_CM} cm`),
);

const quantity = decimalInput().pipe(
  z.number().int("Must be a whole number").min(1, "At least 1").max(MAX_QUANTITY, `At most ${MAX_QUANTITY}`),
);

const quoteInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("per_area"), widthCm: dimension, heightCm: dimension, quantity }),
  z.object({
    kind: z.literal("per_hour"),
    hours: decimalInput().pipe(
      z.number().positive("Must be greater than 0").max(MAX_HOURS, `At most ${MAX_HOURS} hours`),
    ),
  }),
  z.object({ kind: z.literal("fixed"), quantity }),
]);

const itemSchema = z.object({
  serviceId: z.uuid("Choose a service"),
  input: quoteInputSchema,
  surchargeIds: z.array(z.string().max(64)).max(20),
  // Which option was picked in each group; the price is checked against the service on the server.
  choices: z.record(z.string().max(64), z.string().max(64)).refine((c) => Object.keys(c).length <= 10, "Too many choices"),
});

// The form sends its items as one JSON field; anything that is not a JSON array fails like a bad item.
const itemsField = z.string().transform((text, ctx) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    ctx.addIssue({ code: "custom", message: "Add at least one item" });
    return z.NEVER;
  }
});

const leadRequestSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your name").max(100, "Name is too long"),
  phone: phoneSchema,
  comment: z
    .string()
    .trim()
    .max(1000, "Comment is too long")
    .transform((value) => value || undefined)
    .optional(),
  items: itemsField.pipe(
    z.array(itemSchema).min(1, "Add at least one item").max(MAX_LEAD_ITEMS, `At most ${MAX_LEAD_ITEMS} items in one request`),
  ),
  idempotencyKey: z.uuid(),
}) satisfies z.ZodType<LeadRequest>;

// One item as the browser holds it: the raw text of each field, before parsing.
export type ItemPayload = {
  serviceId: string;
  input: Record<string, string>;
  surchargeIds: string[];
  choices: Record<string, string>;
};

export type ParsedLeadForm =
  | { ok: true; request: LeadRequest }
  | { ok: false; fieldErrors: FieldErrors; message?: string };

export function parseLeadForm(formData: FormData): ParsedLeadForm {
  const text = (name: string) => formData.get(name) ?? undefined;

  const result = leadRequestSchema.safeParse({
    customerName: text("customerName"),
    phone: text("phone"),
    comment: text("comment"),
    items: text("items"),
    idempotencyKey: text("idempotencyKey"),
  });
  if (result.success) return { ok: true, request: result.data };

  // The open item is the last one; an error in an item already added is named by its number instead.
  const sent = safeJson(formData.get("items"));
  const count = Array.isArray(sent) ? sent.length : 0;
  const earlier = result.error.issues.find((issue) => issue.path[0] === "items" && typeof issue.path[1] === "number" && issue.path[1] < count - 1);
  const fieldErrors = toFieldErrors(result.error);
  return earlier
    ? { ok: false, fieldErrors: {}, message: `Item ${Number(earlier.path[1]) + 1} needs a fix: edit it and send again` }
    : { ok: false, fieldErrors };
}

function safeJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
