export const MAX_IMAGE_BYTES = 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

export type ImageCheck = { ok: true; type: ImageType } | { ok: false; message: string };

export interface ImageStorage {
  // name is a path without extension, such as "logos/<business id>"; returns the public URL.
  save(name: string, bytes: Uint8Array, type: ImageType): Promise<string>;
  remove(url: string): Promise<void>;
}

const SIGNATURES: { type: ImageType; offset: number; bytes: number[] }[] = [
  { type: "image/png", offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "image/jpeg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { type: "image/webp", offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
];

// The browser's file type and extension are whatever the sender says; the first bytes are what the file is.
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const isRiff = [0x52, 0x49, 0x46, 0x46].every((byte, i) => bytes[i] === byte);
  for (const signature of SIGNATURES) {
    if (signature.type === "image/webp" && !isRiff) continue;
    if (signature.bytes.every((byte, i) => bytes[signature.offset + i] === byte)) return signature.type;
  }
  return null;
}

export function checkImage(bytes: Uint8Array): ImageCheck {
  if (bytes.length === 0) return { ok: false, message: "Choose an image" };
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, message: "The image must be 1 MB or smaller" };
  const type = detectImageType(bytes);
  if (!type) return { ok: false, message: "Use a PNG, JPEG or WebP image" };
  return { ok: true, type };
}
