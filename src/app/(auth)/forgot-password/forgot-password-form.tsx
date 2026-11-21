"use client";

import { Field } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import { forgotPasswordAction, type ForgotFormState } from "../password-reset-actions";

const INITIAL: ForgotFormState = { fieldErrors: {} };

export function ForgotPasswordForm() {
  const { state, onSubmit, pending } = useFormSubmit(forgotPasswordAction, INITIAL);

  if (state.sentTo) {
    return (
      <div role="status" className="flex animate-rise flex-col gap-2 rounded-card border border-rule bg-surface p-5">
        <p className="font-serif text-xl">Check your inbox</p>
        <p className="text-muted">
          If there is an account for <span className="font-semibold text-ink">{state.sentTo}</span>, a link to set a
          new password is on its way. It works once, for 30 minutes. Nothing there? Check spam.
        </p>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="Email" name="email" type="email" autoComplete="email" required error={state.fieldErrors.email} />
      {state.message && (
        <p role="alert" className="animate-shake text-sm text-error">
          {state.message}
        </p>
      )}
      <PrimaryButton type="submit" disabled={pending} className="mt-1">
        {pending ? "Sending…" : "Send reset link"}
      </PrimaryButton>
    </form>
  );
}
