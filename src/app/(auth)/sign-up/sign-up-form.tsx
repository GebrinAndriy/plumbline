"use client";

import { useState } from "react";
import { Field } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import { suggestSlug } from "@/lib/suggest-slug";
import { signUpAction, type AuthFormState } from "../actions";
import { PasswordField } from "../password-field";
import { SlugField } from "./slug-field";

const INITIAL: AuthFormState = { fieldErrors: {} };

export function SignUpForm() {
  const { state, onSubmit, pending } = useFormSubmit(signUpAction, INITIAL);
  const errors = state.fieldErrors;
  const [typedSlug, setTypedSlug] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  // The address follows the name until the owner edits it by hand.
  const slug = typedSlug ?? suggestSlug(businessName);

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field
        label="Business name"
        name="businessName"
        required
        autoComplete="organization"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        error={errors.businessName}
      />
      <SlugField value={slug} error={errors.slug} onChange={setTypedSlug} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <PasswordField autoComplete="new-password" hint="At least 8 characters" error={errors.password} />
      {state.message && (
        <p role="alert" className="animate-shake text-sm text-error">
          {state.message}
        </p>
      )}
      <PrimaryButton type="submit" disabled={pending} className="mt-1">
        {pending ? "Creating…" : "Create business"}
      </PrimaryButton>
    </form>
  );
}
