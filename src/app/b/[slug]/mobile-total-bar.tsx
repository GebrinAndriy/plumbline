"use client";

import { useState, type ReactNode } from "react";
import { useAnimatedNumber } from "@/components/use-animated-number";
import type { Quote } from "@/domain/pricing/types";
import { formatAnimated } from "@/lib/format-money";

// On phones the receipt lives behind a bar pinned to the bottom, so the price is always in view.
export function MobileTotalBar({ quote, items, receipt }: { quote: Quote | null; items: number; receipt: ReactNode }) {
  const [open, setOpen] = useState(false);
  const shown = useAnimatedNumber(quote?.total ?? 0);

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 lg:hidden">
      {open && (
        <div id="mobile-receipt" className="max-h-[70vh] animate-rise overflow-y-auto border-t border-rule bg-paper px-4 pt-4">
          {receipt}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-rule bg-receipt px-4 py-3 shadow-[0_-6px_20px_rgba(26,26,26,0.06)]">
        <div aria-hidden>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Total{quote && ` · ${items} ${items === 1 ? "item" : "items"}`}
          </p>
          <p className={`font-serif text-3xl font-semibold tabular-nums ${quote ? "text-accent" : "text-rule"}`}>
            {quote ? formatAnimated(shown, quote.total) : "€ —"}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-receipt"
          onClick={() => setOpen((o) => !o)}
          className="tap-target flex items-center gap-2 rounded-field border border-ink px-4 py-2.5 text-sm font-semibold"
        >
          Receipt
          <svg viewBox="0 0 12 12" aria-hidden className={`size-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
            <path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
