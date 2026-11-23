"use server";

import { refresh } from "next/cache";
import { getRepositories } from "@/db/get-repositories";
import { requireOwner } from "@/lib/auth/current-owner";
import { toFieldErrors, type FieldErrors } from "@/lib/field-errors";
import { accentColorFormSchema } from "./accent-color-schema";

export type AccentColorFormState = { fieldErrors: FieldErrors; message?: string; saved?: boolean };

export async function saveAccentColorAction(
  _previous: AccentColorFormState,
  formData: FormData,
): Promise<AccentColorFormState> {
  const { business } = await requireOwner();
  if (!business) return { fieldErrors: {}, message: "This account has no business" };

  const parsed = accentColorFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  await getRepositories().catalog.setAccentColor(business.id, parsed.data);
  refresh();
  return { fieldErrors: {}, saved: true };
}
