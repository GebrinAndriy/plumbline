"use client";

import { useAnimatedNumber } from "@/components/use-animated-number";
import type { Quote } from "@/domain/pricing/types";
import { formatMoney } from "@/lib/format-money";

export function QuoteSummary({ quote }: { quote: Quote | null }) {
  const shownTotal = useAnimatedNumber(quote?.total ?? 0);

  if (!quote) {
    return (
      <p className="animate-rise rounded-xl bg-surface p-4 text-sm text-muted">
        Fill in the details to see the price.
      </p>
    );
  }

  return (
    <div className="animate-rise rounded-xl bg-surface p-4">
      <ul className="flex flex-col gap-1 text-sm text-muted">
        {quote.lines.map((line, index) => (
          // The first line is the base price; its label changes with every keystroke, so it keeps one key.
          <li key={index === 0 ? "base" : line.label} className="flex animate-rise justify-between gap-4">
            <span>{line.label}</span>
            <span className="tabular-nums">{formatMoney(line.amount)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between border-t border-rule pt-3 text-lg font-semibold">
        <span>Total</span>
        <span className="tabular-nums" aria-hidden>
          {formatMoney(shownTotal)}
        </span>
        <span className="sr-only" aria-live="polite">
          {formatMoney(quote.total)}
        </span>
      </p>
    </div>
  );
}
