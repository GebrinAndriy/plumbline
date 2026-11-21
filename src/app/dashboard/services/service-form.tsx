"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import type { ServiceDetails } from "@/domain/catalog/catalog";
import type { PricingKind } from "@/domain/pricing/types";
import type { ServiceFormState } from "./actions";
import { draftPriceExample, priceExample } from "./price-example";
import { PricingKindPicker } from "./pricing-kind-picker";
import { ruleFormValues } from "./rule-form-values";

const INITIAL: ServiceFormState = { fieldErrors: {} };

type ServiceFormProps = {
  action: (state: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;
  initial?: ServiceDetails;
  submitLabel: string;
  pendingLabel: string;
  onCancel?: () => void;
};

export function ServiceForm({ action, initial, submitLabel, pendingLabel, onCancel }: ServiceFormProps) {
  const [kind, setKind] = useState<PricingKind>(initial?.rule.kind ?? "per_area");
  const [example, setExample] = useState(() => (initial ? priceExample(initial.rule) : null));
  const { state, onSubmit, pending } = useFormSubmit(action, INITIAL);
  const errors = state.fieldErrors;
  const values = initial && initial.rule.kind === kind ? ruleFormValues(initial.rule) : {};

  // Fields are uncontrolled; the example is recomputed from whatever the form holds right now.
  const updateExample = (event: FormEvent<HTMLFormElement>) =>
    setExample(draftPriceExample(Object.fromEntries(new FormData(event.currentTarget))));

  const money = (label: string, name: string, optional = false) => (
    <Field
      key={name}
      label={optional ? `${label} (optional)` : label}
      name={name}
      inputMode="decimal"
      defaultValue={values[name]}
      error={errors[name]}
    />
  );

  return (
    <form method="post" onSubmit={onSubmit} onChange={updateExample} className="flex flex-col gap-5" noValidate>
      <Field label="Service name" name="name" required placeholder="Roller blinds" defaultValue={initial?.name} error={errors.name} />
      <PricingKindPicker value={kind} onChange={setKind} />
      <div className="grid items-end gap-4 sm:grid-cols-2">
        {kind === "per_area" && [money("Price per m², €", "ratePerSqm"), money("Minimum order, €", "minimumTotal", true)]}
        {kind === "per_hour" && [money("Price per hour, €", "ratePerHour"), money("Minimum hours", "minimumHours", true)]}
        {kind === "fixed" && money("Price per item, €", "price")}
      </div>
      <p aria-live="polite" className="rounded-field border border-dashed border-rule bg-receipt px-4 py-3 text-sm">
        <span className="block text-xs font-semibold tracking-[0.13em] text-muted uppercase">A typical order</span>
        {example ? <span className="tabular-nums">{example}</span> : <span className="text-muted">Enter a price to see what customers pay.</span>}
      </p>
      {state.message && (
        <p role="alert" className="animate-shake text-sm text-error">
          {state.message}
        </p>
      )}
      {state.saved && !pending && (
        <p role="status" className="text-sm text-success">
          Saved. New requests use the new price; earlier requests keep theirs.
        </p>
      )}
      <div className="flex items-center gap-4">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </PrimaryButton>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-ink">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
