import { calculateQuote } from "@/domain/pricing/calculate-quote";
import type { Money, Quote, QuoteInput, Service } from "@/domain/pricing/types";
import { describeRule } from "@/lib/describe-rule";
import { explainQuote } from "@/lib/explain-quote";

type ExampleSource = {
  tab: string;
  service: Service;
  input: QuoteInput;
  selected: string[];
  customer: string;
};

export type LandingExample = {
  tab: string;
  service: Service;
  input: QuoteInput;
  selected: string[];
  customer: string;
  serviceLine: string;
  detail: string;
  quote: Quote;
};

const sources: ExampleSource[] = [
  {
    tab: "Blinds · per m²",
    service: {
      id: "blinds",
      name: "Roller blinds",
      rule: { kind: "per_area", ratePerSqm: 100_000 },
      surcharges: [{ id: "installation", label: "Installation", kind: "flat", amount: 50_000 }],
    },
    input: { kind: "per_area", widthCm: 210, heightCm: 160, quantity: 1 },
    selected: ["installation"],
    customer: "Olena K. · +380 67 123 45 67",
  },
  {
    tab: "Cleaning · per hour",
    service: {
      id: "cleaning",
      name: "Apartment cleaning",
      rule: { kind: "per_hour", ratePerHour: 40_000, minimumHours: 2 },
      surcharges: [{ id: "weekend", label: "Weekend visit", kind: "percent", percent: 20 }],
    },
    input: { kind: "per_hour", hours: 4 },
    selected: ["weekend"],
    customer: "Andrii M. · +380 50 418 22 09",
  },
  {
    tab: "Repairs · fixed price",
    service: {
      id: "mounting",
      name: "TV wall mounting",
      rule: { kind: "fixed", price: 65_000 },
      surcharges: [{ id: "cables", label: "Hide the cables", kind: "flat", amount: 30_000 }],
    },
    input: { kind: "fixed", quantity: 2 },
    selected: ["cables"],
    customer: "Taras V. · +380 66 205 88 31",
  },
];

// Prices on the landing come from the same engine as the real calculator, so they cannot drift.
export const LANDING_EXAMPLES: LandingExample[] = sources.map((source) => {
  const quote = calculateQuote(source.service, source.input, source.selected);
  return {
    ...source,
    serviceLine: `${source.service.name} · ${describeRule(source.service.rule)}`,
    detail: explainQuote(source.service.rule, source.input, quote.lines[0].amount).detail,
    quote,
  };
});

type PricingModel = { kind: string; usedFor: string; formula: [string, string]; note: string; result: Money };

const [blinds, cleaning, mounting] = sources.map((source) => source.service);

const model = (fields: Omit<PricingModel, "result">, service: Service, input: QuoteInput): PricingModel => ({
  ...fields,
  result: calculateQuote(service, input).total,
});

export const PRICING_MODELS: PricingModel[] = [
  model(
    { kind: "Per area", usedFor: "Blinds, curtains, flooring", formula: ["210 × 160 cm", "× 1 000 ₴ per m²"], note: "Minimum order if a job is small." },
    blinds,
    { kind: "per_area", widthCm: 210, heightCm: 160, quantity: 1 },
  ),
  model(
    { kind: "Per hour", usedFor: "Cleaning, repairs, moving", formula: ["3 hours", "× 400 ₴ per hour"], note: "Minimum hours for short visits." },
    cleaning,
    { kind: "per_hour", hours: 3 },
  ),
  model(
    { kind: "Fixed price", usedFor: "Assembly, mounting, installs", formula: ["2 items", "× 650 ₴ per item"], note: "Same price for every piece." },
    mounting,
    { kind: "fixed", quantity: 2 },
  ),
];
