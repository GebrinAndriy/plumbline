"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db/get-repositories";
import { MAX_CHOICE_GROUPS } from "@/domain/pricing/validate-service";
import { removeChoiceGroup, updateChoiceGroup } from "@/domain/catalog/choice-image";
import { requireOwner } from "@/lib/auth/current-owner";
import { getImageStorage } from "@/lib/storage/vercel-blob-image-storage";
import type { FieldErrors } from "@/lib/field-errors";
import { parseChoiceGroupForm } from "./choice-group-form-schema";

export type ChoiceGroupFormState = { fieldErrors: FieldErrors; message?: string; saved?: boolean };

const NOT_FOUND: ChoiceGroupFormState = { fieldErrors: {}, message: "This service no longer exists" };

export async function addChoiceGroupAction(
  serviceId: string,
  _previous: ChoiceGroupFormState,
  formData: FormData,
): Promise<ChoiceGroupFormState> {
  const { business } = await requireOwner();
  if (!business) return { fieldErrors: {}, message: "This account has no business" };

  const parsed = parseChoiceGroupForm(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const id = z.uuid().safeParse(serviceId);
  if (!id.success) return NOT_FOUND;

  const { groupLabel, options } = parsed.group;
  const result = await getRepositories().catalog.addChoiceGroup(business.id, id.data, {
    id: randomUUID(),
    label: groupLabel,
    options: options.map((option) => ({ ...option, id: randomUUID() })),
  });
  if (result === "not_found") return NOT_FOUND;
  if (result === "limit_reached") {
    return { fieldErrors: {}, message: `A service can have at most ${MAX_CHOICE_GROUPS} choice groups` };
  }
  refresh();
  return { fieldErrors: {} };
}

export async function updateChoiceGroupAction(
  serviceId: string,
  groupId: string,
  _previous: ChoiceGroupFormState,
  formData: FormData,
): Promise<ChoiceGroupFormState> {
  const { business } = await requireOwner();
  if (!business) return { fieldErrors: {}, message: "This account has no business" };

  const parsed = parseChoiceGroupForm(formData);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
  const ids = removeSchema.safeParse({ serviceId, groupId });
  if (!ids.success) return NOT_FOUND;

  const { catalog } = getRepositories();
  const group = {
    id: ids.data.groupId,
    label: parsed.group.groupLabel,
    options: parsed.group.options.map((option) => ({ ...option, id: option.id ?? randomUUID() })),
  };
  const storage = getImageStorage();
  // Without storage no photo could have been uploaded, so there is nothing to delete.
  const updated = storage
    ? await updateChoiceGroup({ catalog, storage }, business.id, ids.data.serviceId, group)
    : (await catalog.updateChoiceGroup(business.id, ids.data.serviceId, group)) !== null;
  if (!updated) return { fieldErrors: {}, message: "This choice group no longer exists" };
  refresh();
  return { fieldErrors: {}, saved: true };
}

const removeSchema = z.object({ serviceId: z.uuid(), groupId: z.string().min(1).max(64) });

export async function removeChoiceGroupAction(serviceId: string, groupId: string): Promise<void> {
  const { business } = await requireOwner();
  const parsed = removeSchema.safeParse({ serviceId, groupId });
  if (!business || !parsed.success) return;

  const { catalog } = getRepositories();
  const storage = getImageStorage();
  const { serviceId: id, groupId: group } = parsed.data;
  // Without storage no photo could have been uploaded, so there is nothing to delete.
  if (storage) await removeChoiceGroup({ catalog, storage }, business.id, id, group);
  else await catalog.removeChoiceGroup(business.id, id, group);
  refresh();
}
