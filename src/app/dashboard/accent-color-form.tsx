"use client";

import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { EyedropperIcon } from "@phosphor-icons/react/dist/csr/Eyedropper";
import { useState } from "react";
import { accentStyle } from "@/components/accent-style";
import { Field } from "@/components/field";
import { PrimaryButton, primaryButtonClass } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  MIN_TEXT_CONTRAST,
  accentContrast,
  normalizeHex,
  readableShade,
} from "@/domain/catalog/accent-color";
import { saveAccentColorAction, type AccentColorFormState } from "./accent-color-actions";

const INITIAL: AccentColorFormState = { fieldErrors: {} };

const swatchClass =
  "relative grid size-11 cursor-pointer place-items-center rounded-full ring-offset-2 ring-offset-surface has-checked:ring-2 has-checked:ring-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ink";

export function AccentColorForm({ accentColor }: { accentColor: string | null }) {
  const { state, onSubmit, pending } = useFormSubmit(saveAccentColorAction, INITIAL);
  const [text, setText] = useState(accentColor ?? DEFAULT_ACCENT);
  const color = normalizeHex(text);
  const contrast = color ? accentContrast(color) : 0;
  const readable = contrast >= MIN_TEXT_CONTRAST;
  const isPreset = ACCENT_PRESETS.some((preset) => preset.hex === color);
  const liveError = !color
    ? "Enter a colour like #1d4ed8"
    : !readable
      ? `Too light to read on your page: ${contrast.toFixed(1)}:1, needs ${MIN_TEXT_CONTRAST}:1`
      : undefined;
  const fieldError = liveError ?? state.fieldErrors.accentColor;

  return (
    <section aria-labelledby="accent-title" className="flex flex-col gap-4 rounded-card border border-rule bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h2 id="accent-title" className="font-serif text-xl font-medium">
          Brand colour
        </h2>
        <p className="text-sm text-muted">Buttons, links and prices on your page use it.</p>
      </div>
      <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Colour</legend>
          {ACCENT_PRESETS.map((preset) => (
            <label key={preset.hex} title={preset.name} className={`${swatchClass} text-white`} style={{ backgroundColor: preset.hex }}>
              <input
                type="radio"
                name="preset"
                aria-label={preset.name}
                checked={color === preset.hex}
                onChange={() => setText(preset.hex)}
                className="sr-only"
              />
              {color === preset.hex && <CheckIcon weight="bold" aria-hidden className="size-5" />}
            </label>
          ))}
          <label title="Your own colour" className={`${swatchClass} border border-control bg-white text-ink`}>
            <input
              type="color"
              aria-label="Your own colour"
              value={color ?? DEFAULT_ACCENT}
              onChange={(event) => setText(event.target.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
            {color && !isPreset ? (
              <span aria-hidden className="size-7 rounded-full" style={{ backgroundColor: color }} />
            ) : (
              <EyedropperIcon weight="duotone" aria-hidden className="size-5" />
            )}
          </label>
        </fieldset>
        <Field
          label="Hex code"
          name="accentColor"
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          error={fieldError}
        />
        {color && !readable && (
          <button
            type="button"
            onClick={() => setText(readableShade(color))}
            className="flex min-h-11 items-center gap-2 self-start text-left text-sm font-semibold underline-offset-4 hover:underline"
          >
            <span aria-hidden className="size-5 shrink-0 rounded-full" style={{ backgroundColor: readableShade(color) }} />
            Use the closest readable shade, {readableShade(color)}
          </button>
        )}
        <AccentPreview color={color && readable ? color : DEFAULT_ACCENT} />
        {state.message && (
          <p role="alert" className="animate-shake text-sm text-error">
            {state.message}
          </p>
        )}
        {state.saved && !pending && (
          <p role="status" className="text-sm text-success">
            Saved. Your page uses the new colour.
          </p>
        )}
        <PrimaryButton type="submit" disabled={pending || !readable} className="self-start text-sm">
          {pending ? "Saving…" : "Save colour"}
        </PrimaryButton>
      </form>
    </section>
  );
}

function AccentPreview({ color }: { color: string }) {
  return (
    <div style={accentStyle(color)} className="flex items-center justify-between gap-3 rounded-field border border-rule bg-receipt p-3">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Preview</p>
        <p className="font-serif text-2xl font-semibold text-accent tabular-nums">€240</p>
      </div>
      <span aria-hidden className={`${primaryButtonClass} px-4 py-2 text-sm`}>
        Send request
      </span>
    </div>
  );
}
