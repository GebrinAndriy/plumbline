import "server-only";
import { del, put } from "@vercel/blob";
import type { LogoStorage, LogoType } from "@/domain/catalog/logo";

const EXTENSIONS: Record<LogoType, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const ONE_YEAR = 60 * 60 * 24 * 365;

export function createVercelBlobLogoStorage(token: string): LogoStorage {
  return {
    async save(businessId, bytes, type) {
      // A random suffix gives every upload a new address, so the CDN never serves a replaced logo.
      const blob = await put(`logos/${businessId}.${EXTENSIONS[type]}`, new Blob([new Uint8Array(bytes)], { type }), {
        access: "public",
        addRandomSuffix: true,
        contentType: type,
        cacheControlMaxAge: ONE_YEAR,
        token,
      });
      return blob.url;
    },

    async remove(url) {
      try {
        await del(url, { token });
      } catch (error) {
        console.error(`Could not delete the replaced logo ${url}`, error);
      }
    },
  };
}

export function getLogoStorage(): LogoStorage | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token ? createVercelBlobLogoStorage(token) : null;
}
