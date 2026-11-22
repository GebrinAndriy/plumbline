"use client";

import Link from "next/link";
import { Field } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import { signInAction, type AuthFormState } from "../actions";
import { PasswordField } from "../password-field";

const INITIAL: AuthFormState = { fieldErrors: {} };

export function SignInForm() {
  const { state, onSubmit, pending } = useFormSubmit(signInAction, INITIAL);
  const errors = state.fieldErrors;

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <div className="flex flex-col">
        <PasswordField autoComplete="current-password" error={errors.password} />
        <Link href="/forgot-password" className="flex min-h-11 items-center self-end text-sm font-semibold text-accent underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </div>
      {state.message && (
        <p role="alert" className="animate-shake text-sm text-error">
          {state.message}
        </p>
      )}
      <PrimaryButton type="submit" disabled={pending} className="mt-1">
        {pending ? "Signing in…" : "Sign in"}
      </PrimaryButton>
    </form>
  );
}
