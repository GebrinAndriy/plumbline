import { formatMoney } from "@/lib/format-money";
import { PRICING_MODELS } from "./landing-examples";
import { Overline } from "./overline";

export function PricingModels() {
  return (
    <section aria-labelledby="pricing-title">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-16 sm:gap-12 sm:px-8 lg:px-20 lg:py-26">
        <div className="flex flex-col gap-4">
          <Overline>One tool, three ways to price</Overline>
          <h2 id="pricing-title" className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Price it the way you already do.
          </h2>
        </div>
        <ul className="grid gap-10 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-rule">
          {PRICING_MODELS.map((model) => (
            <li key={model.kind} className="flex flex-col gap-3 lg:px-10 lg:first:pl-0 lg:last:pr-0">
              <Overline tone="ink">{model.kind}</Overline>
              <p className="text-[15px] text-muted">{model.usedFor}</p>
              <p className="font-serif text-[28px] leading-[1.15] tracking-tight sm:text-3xl">
                {model.formula[0]}
                <br />
                {model.formula[1]}
              </p>
              <p className="font-serif text-[28px] font-semibold tracking-tight text-accent sm:text-3xl">
                = {formatMoney(model.result)}
              </p>
              <p className="text-sm text-muted">{model.note}</p>
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-4 rounded-card border border-rule bg-surface px-5 py-4 text-[15px]">
          <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-accent text-xs leading-none font-bold text-accent">
            +
          </span>
          Add paid options to any service: a fixed amount like Installation +€30, or a percent like Urgent +20%. Customers
          tick them and the price updates.
        </p>
      </div>
    </section>
  );
}
