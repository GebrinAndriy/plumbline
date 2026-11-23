"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db/get-repositories";
import { MAX_LOGO_BYTES, removeLogo, replaceLogo } from "@/domain/catalog/logo";
import { requireOwner } from "@/lib/auth/current-owner";
import { getLogoStorage } from "@/lib/storage/vercel-blob-logo-storage";

export type LogoFormState = { message?: string; saved?: "uploaded" | "removed" };

const NOT_SET_UP = "Logo uploads are not set up on this server";

const logoFormSchema = z.object({
  logo: z
    .instanceof(File, { message: "Choose an image" })
    .refine((file) => file.size > 0, "Choose an image")
    .refine((file) => file.size <= MAX_LOGO_BYTES, "The image must be 1 MB or smaller"),
});

export async function saveLogoAction(_previous: LogoFormState, formData: FormData): Promise<LogoFormState> {
  const { business } = await requireOwner();
  if (!business) return { message: "This account has no business" };
  const storage = getLogoStorage();
  if (!storage) return { message: NOT_SET_UP };
  const deps = { catalog: getRepositories().catalog, storage };

  if (formData.get("intent") === "remove") {
    await removeLogo(deps, business);
    refresh();
    return { saved: "removed" };
  }

  const parsed = logoFormSchema.safeParse({ logo: formData.get("logo") });
  if (!parsed.success) return { message: parsed.error.issues[0].message };

  const result = await replaceLogo(deps, business, new Uint8Array(await parsed.data.logo.arrayBuffer()));
  if (!result.ok) return { message: result.message };
  refresh();
  return { saved: "uploaded" };
}
