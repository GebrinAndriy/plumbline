"use client";

import { ImageSquareIcon } from "@phosphor-icons/react/dist/csr/ImageSquare";
import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { useFormSubmit } from "@/components/use-form-submit";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/domain/catalog/image-file";
import type { ChoiceImageState } from "./choice-image-actions";

type ChoicePhotoProps = {
  label: string;
  imageUrl?: string;
  upload: (state: ChoiceImageState, formData: FormData) => Promise<ChoiceImageState>;
  remove: () => Promise<void>;
};

export function ChoicePhoto({ label, imageUrl, upload, remove }: ChoicePhotoProps) {
  const { state, onSubmit, pending } = useFormSubmit(upload, {});
  const [error, setError] = useState<string | null>(null);
  const message = error ?? state.message;

  // Uploads as soon as a file is picked; the checks here only save a round trip, the server repeats them.
  function onChoose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const problem = !(IMAGE_TYPES as readonly string[]).includes(file.type)
      ? "Use a PNG, JPEG or WebP image"
      : file.size > MAX_IMAGE_BYTES
        ? "The image must be 1 MB or smaller"
        : null;
    setError(problem);
    if (!problem) event.target.form?.requestSubmit();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {imageUrl && (
          <>
            <Image src={imageUrl} alt="" width={40} height={40} className="size-10 rounded-[6px] border border-rule object-cover" />
            <form action={remove}>
              <button
                type="submit"
                aria-label={`Remove the photo of ${label}`}
                className="tap-target text-xs font-medium text-muted underline-offset-4 hover:text-error hover:underline"
              >
                Remove
              </button>
            </form>
          </>
        )}
        <form method="post" onSubmit={onSubmit}>
          <label
            className={`tap-target flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-accent underline-offset-4 hover:underline has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${pending ? "pointer-events-none opacity-60" : ""}`}
          >
            {!imageUrl && <ImageSquareIcon weight="duotone" aria-hidden className="size-4" />}
            {pending ? "Uploading…" : imageUrl ? "Replace" : "Add photo"}
            <input
              key={imageUrl ?? "none"}
              type="file"
              name="photo"
              accept={IMAGE_TYPES.join(",")}
              onChange={onChoose}
              aria-label={`${imageUrl ? "Replace" : "Add"} a photo of ${label}`}
              className="sr-only"
            />
          </label>
        </form>
      </div>
      {message && (
        <p role="alert" className="text-xs text-error">
          {message}
        </p>
      )}
    </div>
  );
}
