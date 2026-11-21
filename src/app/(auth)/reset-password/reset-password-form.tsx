"use client";

import Link from "next/link";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import type { AuthFormState } from "../actions";
import { PasswordField } from "../password-field";
import { resetPasswordAction } from "../password-reset-actions";

const INITIAL: AuthFormState = { fieldErrors: {} };

export function ResetPasswordForm({ token }: { token: string }) {
  const { state, onSubmit, pending } = useFormSubmit(resetPasswordAction, INITIAL);

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <PasswordField
        autoComplete="new-password"
        label="New password"
        hint="At least 8 characters"
        error={state.fieldErrors.password}
      />
      {state.message && (
        <p role="alert" className="animate-shake text-sm text-error">
          {state.message}{" "}
          <Link href="/forgot-password" className="font-semibold underline underline-offset-4">
            Send a new link
          </Link>
        </p>
      )}
      <PrimaryButton type="submit" disabled={pending} className="mt-1">
        {pending ? "Saving…" : "Save and sign in"}
      </PrimaryButton>
    </form>
  );
}
