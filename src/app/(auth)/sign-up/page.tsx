import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-[0.13em] text-accent uppercase">Free while in early access</p>
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Create your business</h1>
        <p className="text-muted">
          Your page with prices in about ten minutes. Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
      <SignUpForm />
    </>
  );
}
