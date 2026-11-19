import Link from "next/link";
import { Suspense } from "react";
import { getRepositories } from "@/db/get-repositories";
import { requireOwner } from "@/lib/auth/current-owner";
import { createServiceAction } from "./actions";
import { ServiceCard } from "./service-card";
import { ServiceForm } from "./service-form";

export default function ServicesPage() {
  return (
    <Suspense fallback={<ServicesSkeleton />}>
      <OwnerServices />
    </Suspense>
  );
}

async function OwnerServices() {
  const { business } = await requireOwner();
  if (!business) return <p className="text-muted">This account has no business.</p>;

  const services = await getRepositories().catalog.listAllServices(business.id);
  const shown = services.filter((service) => service.isActive).length;

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.13em] text-accent uppercase">Your prices</p>
          <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Services</h1>
          {services.length > 0 && (
            <p className="text-muted">
              {shown} of {services.length} shown on your page. Changes apply to new requests only.
            </p>
          )}
        </div>
        <Link href={`/b/${business.slug}`} className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
          Preview your page →
        </Link>
      </div>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        {services.length === 0 ? (
          <div className="flex flex-col gap-2 rounded-card border border-dashed border-rule bg-surface p-8 text-center">
            <p className="font-serif text-xl">No services yet</p>
            <p className="text-muted">Add the first one so customers can get a price on your page.</p>
          </div>
        ) : (
          <ul className="flex min-w-0 flex-col gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </ul>
        )}
        <section aria-labelledby="add-service-title" className="flex flex-col gap-5 rounded-card border border-rule bg-surface p-5 sm:p-6 lg:sticky lg:top-6">
          <h2 id="add-service-title" className="font-serif text-2xl font-medium">
            Add a service
          </h2>
          <ServiceForm key={services.length} action={createServiceAction} submitLabel="Add service" pendingLabel="Adding…" />
        </section>
      </div>
    </>
  );
}

function ServicesSkeleton() {
  return (
    <div aria-busy className="flex animate-pulse flex-col gap-10">
      <div className="h-24 w-72 rounded-field bg-surface" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="h-96 rounded-card bg-surface" />
        <div className="h-96 rounded-card bg-surface" />
      </div>
    </div>
  );
}
