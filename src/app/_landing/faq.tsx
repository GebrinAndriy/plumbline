import { Overline } from "./overline";

const QUESTIONS = [
  ["Do my customers need to register?", "No. They open your link, see the price and leave a name and phone. Nothing to install."],
  ["Can I change prices later?", "Yes, any time. Requests already sent keep the price the customer saw."],
  ["What if I charge per hour?", "Choose “By the hour” when you add the service, with an optional minimum."],
  ["Do I have to use Telegram?", "No. Every request is on your dashboard; Telegram just tells you sooner."],
];

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="border-t border-rule">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-16 sm:px-8 lg:grid-cols-[360px_1fr] lg:gap-20 lg:px-20 lg:py-24">
        <div className="flex flex-col gap-4">
          <Overline>Questions</Overline>
          <h2 id="faq-title" className="font-serif text-4xl font-medium tracking-tight sm:text-[44px]">
            Short answers.
          </h2>
        </div>
        <dl className="divide-y divide-rule">
          {QUESTIONS.map(([question, answer]) => (
            <div key={question} className="grid gap-2 py-5 first:pt-0 sm:grid-cols-[minmax(0,340px)_1fr] sm:gap-10 sm:py-6">
              <dt className="text-lg font-semibold">{question}</dt>
              <dd className="leading-relaxed text-muted">{answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
