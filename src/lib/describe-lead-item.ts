import { itemsTotal, type LeadItem } from "@/domain/leads/lead";
import type { Quote } from "@/domain/pricing/types";
import { describeInput } from "./describe-input";

// "Roller blinds · 200 × 150 cm · Fabric: Linen · Installation"
export function describeLeadItem(item: LeadItem): string {
  return [item.serviceName, describeInput(item.input), ...item.quote.lines.slice(1).map((line) => line.label)].join(" · ");
}

// One receipt for the whole request: each item's base line names its service and size.
export function receiptQuote(items: readonly LeadItem[]): Quote {
  return {
    lines: items.flatMap(({ serviceName, input, quote: { lines: [base, ...rest] } }) => [
      { label: `${serviceName}, ${describeInput(input)}`, amount: base.amount },
      ...rest,
    ]),
    total: itemsTotal(items),
  };
}

export function serviceNames(items: readonly LeadItem[]): string {
  const [first, ...rest] = items;
  return rest.length === 0 ? first.serviceName : `${first.serviceName} and ${rest.length} more`;
}
