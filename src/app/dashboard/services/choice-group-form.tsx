"use client";

import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import type { ChoiceGroup, ChoiceOption, PricingKind } from "@/domain/pricing/types";
import { MAX_CHOICE_OPTIONS, MIN_CHOICE_OPTIONS } from "@/domain/pricing/validate-service";
import { UNIT_LABELS } from "@/lib/describe-rule";
import type { ChoiceGroupFormState } from "./choice-group-actions";

type ChoiceGroupFormProps = {
  kind: PricingKind;
  initial?: ChoiceGroup;
  state: ChoiceGroupFormState;
  pending: boolean;
  submitLabel: [idle: string, busy: string];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

type Row = { key: number; option?: ChoiceOption };

const euros = (amount: number) => (amount === 0 ? "" : (amount / 100).toFixed(amount % 100 === 0 ? 0 : 2));

// Used to add a group and to edit one; an edited option posts its id, so it keeps its photo.
export function ChoiceGroupForm({ kind, initial, state, pending, submitLabel, onSubmit, onCancel }: ChoiceGroupFormProps) {
  // Row keys only; the values live in the inputs, so React never has to mirror what the owner types.
  const [rows, setRows] = useState<Row[]>(() =>
    initial ? initial.options.map((option, key) => ({ key, option })) : Array.from({ length: MIN_CHOICE_OPTIONS }, (_, key) => ({ key })),
  );
  const errors = state.fieldErrors;

  return (
    <form method="post" onSubmit={onSubmit} className="flex animate-rise flex-col gap-4 rounded-field bg-surface p-4" noValidate>
      <Field label="Group name" name="groupLabel" placeholder="Fabric" defaultValue={initial?.label} error={errors.groupLabel} className="sm:max-w-xs" />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Options the customer picks one of</legend>
        {rows.map(({ key, option }, index) => (
          <div key={key} className="grid grid-cols-[minmax(0,1fr)_6rem_auto] gap-2 rounded-field border border-rule bg-field p-3">
            <input type="hidden" name="optionId" value={option?.id ?? ""} />
            <Field
              label={`Option ${index + 1}`}
              name="optionLabel"
              placeholder={index === 0 ? "Basic" : "Blackout"}
              defaultValue={option?.label}
              error={errors[`option-${index}-label`]}
              className="col-span-3"
            />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Adds</span>
              <select name="optionKind" defaultValue={option?.kind ?? "rate"} className={inputClass}>
                <option value="rate">€ {UNIT_LABELS[kind]}</option>
                <option value="flat">€ once</option>
              </select>
            </label>
            <Field
              label="€"
              name="optionAmount"
              inputMode="decimal"
              placeholder="0"
              defaultValue={option ? euros(option.amount) : undefined}
              error={errors[`option-${index}-amount`]}
            />
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((x) => x.key !== key))}
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
            onClick={() => setRows((r) => [...r, { key: Math.max(...r.map((x) => x.key)) + 1 }])}
            className="tap-target self-start text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            + Another option
          </button>
        )}
        <p className="text-xs text-muted">
          Leave € empty for an option that is included in the price.{initial && " Removing an option also deletes its photo."}
        </p>
      </fieldset>
      {(state.message ?? errors.options) && (
        <p role="alert" className="animate-shake text-sm text-error">
          {state.message ?? errors.options}
        </p>
      )}
      <div className="flex items-center gap-4">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? submitLabel[1] : submitLabel[0]}
        </PrimaryButton>
        <button type="button" onClick={onCancel} className="tap-target text-sm font-medium text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
