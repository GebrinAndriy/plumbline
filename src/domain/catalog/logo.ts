import type { Business, CatalogRepository } from "./catalog";

export const MAX_LOGO_BYTES = 1024 * 1024;
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type LogoType = (typeof LOGO_TYPES)[number];

export type LogoCheck = { ok: true; type: LogoType } | { ok: false; message: string };

export interface LogoStorage {
  save(businessId: string, bytes: Uint8Array, type: LogoType): Promise<string>;
  remove(url: string): Promise<void>;
}

type Deps = { catalog: CatalogRepository; storage: LogoStorage };
type LogoOwner = Pick<Business, "id" | "logoUrl">;

const SIGNATURES: { type: LogoType; offset: number; bytes: number[] }[] = [
  { type: "image/png", offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "image/jpeg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { type: "image/webp", offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
];

// The browser's file type and extension are whatever the sender says; the first bytes are what the file is.
export function detectLogoType(bytes: Uint8Array): LogoType | null {
  const isRiff = [0x52, 0x49, 0x46, 0x46].every((byte, i) => bytes[i] === byte);
  for (const signature of SIGNATURES) {
    if (signature.type === "image/webp" && !isRiff) continue;
    if (signature.bytes.every((byte, i) => bytes[signature.offset + i] === byte)) return signature.type;
  }
  return null;
}

export function checkLogo(bytes: Uint8Array): LogoCheck {
  if (bytes.length === 0) return { ok: false, message: "Choose an image" };
  if (bytes.length > MAX_LOGO_BYTES) return { ok: false, message: "The image must be 1 MB or smaller" };
  const type = detectLogoType(bytes);
  if (!type) return { ok: false, message: "Use a PNG, JPEG or WebP image" };
  return { ok: true, type };
}

export async function replaceLogo({ catalog, storage }: Deps, business: LogoOwner, bytes: Uint8Array): Promise<LogoCheck> {
  const check = checkLogo(bytes);
  if (!check.ok) return check;

  const url = await storage.save(business.id, bytes, check.type);
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
