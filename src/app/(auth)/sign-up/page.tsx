import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <>
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Create your business</h1>
        <p className="mt-1 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
      <SignUpForm />
    </>
  );
}
