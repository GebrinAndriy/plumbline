import type { Money } from "@/domain/pricing/types";

const currency = (fractionDigits: number) =>
  new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    // Node and browsers ship different ICU data: "₴" vs "грн" would break hydration.
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const whole = currency(0);
const exact = currency(2);

// Kopiykas are shown only when there are some: "3 860 ₴", but "1 348,54 ₴".
export function formatMoney(kopiykas: Money): string {
  return (kopiykas % 100 === 0 ? whole : exact).format(kopiykas / 100);
}

// The form-field counterpart of parseMoney: 45_050 becomes "450.50", 45_000 becomes "450".
export function formatMoneyInput(kopiykas: Money): string {
  const hryvnias = Math.trunc(kopiykas / 100);
  const rest = kopiykas % 100;
  return rest === 0 ? String(hryvnias) : `${hryvnias}.${String(rest).padStart(2, "0")}`;
}
