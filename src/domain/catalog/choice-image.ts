import type { CatalogRepository, ChoiceImageTarget } from "./catalog";
import type { ChoiceGroup } from "../pricing/types";
import { checkImage, type ImageCheck, type ImageStorage } from "./image-file";

type Deps = { catalog: CatalogRepository; storage: ImageStorage };

const GONE: ImageCheck = { ok: false, message: "This option no longer exists" };

// Upload first, then point the option at it, then delete the old file: a failure never leaves a broken photo.
export async function replaceChoiceImage({ catalog, storage }: Deps, target: ChoiceImageTarget, bytes: Uint8Array): Promise<ImageCheck> {
  const check = checkImage(bytes);
  if (!check.ok) return check;

  const url = await storage.save(`choices/${target.businessId}/${target.optionId}`, bytes, check.type);
  let result: Awaited<ReturnType<CatalogRepository["setChoiceImage"]>>;
  try {
    result = await catalog.setChoiceImage(target, url);
  } catch (error) {
    await storage.remove(url);
    throw error;
  }
  if (!result) {
    await storage.remove(url);
    return GONE;
  }
  if (result.previous) await storage.remove(result.previous);
  return check;
}

export async function removeChoiceImage({ catalog, storage }: Deps, target: ChoiceImageTarget): Promise<void> {
  const result = await catalog.setChoiceImage(target, null);
  if (result?.previous) await storage.remove(result.previous);
}

export async function removeChoiceGroup(
  { catalog, storage }: Deps,
  businessId: string,
  serviceId: string,
  groupId: string,
): Promise<void> {
  const photos = await catalog.removeChoiceGroup(businessId, serviceId, groupId);
  await Promise.all(photos.map((url) => storage.remove(url)));
}

// False when the service or group is gone; photos of options that were dropped are deleted from storage.
export async function updateChoiceGroup(
  { catalog, storage }: Deps,
  businessId: string,
  serviceId: string,
  group: ChoiceGroup,
): Promise<boolean> {
  const result = await catalog.updateChoiceGroup(businessId, serviceId, group);
  if (!result) return false;
  await Promise.all(result.removedPhotos.map((url) => storage.remove(url)));
  return true;
}
