"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PrimaryButton } from "@/components/primary-button";
import { secondaryLinkClass, StatusPage } from "@/components/status-page";

type ErrorPageProps = { error: unknown; retry: () => void };

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;

  return (
    <StatusPage
      overline="Something went wrong"
      title="This page could not load"
      actions={
        <>
          <PrimaryButton type="button" onClick={retry}>
            Try again
          </PrimaryButton>
          <Link href="/" className={secondaryLinkClass}>
            Go to the home page
          </Link>
        </>
      }
    >
      <title>Something went wrong · Plumbline</title>
      <p>It is a problem on our side, not with what you entered. Try again in a moment.</p>
      {digest && <p className="mt-3 text-sm">Error reference: {digest}</p>}
    </StatusPage>
  );
}
