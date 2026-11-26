"use client";

import { useState, type ReactNode } from "react";
import { useFormSubmit } from "@/components/use-form-submit";
import type { ChoiceGroup, PricingKind } from "@/domain/pricing/types";
import type { ChoiceGroupFormState } from "./choice-group-actions";
import { ChoiceGroupForm } from "./choice-group-form";
import { RemoveOption } from "./remove-option";

const INITIAL: ChoiceGroupFormState = { fieldErrors: {} };

type ChoiceGroupCardProps = {
  group: ChoiceGroup;
  kind: PricingKind;
  // The options with their photo controls, rendered on the server.
  options: ReactNode;
  update: (state: ChoiceGroupFormState, formData: FormData) => Promise<ChoiceGroupFormState>;
  remove: () => Promise<void>;
};

export function ChoiceGroupCard({ group, kind, options, update, remove }: ChoiceGroupCardProps) {
  const { state, onSubmit, pending } = useFormSubmit(update, INITIAL);
  // The state the form was opened with: a newer saved state means this edit went through, so it closes.
  const [openedWith, setOpenedWith] = useState<ChoiceGroupFormState | null>(null);
  const editing = openedWith !== null && !(state !== openedWith && state.saved);

  return (
    <li className="animate-rise rounded-field border border-rule">
      <div className="flex items-center gap-3 border-b border-rule px-3.5 py-2.5">
        <span className="flex-1 font-semibold">{group.label}</span>
        {!editing && (
          <button
            type="button"
            onClick={() => setOpenedWith(state)}
            aria-label={`Edit ${group.label}`}
            className="tap-target text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Edit
          </button>
        )}
        <RemoveOption label={group.label} action={remove} />
      </div>
      {editing ? (
        <div className="p-2">
          <ChoiceGroupForm
            kind={kind}
            initial={group}
            // Errors from an earlier, cancelled edit stay behind; only this edit's result is shown.
            state={state === openedWith ? INITIAL : state}
            pending={pending}
            submitLabel={["Save group", "Saving…"]}
            onSubmit={onSubmit}
            onCancel={() => setOpenedWith(null)}
          />
        </div>
      ) : (
        options
      )}
    </li>
  );
}
