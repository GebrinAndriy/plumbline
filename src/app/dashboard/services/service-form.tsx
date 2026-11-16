"use client";

import { useState } from "react";
import { Field } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import type { ServiceDetails } from "@/domain/catalog/catalog";
import type { PricingKind } from "@/domain/pricing/types";
import type { ServiceFormState } from "./actions";
import { ruleFormValues } from "./rule-form-values";

const KIND_LABELS: Record<PricingKind, string> = {
  per_area: "By area (m²)",
  per_hour: "By the hour",
  fixed: "Fixed price per item",
};

const INITIAL: ServiceFormState = { fieldErrors: {} };

type ServiceFormProps = {
  action: (state: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;
  initial?: ServiceDetails;
  submitLabel: string;
  pendingLabel: string;
};

export function ServiceForm({ action, initial, submitLabel, pendingLabel }: ServiceFormProps) {
  const [kind, setKind] = useState<PricingKind>(initial?.rule.kind ?? "per_area");
  const { state, onSubmit, pending } = useFormSubmit(action, INITIAL);
  const errors = state.fieldErrors;
  const values = initial && initial.rule.kind === kind ? ruleFormValues(initial.rule) : {};

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field
        label="Service name"
        name="name"
        required
        placeholder="Roller blinds"
        defaultValue={initial?.name}
        error={errors.name}
      />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">How is it priced?</span>
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as PricingKind)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
        >
          {Object.entries(KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {kind === "per_area" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Price per m², UAH"
            name="ratePerSqm"
            inputMode="decimal"
            defaultValue={values.ratePerSqm}
            error={errors.ratePerSqm}
          />
          <Field
            label="Minimum order, UAH (optional)"
            name="minimumTotal"
            inputMode="decimal"
            defaultValue={values.minimumTotal}
            error={errors.minimumTotal}
          />
        </div>
      )}
      {kind === "per_hour" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Price per hour, UAH"
            name="ratePerHour"
            inputMode="decimal"
            defaultValue={values.ratePerHour}
            error={errors.ratePerHour}
          />
          <Field
            label="Minimum hours (optional)"
            name="minimumHours"
            inputMode="decimal"
            defaultValue={values.minimumHours}
            error={errors.minimumHours}
          />
        </div>
      )}
      {kind === "fixed" && (
        <Field
          label="Price per item, UAH"
          name="price"
          inputMode="decimal"
          defaultValue={values.price}
          error={errors.price}
        />
      )}

      {state.message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      {state.saved && !pending && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Saved. New requests use the new price; earlier requests keep theirs.
        </p>
      )}
      <PrimaryButton type="submit" disabled={pending} className="self-start">
        {pending ? pendingLabel : submitLabel}
      </PrimaryButton>
    </form>
  );
}
