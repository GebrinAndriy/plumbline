import type { Business, CatalogRepository } from "./catalog";
import { checkImage, type ImageCheck, type ImageStorage } from "./image-file";

type Deps = { catalog: CatalogRepository; storage: ImageStorage };
type LogoOwner = Pick<Business, "id" | "logoUrl">;

export async function replaceLogo({ catalog, storage }: Deps, business: LogoOwner, bytes: Uint8Array): Promise<ImageCheck> {
  const check = checkImage(bytes);
  if (!check.ok) return check;

  const url = await storage.save(`logos/${business.id}`, bytes, check.type);
  try {
    await catalog.setLogoUrl(business.id, url);
  } catch (error) {
    await storage.remove(url);
    throw error;
  }
  if (business.logoUrl) await storage.remove(business.logoUrl);
  return check;
}

export async function removeLogo({ catalog, storage }: Deps, business: LogoOwner): Promise<void> {
  if (!business.logoUrl) return;
  await catalog.setLogoUrl(business.id, null);
  await storage.remove(business.logoUrl);
}
