"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import type { PricingKind } from "@/domain/pricing/types";
import { MAX_CHOICE_OPTIONS, MIN_CHOICE_OPTIONS } from "@/domain/pricing/validate-service";
import { UNIT_LABELS } from "@/lib/describe-rule";
import type { ChoiceGroupFormState } from "./choice-group-actions";

const INITIAL: ChoiceGroupFormState = { fieldErrors: {} };

type AddChoiceGroupProps = {
  kind: PricingKind;
  action: (state: ChoiceGroupFormState, formData: FormData) => Promise<ChoiceGroupFormState>;
};

export function AddChoiceGroup({ kind, action }: AddChoiceGroupProps) {
  const [open, setOpen] = useState(false);
  // Row keys only; the values live in the inputs, so React never has to mirror what the owner types.
  const [rows, setRows] = useState(() => Array.from({ length: MIN_CHOICE_OPTIONS }, (_, i) => i));
  const { state, onSubmit, pending } = useFormSubmit(action, INITIAL);
  const errors = state.fieldErrors;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-target self-start text-sm font-semibold text-accent underline-offset-4 hover:underline"
      >
        <span aria-hidden>+ </span>Add choice group
      </button>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} className="flex animate-rise flex-col gap-4 rounded-field bg-surface p-4" noValidate>
      <Field label="Group name" name="groupLabel" placeholder="Fabric" error={errors.groupLabel} className="sm:max-w-xs" />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Options the customer picks one of</legend>
        {rows.map((row, index) => (
          <div key={row} className="grid grid-cols-[minmax(0,1fr)_6rem_auto] gap-2 rounded-field border border-rule bg-field p-3">
            <Field
              label={`Option ${index + 1}`}
              name="optionLabel"
              placeholder={index === 0 ? "Basic" : "Blackout"}
              error={errors[`option-${index}-label`]}
              className="col-span-3"
            />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Adds</span>
              <select name="optionKind" defaultValue="rate" className={inputClass}>
                <option value="rate">€ {UNIT_LABELS[kind]}</option>
                <option value="flat">€ once</option>
              </select>
            </label>
            <Field label="€" name="optionAmount" inputMode="decimal" placeholder="0" error={errors[`option-${index}-amount`]} />
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((x) => x !== row))}
              disabled={rows.length <= MIN_CHOICE_OPTIONS}
              aria-label={`Remove option ${index + 1}`}
              className="tap-target mt-7 grid size-9 place-items-center self-start rounded-full text-muted hover:bg-error-soft hover:text-error disabled:invisible"
            >
              <span aria-hidden>×</span>
            </button>
          </div>
        ))}
        {rows.length < MAX_CHOICE_OPTIONS && (
          <button
            type="button"
            onClick={() => setRows((r) => [...r, Math.max(...r) + 1])}
            className="tap-target self-start text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            + Another option
          </button>
        )}
        <p className="text-xs text-muted">Leave € empty for an option that is included in the price.</p>
      </fieldset>
      {(state.message ?? errors.options) && (
        <p role="alert" className="animate-shake text-sm text-error">
          {state.message ?? errors.options}
        </p>
      )}
      <div className="flex items-center gap-4">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add group"}
        </PrimaryButton>
        <button type="button" onClick={() => setOpen(false)} className="tap-target text-sm font-medium text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
