import type { Metadata } from "next";
import Link from "next/link";
import { primaryButtonClass } from "@/components/primary-button";
import { secondaryLinkClass, StatusPage } from "@/components/status-page";
import { DEMO_PATH } from "./_landing/site-chrome";

export const metadata: Metadata = { title: "Page not found · Plumbline" };

export default function NotFound() {
  return (
    <StatusPage
      overline="404 · Page not found"
      title="There is no page at this address"
      actions={
        <>
          <Link href="/" className={`${primaryButtonClass} text-center`}>
            Go to the home page
          </Link>
          <Link href={DEMO_PATH} className={secondaryLinkClass}>
            See a demo page →
          </Link>
        </>
      }
    >
      <p>
        The link may have a typo, or the business changed its page address. If someone sent you this link, ask
        them for the current one.
      </p>
    </StatusPage>
  );
}
