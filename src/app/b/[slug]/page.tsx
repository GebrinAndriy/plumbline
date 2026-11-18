import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getRepositories } from "@/db/get-repositories";
import { QuoteForm } from "./quote-form";

export default function BusinessPage({ params }: PageProps<"/b/[slug]">) {
  return (
    <div className="flex flex-1 flex-col pb-28 lg:pb-0">
      <Suspense fallback={<PageSkeleton />}>
        {params.then(({ slug }) => (
          <BusinessQuote slug={slug} />
        ))}
      </Suspense>
      <footer className="mt-auto border-t border-rule py-6 text-center text-xs text-muted">Made with QuoteFlow</footer>
    </div>
  );
}

async function BusinessQuote({ slug }: { slug: string }) {
  const { catalog } = getRepositories();
  const business = await catalog.findBusinessBySlug(slug);
  if (!business) notFound();

  const services = await catalog.listActiveServices(business.id);

  return (
    <>
      <header className="border-b border-rule">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-12">
          <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{business.name}</h1>
          <p className="mt-3 text-muted sm:text-lg">
            Choose a service, enter the details and see the exact price. Send a request — we&apos;ll call you back.
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        {services.length > 0 ? (
          <QuoteForm businessName={business.name} businessSlug={business.slug} services={services} />
        ) : (
          <p className="text-muted">This business has no services yet.</p>
        )}
      </main>
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-4 px-4 py-12 sm:px-8" aria-busy="true">
      <div className="h-12 w-1/2 rounded bg-disabled" />
      <div className="h-5 w-2/3 rounded bg-disabled" />
      <div className="mt-8 h-96 w-full rounded-card bg-disabled" />
    </div>
  );
}
