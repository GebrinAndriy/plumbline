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

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="self-start text-sm font-medium underline underline-offset-4"
      >
        {open ? "Close" : "Edit"}
      </button>
      {open && <ServiceForm action={action} initial={service} submitLabel="Save changes" pendingLabel="Saving…" />}
    </div>
  );
}
