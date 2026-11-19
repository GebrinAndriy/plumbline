"use client";

import { useState } from "react";
import type { ServiceDetails } from "@/domain/catalog/catalog";
import type { ServiceFormState } from "./actions";
import { ServiceForm } from "./service-form";

type EditServiceProps = {
  service: ServiceDetails;
  action: (state: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;
};

export function EditService({ service, action }: EditServiceProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        aria-expanded={false}
        onClick={() => setOpen(true)}
        className="self-start rounded-field border border-ink px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface"
      >
        Edit service
      </button>
    );
  }

  return (
    <div className="animate-rise border-t border-rule pt-5">
      <ServiceForm
        action={action}
        initial={service}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
