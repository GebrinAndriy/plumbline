import { z } from "zod";
import { MAX_IMAGE_BYTES } from "@/domain/catalog/image-file";

// The size is checked before the file is read; its real type is checked by its bytes in the domain.
export const imageFileSchema = z
  .instanceof(File, { message: "Choose an image" })
  .refine((file) => file.size > 0, "Choose an image")
  .refine((file) => file.size <= MAX_IMAGE_BYTES, "The image must be 1 MB or smaller");

export async function fileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}
