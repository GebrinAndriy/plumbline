import type { QuoteInput } from "@/domain/pricing/types";
import { assertNever } from "@/lib/assert-never";

const decimal = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 });

export function describeInput(input: QuoteInput): string {
  switch (input.kind) {
    case "per_area":
      return `${input.quantity > 1 ? `${input.quantity} × ` : ""}${input.widthCm} × ${input.heightCm} cm`;
    case "per_hour":
      return `${decimal.format(input.hours)} h`;
    case "fixed":
      return `${input.quantity} pcs`;
    default:
      return assertNever(input);
  }
}
