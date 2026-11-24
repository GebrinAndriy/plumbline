import { assertNever } from "@/lib/assert-never";
import { createPricingStrategy } from "./create-pricing-strategy";
import { QuoteInputError } from "./errors";
import type { ChoiceSelection, Money, Quote, QuoteInput, QuoteLine, Service, Surcharge } from "./types";
import { validateService } from "./validate-service";

export function calculateQuote(
  service: Service,
  input: QuoteInput,
  selectedSurchargeIds: readonly string[] = [],
  choices: ChoiceSelection = {},
): Quote {
  // Services come from the DB, so a bad row must fail loudly instead of quoting a wrong price.
  validateService(service);

  const strategy = createPricingStrategy(service.rule);
  const lines: QuoteLine[] = [{ label: service.name, amount: strategy.basePrice(input) }];

  // Every group needs a pick: a fabric changes the price, so a quote without one would be wrong.
  for (const group of service.choices ?? []) {
    const option = group.options.find((o) => o.id === choices[group.id]);
    if (!option) throw new QuoteInputError(`Choose ${group.label}`);
    const amount = option.kind === "rate" ? Math.round(strategy.units(input) * option.amount) : option.amount;
    lines.push({ label: `${group.label}: ${option.label}`, amount });
  }

  // Percent options apply to the price with the chosen fabric, not to the bare base rate.
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);

  // The same option can arrive twice (double click), charge it once.
  for (const id of new Set(selectedSurchargeIds)) {
    const surcharge = service.surcharges.find((s) => s.id === id);
    if (!surcharge) {
      throw new QuoteInputError("Selected option is not available for this service");
    }
    lines.push({ label: surcharge.label, amount: surchargeAmount(surcharge, subtotal) });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, total };
}

function surchargeAmount(surcharge: Surcharge, subtotal: Money): Money {
  switch (surcharge.kind) {
    case "flat":
      return surcharge.amount;
    case "percent":
      return Math.round((subtotal * surcharge.percent) / 100);
    default:
      return assertNever(surcharge);
  }
}
