"use client";

import { useState } from "react";
import { useAnimatedNumber } from "@/components/use-animated-number";
import type { QuoteInput } from "@/domain/pricing/types";
import { describeSurcharge } from "@/lib/describe-rule";
import { formatAnimated, formatMoney } from "@/lib/format-money";
import { LANDING_EXAMPLES, type LandingExample } from "./landing-examples";

export function HeroPreview() {
  const [index, setIndex] = useState(0);
  const example = LANDING_EXAMPLES[index];

  return (
    <figure className="flex flex-col gap-5">
      <div role="group" aria-label="Example business" className="flex flex-wrap gap-2">
        {LANDING_EXAMPLES.map((e, i) => (
          <button
            key={e.tab}
            type="button"
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
            className={`tap-target rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
              i === index ? "border-ink bg-ink text-paper" : "border-control bg-paper hover:border-ink"
            }`}
          >
            {e.tab}
          </button>
        ))}
      </div>
      <div className="relative pb-20">
        <div className="h-[620px] w-[300px] rounded-[44px] bg-band p-2.5 shadow-[0_24px_60px_rgba(26,26,26,0.15)] sm:w-[330px]">
          <div key={example.tab} className="flex h-full animate-rise flex-col gap-3.5 overflow-hidden rounded-[34px] bg-paper px-[18px] py-4">
            <PhoneScreen example={example} />
          </div>
        </div>
        <TelegramCard key={example.tab} example={example} />
      </div>
      <figcaption className="text-[13px] text-muted">What your customers see at /b/your-business</figcaption>
    </figure>
  );
}

function PhoneScreen({ example }: { example: LandingExample }) {
  const { quote, service, selected } = example;
  const option = service.surcharges.find((s) => selected.includes(s.id));
  return (
    <>
      <p className="rounded-full bg-disabled py-1.5 text-center text-xs text-muted">/b/home-studio</p>
      <div className="pt-1.5">
        <p className="font-serif text-[28px] leading-tight font-medium tracking-tight">Home Studio</p>
        <p className="text-[13px] text-muted">{example.serviceLine}</p>
      </div>
      <PhoneFields input={example.input} />
      {option && (
        <div className="flex items-center gap-2.5 rounded-field border border-accent bg-receipt px-3 py-2.5 text-sm">
          <span aria-hidden className="grid size-[18px] place-items-center rounded bg-accent text-xs text-on-accent">
            ✓
          </span>
          <span className="flex-1">{option.label}</span>
          <span className="font-semibold">{describeSurcharge(option)}</span>
        </div>
      )}
      <div className="flex flex-col gap-2 rounded-[10px] bg-receipt p-4 pb-3.5 shadow-[0_6px_18px_rgba(26,26,26,0.08)]">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted">YOUR PRICE</p>
        {quote.lines.map((line, i) => (
          <p key={line.label} className="flex items-baseline gap-1.5 text-[13px]">
            <span>{i === 0 ? `${line.label}, ${example.detail}` : line.label}</span>
            <span aria-hidden className="min-w-3 flex-1 border-b-2 border-dotted border-rule" />
            <span className="font-medium tabular-nums">{formatMoney(line.amount)}</span>
          </p>
        ))}
        <p className="flex items-end justify-between border-t border-ink pt-2">
          <span className="pb-1.5 text-[11px] font-semibold tracking-[0.14em]">TOTAL</span>
          <AnimatedTotal amount={quote.total} />
        </p>
      </div>
      <p className="rounded-field bg-accent py-3.5 text-center text-[15px] font-semibold text-on-accent">
        Send request · {formatMoney(quote.total)}
      </p>
    </>
  );
}

function PhoneFields({ input }: { input: QuoteInput }) {
  const fields =
    input.kind === "per_area"
      ? [["Width, cm", input.widthCm, "cm"], ["Height, cm", input.heightCm, "cm"]] as const
      : input.kind === "per_hour"
        ? [["Hours", input.hours, "h"]] as const
        : [["Number of items", input.quantity, "pcs"]] as const;
  return (
    <div className="flex gap-2.5">
      {fields.map(([label, value, unit]) => (
        <div key={label} className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium">{label}</span>
          <span className="flex items-baseline justify-between rounded-field border border-rule bg-field px-3 py-2.5">
            {value}
            <span className="text-xs text-muted">{unit}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function AnimatedTotal({ amount }: { amount: number }) {
  const shown = useAnimatedNumber(amount);
  return (
    <span className="font-serif text-4xl font-semibold tracking-tight text-accent tabular-nums">
      {formatAnimated(shown, amount)}
    </span>
  );
}

function TelegramCard({ example }: { example: LandingExample }) {
  const options = example.quote.lines.slice(1).map((line) => line.label);
  return (
    <div className="absolute right-0 bottom-0 flex w-[260px] animate-pop flex-col gap-2 rounded-[18px] bg-band p-[18px] text-[13px] text-on-band/80 shadow-[0_18px_40px_rgba(26,26,26,0.2)] [animation-delay:200ms] sm:right-auto sm:left-[270px] sm:w-[270px]">
      <p className="text-xs text-[#b9b3aa]">
        <span aria-hidden className="text-[#8fb4e3]">➤ </span>Telegram · just now
      </p>
      <p className="text-[15px] font-semibold text-on-band">New request</p>
      <p className="leading-normal">
        {example.customer}
        <br />
        {example.service.name} · {example.detail}
        {options.length > 0 && (
          <>
            <br />
            {options.join(", ")}
          </>
        )}
      </p>
      <p className="font-serif text-[26px] font-semibold text-[#f6f3ee]">{formatMoney(example.quote.total)}</p>
    </div>
  );
}
