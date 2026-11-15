"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db/get-repositories";
import { requireOwner } from "@/lib/auth/current-owner";
import { toFieldErrors, type FieldErrors } from "@/lib/field-errors";
import { serviceFormSchema } from "./service-form-schema";

export type ServiceFormState = { fieldErrors: FieldErrors; message?: string };

export async function createServiceAction(
  _previous: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const { business } = await requireOwner();
  if (!business) return { fieldErrors: {}, message: "This account has no business" };

  const parsed = serviceFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  await getRepositories().catalog.createService({ businessId: business.id, ...parsed.data, surcharges: [] });
  refresh();
  return { fieldErrors: {} };
}

const visibilitySchema = z.object({ serviceId: z.uuid(), isActive: z.boolean() });

// Bound arguments come from the browser too, so they are validated like form fields.
export async function setServiceActiveAction(serviceId: string, isActive: boolean): Promise<void> {
  const { business } = await requireOwner();
  const parsed = visibilitySchema.safeParse({ serviceId, isActive });
  if (!business || !parsed.success) return;

  await getRepositories().catalog.setServiceActive(business.id, parsed.data.serviceId, parsed.data.isActive);
  refresh();
}
