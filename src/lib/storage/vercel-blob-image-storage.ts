import "server-only";
import { del, put } from "@vercel/blob";
import type { ImageStorage, ImageType } from "@/domain/catalog/image-file";

const EXTENSIONS: Record<ImageType, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const ONE_YEAR = 60 * 60 * 24 * 365;

export function createVercelBlobImageStorage(token: string): ImageStorage {
  return {
    async save(name, bytes, type) {
      // A random suffix gives every upload a new address, so the CDN never serves a replaced image.
      const blob = await put(`${name}.${EXTENSIONS[type]}`, new Blob([new Uint8Array(bytes)], { type }), {
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
        console.error(`Could not delete the replaced image ${url}`, error);
      }
    },
  };
}

export function getImageStorage(): ImageStorage | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token ? createVercelBlobImageStorage(token) : null;
}
