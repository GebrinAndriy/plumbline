import { z } from "zod";
import { MAX_CHOICE_OPTIONS, MAX_PRICE, MIN_CHOICE_OPTIONS } from "@/domain/pricing/validate-service";
import type { FieldErrors } from "@/lib/field-errors";
import { parseMoney } from "@/lib/parse-money";

const name = z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Keep the name under 60 characters");

// Blank means "included": the cheapest fabric usually costs nothing on top of the rate.
const amountOrZero = z.string().transform((text, ctx) => {
  if (text.trim() === "") return 0;
  const amount = parseMoney(text);
  if (amount === null || amount > MAX_PRICE) {
    ctx.addIssue({ code: "custom", message: "Enter euro, for example 15 or 15.50" });
    return z.NEVER;
  }
  return amount;
});

const choiceGroupFormSchema = z.object({
  groupLabel: name,
  options: z
    .array(
      z.object({
        // Set for an option being edited, so it keeps its photo; empty for a new one.
        id: z.string().max(64).transform((id) => id || undefined),
        label: name,
        kind: z.enum(["rate", "flat"]),
        amount: amountOrZero,
      }),
    )
    .min(MIN_CHOICE_OPTIONS, `Add at least ${MIN_CHOICE_OPTIONS} options`)
    .max(MAX_CHOICE_OPTIONS, `Keep it to ${MAX_CHOICE_OPTIONS} options`),
});

export type ChoiceGroupForm = z.infer<typeof choiceGroupFormSchema>;

export type ParsedChoiceGroup = { ok: true; group: ChoiceGroupForm } | { ok: false; fieldErrors: FieldErrors };

// Rows post as repeated optionLabel/optionKind/optionAmount fields; fully empty rows are skipped.
export function parseChoiceGroupForm(formData: FormData): ParsedChoiceGroup {
  const text = (value: FormDataEntryValue | undefined) => (typeof value === "string" ? value : "");
  const kinds = formData.getAll("optionKind");
  const amounts = formData.getAll("optionAmount");
  const ids = formData.getAll("optionId");
  const options = formData
    .getAll("optionLabel")
    .map((label, i) => ({ id: text(ids[i]), label: text(label), kind: text(kinds[i]), amount: text(amounts[i]) }))
    .filter((row) => row.label.trim() !== "" || row.amount.trim() !== "");

  const result = choiceGroupFormSchema.safeParse({ groupLabel: text(formData.get("groupLabel") ?? undefined), options });
  if (result.success) return { ok: true, group: result.data };

  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    // Errors in a row are keyed by its position, so each shows next to its own inputs.
    const key = issue.path.length === 3 ? `option-${String(issue.path[1])}-${String(issue.path[2])}` : String(issue.path[0]);
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, fieldErrors };
}
