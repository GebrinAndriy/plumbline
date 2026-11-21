import type { ReactNode } from "react";
import { StatusBadge } from "@/components/status-badge";
import { LEAD_STATUSES } from "@/domain/leads/lead-status";
import { Overline } from "./overline";

const FLOW = LEAD_STATUSES.filter((status) => status !== "lost");

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-4 border-t border-rule">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-16 sm:gap-14 sm:px-8 lg:px-20 lg:py-24">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-4">
            <Overline>How it works</Overline>
            <h2 id="how-title" className="font-serif text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl">
              Set it up once.
              <br className="hidden sm:block" /> Then just answer the phone.
            </h2>
          </div>
          <p className="text-[15px] text-muted">About ten minutes, from your phone or laptop.</p>
        </div>
        <ol className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          <Step number={1} title="Add services and how you price them" body="Per square metre, per hour or per item, with a minimum order and paid options like installation.">
            <div className="rounded-card border border-rule bg-surface px-5 py-4">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted">PER AREA</p>
              <p className="mt-1 font-serif text-xl font-medium">Roller blinds</p>
              <p className="mt-1 text-sm text-muted">€50 per m², minimum €80</p>
            </div>
          </Step>
          <Step number={2} title="Share your page link" body="Put it in your Instagram bio, WhatsApp status or on a business card. Customers open it on their phone.">
            <div className="flex gap-2">
              <span className="flex-1 rounded-field border border-rule bg-white px-3.5 py-3 text-[15px]">/b/your-business</span>
              <span className="rounded-field border border-ink px-4 py-3 text-[15px] font-semibold">Copy link</span>
            </div>
          </Step>
          <Step number={3} title="Requests arrive with the price" body="Name, phone, sizes and the exact total. Move each one forward until the job is won.">
            <p className="flex flex-wrap items-center gap-1.5 text-muted">
              {FLOW.map((status, i) => (
                <span key={status} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden>→</span>}
                  <StatusBadge status={status} />
                </span>
              ))}
            </p>
          </Step>
        </ol>
      </div>
    </section>
  );
}

type StepProps = { number: number; title: string; body: string; children: ReactNode };

function Step({ number, title, body, children }: StepProps) {
  return (
    <li className="flex flex-col gap-3 border-t border-ink pt-6">
      <span className="font-serif text-[22px] text-accent">{String(number).padStart(2, "0")}</span>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="leading-relaxed text-muted">{body}</p>
      {/* Illustrations only: the real controls live in the dashboard. */}
      <div aria-hidden className="hidden pt-3 sm:block">
        {children}
      </div>
    </li>
  );
}
