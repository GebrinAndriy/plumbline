"use client";

import { useAnimatedNumber } from "@/components/use-animated-number";
import type { Money, Quote } from "@/domain/pricing/types";
import { formatAnimated, formatMoney } from "@/lib/format-money";

type ReceiptProps = {
  businessName: string;
  quote: Quote | null;
  // Shown next to the base price: "3,36 m²", "3 h".
  baseDetail?: string;
  title?: string;
  note?: string;
};

export function Receipt({ businessName, quote, baseDetail, title = "Your price", note = "Exact price. No hidden fees." }: ReceiptProps) {
  return (
    <div>
      <div className="flex flex-col gap-4 rounded-t-card bg-receipt p-7 pb-6 shadow-[0_10px_30px_-12px_rgba(26,26,26,0.18)]">
        <div className="flex justify-between text-xs">
          <span className="font-semibold uppercase tracking-[0.14em] text-muted">{title}</span>
          <span className="text-muted">{businessName}</span>
        </div>
        {quote ? (
          <ul className="flex flex-col gap-2 text-[15px]">
            {quote.lines.map((line, index) => (
              // The first line is the base price; its detail changes with every keystroke, so it keeps one key.
              <li key={index === 0 ? "base" : line.label} className="flex animate-rise items-baseline gap-2">
                <span>{index === 0 && baseDetail ? `${line.label}, ${baseDetail}` : line.label}</span>
                <span aria-hidden className="min-w-4 flex-1 border-b-2 border-dotted border-rule" />
                <span className="font-medium tabular-nums">{formatMoney(line.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-muted">Fill in the details to see the price.</p>
        )}
        <div className="flex items-end justify-between border-t border-ink pt-4">
          <span className="pb-2 text-xs font-semibold uppercase tracking-[0.14em]">Total</span>
          <Total amount={quote?.total ?? null} />
        </div>
        <p className="text-xs text-muted">{note}</p>
      </div>
      <div aria-hidden className="torn-edge" />
    </div>
  );
}

function Total({ amount }: { amount: Money | null }) {
  const shown = useAnimatedNumber(amount ?? 0);
  return (
    <span aria-hidden className={`font-serif text-5xl font-semibold tabular-nums ${amount === null ? "text-rule" : "text-accent"}`}>
      {amount === null ? "€ —" : formatAnimated(shown, amount)}
    </span>
  );
}

// While counting, show whole euros so the width does not jump; land on the exact amount.
