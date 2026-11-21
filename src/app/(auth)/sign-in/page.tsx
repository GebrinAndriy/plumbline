import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Welcome back</h1>
        <p className="text-muted">
          Sign in to see your requests. New to Plumbline?{" "}
          <Link href="/sign-up" className="font-semibold text-ink underline underline-offset-4">
            Create your business
          </Link>
        </p>
      </div>
      <SignInForm />
    </>
  );
}
