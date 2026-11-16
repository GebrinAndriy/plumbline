import type { Money } from "@/domain/pricing/types";

const uah = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  // Node and browsers ship different ICU data: "₴" vs "грн" would break hydration.
  currencyDisplay: "narrowSymbol",
});

export function formatMoney(kopiykas: Money): string {
  return uah.format(kopiykas / 100);
}

// The form-field counterpart of parseMoney: 45_050 becomes "450.50", 45_000 becomes "450".
export function formatMoneyInput(kopiykas: Money): string {
  const hryvnias = Math.trunc(kopiykas / 100);
  const rest = kopiykas % 100;
  return rest === 0 ? String(hryvnias) : `${hryvnias}.${String(rest).padStart(2, "0")}`;
}
