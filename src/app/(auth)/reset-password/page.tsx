import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Set a new password</h1>
        <p className="text-muted">You will be signed in here, and signed out on every other device.</p>
      </div>
      <Suspense>
        <TokenForm searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TokenForm({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token } = await searchParams;
  if (typeof token !== "string" || token === "") {
    return (
      <p className="text-muted">
        This link is incomplete. Open the one from the email again, or{" "}
        <Link href="/forgot-password" className="font-semibold text-ink underline underline-offset-4">
          ask for a new one
        </Link>
        .
      </p>
    );
  }
  return <ResetPasswordForm token={token} />;
}
