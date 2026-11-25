"use server";

import { refresh } from "next/cache";
import { getRepositories } from "@/db/get-repositories";
import { removeLogo, replaceLogo } from "@/domain/catalog/logo";
import { requireOwner } from "@/lib/auth/current-owner";
import { fileBytes, imageFileSchema } from "@/lib/image-file-schema";
import { getImageStorage } from "@/lib/storage/vercel-blob-image-storage";

export type LogoFormState = { message?: string; saved?: "uploaded" | "removed" };

const NOT_SET_UP = "Logo uploads are not set up on this server";

export async function saveLogoAction(_previous: LogoFormState, formData: FormData): Promise<LogoFormState> {
  const { business } = await requireOwner();
  if (!business) return { message: "This account has no business" };
  const storage = getImageStorage();
  if (!storage) return { message: NOT_SET_UP };
  const deps = { catalog: getRepositories().catalog, storage };

  if (formData.get("intent") === "remove") {
    await removeLogo(deps, business);
    refresh();
    return { saved: "removed" };
  }

  const parsed = imageFileSchema.safeParse(formData.get("logo"));
  if (!parsed.success) return { message: parsed.error.issues[0].message };

  const result = await replaceLogo(deps, business, await fileBytes(parsed.data));
  if (!result.ok) return { message: result.message };
  refresh();
  return { saved: "uploaded" };
}
