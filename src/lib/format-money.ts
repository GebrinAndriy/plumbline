import type { Money } from "@/domain/pricing/types";
import { MARKET } from "./market";

const currency = (fractionDigits: number) =>
  new Intl.NumberFormat(MARKET.locale, {
    style: "currency",
    currency: MARKET.currency,
    // Node and browsers ship different ICU data; the narrow symbol is the same everywhere, so hydration matches.
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const whole = currency(0);
const exact = currency(2);

// Cents are shown only when there are some: "€3,860", but "€1,348.54".
export function formatMoney(cents: Money): string {
  return (cents % 100 === 0 ? whole : exact).format(cents / 100);
}

// The form-field counterpart of parseMoney: 45_050 becomes "450.50", 45_000 becomes "450".
export function formatMoneyInput(cents: Money): string {
  const euros = Math.trunc(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(euros) : `${euros}.${String(rest).padStart(2, "0")}`;
}

// While a total is counting up, whole euros keep the digits from flickering.
export function formatAnimated(shown: Money, target: Money): string {
  return shown === target ? formatMoney(target) : formatMoney(Math.round(shown / 100) * 100);
}
