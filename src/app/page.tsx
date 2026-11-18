import { DashboardSection } from "./_landing/dashboard-section";
import { Faq } from "./_landing/faq";
import { HeroPreview } from "./_landing/hero-preview";
import { HowItWorks } from "./_landing/how-it-works";
import { Overline } from "./_landing/overline";
import { PricingModels } from "./_landing/pricing-models";
import { CallToAction, SiteFooter, SiteHeader } from "./_landing/site-chrome";

const FACTS = ["Customers don't register", "Per m², per hour or fixed", "Requests in Telegram"];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section aria-labelledby="hero-title">
          <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-4 pt-12 pb-16 sm:px-8 lg:grid-cols-[1fr_520px] lg:px-20 lg:pt-22 lg:pb-26">
            <div className="flex animate-rise flex-col gap-6 lg:gap-7">
              <Overline>For small service businesses</Overline>
              <h1 id="hero-title" className="font-serif text-[44px] leading-[1.04] font-medium tracking-tight sm:text-6xl lg:text-[58px]">
                Your prices, as a page <br className="hidden lg:block" />
                your customers can use.
              </h1>
              <p className="max-w-[540px] text-lg leading-normal text-muted sm:text-[19px]">
                Customers pick a service, enter sizes or hours and see the exact price. You get the request on your
                dashboard and in Telegram, with that price already on it.
              </p>
              <CallToAction className="pt-2" />
              <ul className="flex flex-col gap-2 pt-2 text-sm sm:flex-row sm:flex-wrap sm:gap-6">
                {FACTS.map((fact) => (
                  <li key={fact} className="flex items-center gap-2">
                    <span aria-hidden className="text-success">
                      ✓
                    </span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
            <HeroPreview />
          </div>
        </section>
        <HowItWorks />
        <DashboardSection />
        <PricingModels />
        <Faq />
        <section aria-labelledby="cta-title" className="border-t border-rule bg-surface">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-8 lg:py-28">
            <h2 id="cta-title" className="font-serif text-4xl font-medium tracking-tight sm:text-6xl">
              Put your prices online today.
            </h2>
            <p className="max-w-xl text-lg leading-normal text-muted">
              Create your page, add your services and share the link. Free while QuoteFlow is in early access.
            </p>
            <CallToAction className="w-full justify-center sm:w-auto" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
