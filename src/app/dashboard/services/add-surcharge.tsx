"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import type { Surcharge } from "@/domain/pricing/types";
import type { SurchargeFormState } from "./surcharge-actions";

const INITIAL: SurchargeFormState = { fieldErrors: {} };

type AddSurchargeProps = {
  action: (state: SurchargeFormState, formData: FormData) => Promise<SurchargeFormState>;
};

export function AddSurcharge({ action }: AddSurchargeProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Surcharge["kind"]>("flat");
  const { state, onSubmit, pending } = useFormSubmit(action, INITIAL);
  const errors = state.fieldErrors;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-sm font-medium underline underline-offset-4"
      >
        Add option
      </button>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Option name" name="label" placeholder="Installation" error={errors.label} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Adds</span>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as Surcharge["kind"])}
            className={inputClass}
          >
            <option value="flat">A fixed amount</option>
            <option value="percent">A percent of the price</option>
          </select>
        </label>
        {kind === "flat" ? (
          <Field label="Amount, UAH" name="amount" inputMode="decimal" error={errors.amount} />
        ) : (
          <Field label="Percent" name="percent" inputMode="numeric" error={errors.percent} />
        )}
      </div>
      {state.message && (
        <p role="alert" className="animate-shake text-sm text-error">
          {state.message}
        </p>
      )}
      <div className="flex items-center gap-4">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add option"}
        </PrimaryButton>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-medium underline underline-offset-4">
          Cancel
        </button>
      </div>
    </form>
  );
}
