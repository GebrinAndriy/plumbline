"use client";

import { UploadSimpleIcon } from "@phosphor-icons/react/dist/csr/UploadSimple";
import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import { LOGO_TYPES, MAX_LOGO_BYTES } from "@/domain/catalog/logo";
import { saveLogoAction, type LogoFormState } from "./logo-actions";

const INITIAL: LogoFormState = {};

type Selection = { previewUrl: string; error?: string; forState: LogoFormState };

type Props = { logoUrl: string | null; uploadsEnabled: boolean };

export function LogoForm({ logoUrl, uploadsEnabled }: Props) {
  const { state, onSubmit, pending } = useFormSubmit(saveLogoAction, INITIAL);
  const [selection, setSelection] = useState<Selection | null>(null);
  // A successful upload replaces the preview with the saved logo; a refused one keeps it to retry.
  const preview = selection && !(selection.forState !== state && state.saved) ? selection : null;
  const message = preview?.error ?? state.message;

  function onChoose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (selection) URL.revokeObjectURL(selection.previewUrl);
    if (!file) return setSelection(null);
    const error = !(LOGO_TYPES as readonly string[]).includes(file.type)
      ? "Use a PNG, JPEG or WebP image"
      : file.size > MAX_LOGO_BYTES
        ? "The image must be 1 MB or smaller"
        : undefined;
    setSelection({ previewUrl: URL.createObjectURL(file), error, forState: state });
  }

  return (
    <section aria-labelledby="logo-title" className="flex flex-col gap-4 rounded-card border border-rule bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h2 id="logo-title" className="font-serif text-xl font-medium">
          Logo
        </h2>
        <p className="text-sm text-muted">Shown at the top of your page, above your business name.</p>
      </div>
      {!uploadsEnabled ? (
        <p className="text-sm text-muted">Logo uploads are not set up on this server yet.</p>
      ) : (
        <>
          <div className="relative grid h-20 place-items-center overflow-hidden rounded-field border border-rule bg-white">
            {preview && !preview.error ? (
              <Image src={preview.previewUrl} alt="New logo preview" fill unoptimized className="object-contain p-3" />
            ) : logoUrl ? (
              <Image src={logoUrl} alt="Current logo" fill sizes="320px" className="object-contain p-3" />
            ) : (
              <span className="text-sm text-disabled-text">No logo yet</span>
            )}
          </div>
          <form method="post" onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
            <p className="text-sm text-muted">PNG, JPEG or WebP, up to 1 MB. A wide logo on a transparent background looks best.</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-field border border-control bg-white px-4 text-sm font-semibold transition-colors hover:border-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink">
                <UploadSimpleIcon weight="bold" aria-hidden className="size-4" />
                {logoUrl ? "Choose a new image" : "Choose image"}
                <input
                  key={JSON.stringify(state)}
                  type="file"
                  name="logo"
                  accept={LOGO_TYPES.join(",")}
                  onChange={onChoose}
                  aria-invalid={message ? true : undefined}
                  aria-describedby={message ? "logo-message" : undefined}
                  className="sr-only"
                />
              </label>
              {preview && !preview.error && (
                <PrimaryButton type="submit" disabled={pending} className="text-sm">
                  {pending ? "Uploading…" : "Save logo"}
                </PrimaryButton>
              )}
            </div>
          </form>
          {logoUrl && !preview && (
            <form method="post" onSubmit={onSubmit}>
              <input type="hidden" name="intent" value="remove" />
              <button
                type="submit"
                disabled={pending}
                className="tap-target text-sm font-medium text-muted underline underline-offset-4 hover:text-error"
              >
                {pending ? "Removing…" : "Remove logo"}
              </button>
            </form>
          )}
          {message && (
            <p id="logo-message" role="alert" className="animate-shake text-sm text-error">
              {message}
            </p>
          )}
          {!pending && !message && !preview && state.saved && (
            <p role="status" className="text-sm text-success">
              {state.saved === "uploaded" ? "Saved. Your page shows the new logo." : "Removed. Your page shows only your name."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
