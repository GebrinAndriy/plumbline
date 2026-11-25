"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db/get-repositories";
import { removeChoiceImage, replaceChoiceImage } from "@/domain/catalog/choice-image";
import { requireOwner } from "@/lib/auth/current-owner";
import { fileBytes, imageFileSchema } from "@/lib/image-file-schema";
import { getImageStorage } from "@/lib/storage/vercel-blob-image-storage";

export type ChoiceImageState = { message?: string };

const targetSchema = z.object({
  serviceId: z.uuid(),
  groupId: z.string().min(1).max(64),
  optionId: z.string().min(1).max(64),
});

type Target = z.infer<typeof targetSchema>;

async function context(target: Target) {
  const { business } = await requireOwner();
  const parsed = targetSchema.safeParse(target);
  const storage = getImageStorage();
  if (!business || !parsed.success) return { error: "This option no longer exists" } as const;
  if (!storage) return { error: "Photo uploads are not set up on this server" } as const;
  return { deps: { catalog: getRepositories().catalog, storage }, target: { businessId: business.id, ...parsed.data } } as const;
}

export async function uploadChoiceImageAction(
  target: Target,
  _previous: ChoiceImageState,
  formData: FormData,
): Promise<ChoiceImageState> {
  const ready = await context(target);
  if ("error" in ready) return { message: ready.error };

  const file = imageFileSchema.safeParse(formData.get("photo"));
  if (!file.success) return { message: file.error.issues[0].message };

  const result = await replaceChoiceImage(ready.deps, ready.target, await fileBytes(file.data));
  if (!result.ok) return { message: result.message };
  refresh();
  return {};
}

export async function removeChoiceImageAction(target: Target): Promise<void> {
  const ready = await context(target);
  if ("error" in ready) return;
  await removeChoiceImage(ready.deps, ready.target);
  refresh();
}
