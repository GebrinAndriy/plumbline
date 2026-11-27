import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { PhoneIcon } from "@phosphor-icons/react/dist/ssr/Phone";
import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr/WhatsappLogo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Receipt } from "@/components/receipt";
import { getRepositories } from "@/db/get-repositories";
import { requireOwner } from "@/lib/auth/current-owner";
import { todayInMarket } from "@/lib/calendar-day";
import { phoneHref, whatsappHref } from "@/lib/contact-links";
import { receiptQuote, serviceNames } from "@/lib/describe-lead-item";
import { formatDateTime } from "@/lib/format-date";
import { formatMoney } from "@/lib/format-money";
import { formatPhone } from "@/lib/format-phone";
import { LeadStatusControl } from "../../lead-status-control";
import { LeadNotes } from "./lead-notes";
import { FollowUpCard } from "./follow-up-card";
import { addNoteAction, removeNoteAction, setFollowUpAction } from "./note-actions";
import { StatusHistory } from "./status-history";

const contactButton =
  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-field border border-control bg-field px-4 text-[15px] font-semibold transition-colors hover:border-ink sm:flex-none";

export default function LeadPage({ params }: PageProps<"/dashboard/leads/[id]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-card bg-disabled" />}>
      {params.then(({ id }) => (
        <LeadDetails id={id} />
      ))}
    </Suspense>
  );
}

async function LeadDetails({ id }: { id: string }) {
  const { business } = await requireOwner();
  if (!business) notFound();
  const found = await getRepositories().leads.findWithHistory(business.id, id);
  if (!found) notFound();
  const { lead } = found;
  const service = serviceNames(lead.items);
  const greeting = `Hi ${lead.customerName}, this is ${business.name} about your request for ${service} (${formatMoney(lead.total)}).`;

  return (
    <>
      <Link href="/dashboard" className="tap-target flex items-center gap-1.5 self-start text-sm font-medium text-muted hover:text-ink">
        <ArrowLeftIcon weight="bold" aria-hidden className="size-4" />
        All requests
      </Link>
      {/* On a phone the status sits right under the contacts; on a wide screen it moves to the side column. */}
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr]">
        <header className="flex min-w-0 flex-col gap-3">
          <p className="text-sm text-muted">
            <time dateTime={lead.createdAt.toISOString()}>{formatDateTime(lead.createdAt)}</time> · {service}
          </p>
          <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{lead.customerName}</h1>
          <p className="text-lg font-semibold tabular-nums">{formatPhone(lead.phone)}</p>
          <div className="mt-1 flex gap-2">
            <a href={phoneHref(lead.phone)} className={contactButton}>
              <PhoneIcon weight="duotone" aria-hidden className="size-5 text-accent" />
              Call
            </a>
            <a href={whatsappHref(lead.phone, greeting)} target="_blank" rel="noopener noreferrer" className={contactButton}>
              <WhatsappLogoIcon weight="duotone" aria-hidden className="size-5 text-success" />
              WhatsApp
            </a>
          </div>
        </header>
        <aside className="flex flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="flex items-start justify-between gap-4 rounded-card border border-rule bg-surface p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Status</p>
            <LeadStatusControl leadId={lead.id} status={lead.status} />
          </div>
          <FollowUpCard on={lead.followUpOn} today={todayInMarket()} save={setFollowUpAction.bind(null, lead.id)} />
          <Receipt
            businessName={business.name}
            quote={receiptQuote(lead.items)}
            title="Quoted price"
            note="The price the customer saw when sending the request."
          />
        </aside>
        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1">
          {lead.comment && (
            <section aria-labelledby="comment-title" className="flex flex-col gap-2">
              <h2 id="comment-title" className="font-serif text-xl font-medium">
                Comment from the customer
              </h2>
              <p className="border-l-2 border-rule pl-3 italic">{lead.comment}</p>
            </section>
          )}
          <LeadNotes notes={found.notes} add={addNoteAction.bind(null, lead.id)} remove={removeNoteAction} />
          <StatusHistory {...found} />
        </div>
      </div>
    </>
  );
}
