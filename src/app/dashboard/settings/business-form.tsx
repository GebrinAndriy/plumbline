"use client";

import { useState } from "react";
import { Field } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import { SlugField } from "../../(auth)/sign-up/slug-field";
import { saveBusinessAction, type BusinessFormState } from "./business-actions";

const INITIAL: BusinessFormState = { fieldErrors: {} };

export function BusinessForm({ name, slug }: { name: string; slug: string }) {
  const { state, onSubmit, pending } = useFormSubmit(saveBusinessAction, INITIAL);
  const [address, setAddress] = useState(slug);
  const [edited, setEdited] = useState<string[]>([]);
  // An error disappears as soon as its field is edited, not only after the next save.
  const errors = Object.fromEntries(Object.entries(state.fieldErrors).filter(([field]) => !edited.includes(field)));
  const changesAddress = address.trim().toLowerCase() !== slug;

  return (
    <section aria-labelledby="business-title" className="flex flex-col gap-4 rounded-card border border-rule bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h2 id="business-title" className="font-serif text-xl font-medium">
          Business
        </h2>
        <p className="text-sm text-muted">The name on your page and the address customers open.</p>
      </div>
      <form
        method="post"
        onSubmit={(event) => {
          setEdited([]);
          onSubmit(event);
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        <Field
          label="Business name"
          name="businessName"
          defaultValue={name}
          autoComplete="organization"
          onChange={() => setEdited((e) => [...e, "businessName"])}
          error={errors.businessName}
        />
        <SlugField
          value={address}
          error={errors.slug}
          onChange={(value) => {
            setAddress(value);
            setEdited((e) => [...e, "slug"]);
          }}
        />
        {changesAddress && (
          <p className="rounded-field bg-quoted-soft px-3 py-2 text-sm text-quoted">
            The old address <span className="font-semibold">/b/{slug}</span> will keep working and send customers to the new one.
          </p>
        )}
        {state.message && (
          <p role="alert" className="animate-shake text-sm text-error">
            {state.message}
          </p>
        )}
        {state.saved && !pending && (
          <p role="status" className="text-sm text-success">
            {state.movedFrom ? `Saved. /b/${state.movedFrom} now redirects to /b/${slug}.` : "Saved."}
          </p>
        )}
        <PrimaryButton type="submit" disabled={pending} className="self-start text-sm">
          {pending ? "Saving…" : "Save business"}
        </PrimaryButton>
      </form>
    </section>
  );
}
