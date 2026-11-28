"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/dashboard", label: "Requests", section: "/dashboard/leads/" },
  { href: "/dashboard/services", label: "Services", section: "/dashboard/services/" },
  { href: "/dashboard/settings", label: "Settings", section: "/dashboard/settings/" },
] as const;

// The path of a lead page is known only at request time, so the links render first and the highlight streams in.
export function DashboardNav() {
  return (
    <Suspense fallback={<NavLinks pathname={null} />}>
      <CurrentNavLinks />
    </Suspense>
  );
}

function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Dashboard" className="flex gap-1">
      {LINKS.map(({ href, label, section }) => {
        const current = pathname !== null && (pathname === href || pathname.startsWith(section));
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`tap-target rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              current ? "bg-ink text-paper" : "text-muted hover:bg-surface hover:text-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
