"use client";

import { useState } from "react";
import { useFormSubmit } from "@/components/use-form-submit";
import type { PricingKind } from "@/domain/pricing/types";
import type { ChoiceGroupFormState } from "./choice-group-actions";
import { ChoiceGroupForm } from "./choice-group-form";

const INITIAL: ChoiceGroupFormState = { fieldErrors: {} };

type AddChoiceGroupProps = {
  kind: PricingKind;
  action: (state: ChoiceGroupFormState, formData: FormData) => Promise<ChoiceGroupFormState>;
};

export function AddChoiceGroup({ kind, action }: AddChoiceGroupProps) {
  const [open, setOpen] = useState(false);
  const { state, onSubmit, pending } = useFormSubmit(action, INITIAL);

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
    <ChoiceGroupForm
      kind={kind}
      state={state}
      pending={pending}
      submitLabel={["Add group", "Adding…"]}
      onSubmit={onSubmit}
      onCancel={() => setOpen(false)}
    />
  );
}
