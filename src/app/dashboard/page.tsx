import Link from "next/link";
import { Suspense } from "react";
import { getRepositories } from "@/db/get-repositories";
import type { Business } from "@/domain/catalog/catalog";
import { requireOwner } from "@/lib/auth/current-owner";
import { formatMoney } from "@/lib/format-money";
import { signOutAction } from "../(auth)/actions";
import { LeadStatusControl } from "./lead-status-control";
import { TelegramSettings } from "./telegram-settings";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <OwnerDashboard />
      </Suspense>
    </main>
  );
}

async function OwnerDashboard() {
  const { business } = await requireOwner();

  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{business?.name ?? "Dashboard"}</h1>
          {business && (
            <p className="mt-1 text-sm text-muted">
              Your calculator:{" "}
              <Link href={`/b/${business.slug}`} className="font-medium underline underline-offset-4">
                /b/{business.slug}
              </Link>
              {" · "}
              <Link href="/dashboard/services" className="font-medium underline underline-offset-4">
                Services
              </Link>
            </p>
          )}
        </div>
        <form action={signOutAction}>
          <button type="submit" className="text-sm font-medium underline underline-offset-4">
            Sign out
          </button>
        </form>
      </header>
      {business ? (
        <>
          <RecentLeads business={business} />
          <TelegramSettings chatId={business.telegramChatId} chatName={business.telegramChatName} />
        </>
      ) : (
        <p className="text-muted">This account has no business.</p>
      )}
    </>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Kyiv",
});

async function RecentLeads({ business }: { business: Business }) {
  const leads = await getRepositories().leads.listByBusiness(business.id, { limit: 20 });

  if (leads.length === 0) {
    return (
      <p className="rounded-xl bg-surface p-6 text-muted">
        No requests yet. Share your calculator link with customers.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-lg font-semibold">Recent requests</h2>
      <ul className="divide-y divide-rule rounded-xl border border-rule">
        {leads.map((lead) => (
          <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="font-medium">{lead.customerName}</p>
              <p className="text-sm text-muted">
                <a href={`tel:${lead.phone}`}>{lead.phone}</a> · {dateFormat.format(lead.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">{formatMoney(lead.quote.total)}</p>
              <LeadStatusControl leadId={lead.id} status={lead.status} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
