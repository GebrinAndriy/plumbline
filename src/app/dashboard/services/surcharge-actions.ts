"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db/get-repositories";
import { MAX_SURCHARGES } from "@/domain/pricing/validate-service";
import { requireOwner } from "@/lib/auth/current-owner";
import { toFieldErrors, type FieldErrors } from "@/lib/field-errors";
import { surchargeFormSchema } from "./surcharge-form-schema";

export type SurchargeFormState = { fieldErrors: FieldErrors; message?: string };

const NOT_FOUND: SurchargeFormState = { fieldErrors: {}, message: "This service no longer exists" };

export async function addSurchargeAction(
  serviceId: string,
  _previous: SurchargeFormState,
  formData: FormData,
): Promise<SurchargeFormState> {
  const { business } = await requireOwner();
  if (!business) return { fieldErrors: {}, message: "This account has no business" };

  const id = z.uuid().safeParse(serviceId);
  const parsed = surchargeFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  if (!id.success) return NOT_FOUND;

  const result = await getRepositories().catalog.addSurcharge(business.id, id.data, {
    id: randomUUID(),
    ...parsed.data,
  });
  if (result === "not_found") return NOT_FOUND;
  if (result === "limit_reached") {
    return { fieldErrors: {}, message: `A service can have at most ${MAX_SURCHARGES} options` };
  }
  refresh();
  return { fieldErrors: {} };
}

const removeSchema = z.object({ serviceId: z.uuid(), surchargeId: z.string().min(1).max(64) });

export async function removeSurchargeAction(serviceId: string, surchargeId: string): Promise<void> {
  const { business } = await requireOwner();
  const parsed = removeSchema.safeParse({ serviceId, surchargeId });
  if (!business || !parsed.success) return;

  await getRepositories().catalog.removeSurcharge(business.id, parsed.data.serviceId, parsed.data.surchargeId);
  refresh();
}
