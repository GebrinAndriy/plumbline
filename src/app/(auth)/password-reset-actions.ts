"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { getRepositories } from "@/db/get-repositories";
import { normalizeEmail } from "@/domain/auth/account";
import { requestPasswordReset, resetPassword } from "@/domain/auth/password-reset";
import { RATE_LIMITS, retryMessage } from "@/domain/rate-limit/rate-limit";
import { appOrigin } from "@/lib/app-origin";
import { startSession } from "@/lib/auth/current-owner";
import { scryptHasher } from "@/lib/auth/scrypt-hasher";
import { generateSecretToken, hashSecretToken } from "@/lib/auth/secret-token";
import { resetEmail } from "@/lib/email/reset-email";
import { sendEmail } from "@/lib/email/send-email";
import { toFieldErrors } from "@/lib/field-errors";
import { limitByIp, limitBySubject } from "@/lib/rate-limit/rate-limiter";
import type { AuthFormState } from "./actions";
import { forgotPasswordSchema, resetPasswordSchema } from "./auth-schemas";

export type ForgotFormState = AuthFormState & { sentTo?: string };

export async function forgotPasswordAction(
  _previous: ForgotFormState,
  formData: FormData,
): Promise<ForgotFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") ?? undefined });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const byIp = await limitByIp(RATE_LIMITS.passwordResetByIp);
  const limit = byIp.allowed
    ? await limitBySubject(RATE_LIMITS.passwordResetByEmail, normalizeEmail(parsed.data.email))
    : byIp;
  if (!limit.allowed) return { fieldErrors: {}, message: retryMessage(limit.retryAfterMs) };

  const { accounts, passwordResets } = getRepositories();
  const reset = await requestPasswordReset(
    { accounts, resets: passwordResets, generateToken: generateSecretToken, hashToken: hashSecretToken },
    parsed.data.email,
    new Date(),
  );
  // Sent after the response, so its timing does not tell which emails have an account.
  if (reset) {
    after(async () => {
      try {
        const link = `${await appOrigin()}/reset-password?token=${reset.token}`;
        await sendEmail(resetEmail(reset.to, link));
      } catch (error) {
        console.error("Password reset email was not sent:", error instanceof Error ? error.message : error);
      }
    });
  }
  // The same answer whether or not the account exists.
  return { fieldErrors: {}, sentTo: parsed.data.email };
}

export async function resetPasswordAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token") ?? undefined,
    password: formData.get("password") ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { accounts, passwordResets } = getRepositories();
  const result = await resetPassword(
    { accounts, resets: passwordResets, hasher: scryptHasher, hashToken: hashSecretToken },
    parsed.data.token,
    parsed.data.password,
    new Date(),
  );
  if (!result) return { fieldErrors: {}, message: "This link has expired or was already used." };

  await startSession(result.userId);
  redirect("/dashboard");
}
