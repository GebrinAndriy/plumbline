import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Forgot your password?</h1>
        <p className="text-muted">
          Enter the email you signed up with, and we will send a link to set a new one. Remembered it?{" "}
          <Link href="/sign-in" className="font-semibold text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
