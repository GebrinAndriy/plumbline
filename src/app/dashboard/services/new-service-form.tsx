"use client";

import { useState } from "react";
import { Field } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import type { PricingKind } from "@/domain/pricing/types";
import { createServiceAction, type ServiceFormState } from "./actions";

const KIND_LABELS: Record<PricingKind, string> = {
  per_area: "By area (m²)",
  per_hour: "By the hour",
  fixed: "Fixed price per item",
};

const INITIAL: ServiceFormState = { fieldErrors: {} };

export function NewServiceForm() {
  const [kind, setKind] = useState<PricingKind>("per_area");
  const { state, onSubmit, pending } = useFormSubmit(createServiceAction, INITIAL);
  const errors = state.fieldErrors;

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field label="Service name" name="name" required placeholder="Roller blinds" error={errors.name} />
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
          <Field label="Price per m², UAH" name="ratePerSqm" inputMode="decimal" error={errors.ratePerSqm} />
          <Field label="Minimum order, UAH (optional)" name="minimumTotal" inputMode="decimal" error={errors.minimumTotal} />
        </div>
      )}
      {kind === "per_hour" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price per hour, UAH" name="ratePerHour" inputMode="decimal" error={errors.ratePerHour} />
          <Field label="Minimum hours (optional)" name="minimumHours" inputMode="decimal" error={errors.minimumHours} />
        </div>
      )}
      {kind === "fixed" && (
        <Field label="Price per item, UAH" name="price" inputMode="decimal" error={errors.price} />
      )}

      {state.message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      <PrimaryButton type="submit" disabled={pending} className="self-start">
        {pending ? "Adding…" : "Add service"}
      </PrimaryButton>
    </form>
  );
}
