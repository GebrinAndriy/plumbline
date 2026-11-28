"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db/get-repositories";
import { requireOwner } from "@/lib/auth/current-owner";
import { toFieldErrors, type FieldErrors } from "@/lib/field-errors";
import { businessNameSchema, slugSchema } from "../../(auth)/auth-schemas";

export type BusinessFormState = { fieldErrors: FieldErrors; message?: string; movedFrom?: string; saved?: number };

const businessFormSchema = z.object({ businessName: businessNameSchema, slug: slugSchema });

export async function saveBusinessAction(previous: BusinessFormState, formData: FormData): Promise<BusinessFormState> {
  const { business } = await requireOwner();
  if (!business) return { fieldErrors: {}, message: "This account has no business" };

  const parsed = businessFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { catalog } = getRepositories();
  // The address first: if it is taken, nothing is saved and the owner fixes one field.
  const moved = await catalog.changeSlug(business.id, parsed.data.slug);
  if (moved === "taken") return { fieldErrors: { slug: "This address is already taken" } };
  if (moved === "not_found") return { fieldErrors: {}, message: "This account has no business" };
  if (parsed.data.businessName !== business.name) await catalog.renameBusiness(business.id, parsed.data.businessName);

  refresh();
  return { fieldErrors: {}, movedFrom: moved === "changed" ? business.slug : undefined, saved: (previous.saved ?? 0) + 1 };
}
