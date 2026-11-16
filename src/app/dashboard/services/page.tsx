import Link from "next/link";
import { Suspense } from "react";
import { getRepositories } from "@/db/get-repositories";
import { requireOwner } from "@/lib/auth/current-owner";
import { createServiceAction, setServiceActiveAction, updateServiceAction } from "./actions";
import { describeRule } from "./describe-rule";
import { EditService } from "./edit-service";
import { ServiceForm } from "./service-form";

export default function ServicesPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <Link href="/dashboard" className="text-sm font-medium underline underline-offset-4">
        ← Dashboard
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Services</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <OwnerServices />
      </Suspense>
    </main>
  );
}

async function OwnerServices() {
  const { business } = await requireOwner();
  if (!business) return <p className="text-zinc-600 dark:text-zinc-400">This account has no business.</p>;

  const services = await getRepositories().catalog.listAllServices(business.id);

  return (
    <>
      {services.length === 0 ? (
        <p className="rounded-xl bg-zinc-100 p-6 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          No services yet. Add the first one so customers can get a price.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {services.map((service) => (
            <li key={service.id} className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={service.isActive ? "" : "opacity-50"}>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{describeRule(service.rule)}</p>
                </div>
                <form action={setServiceActiveAction.bind(null, service.id, !service.isActive)}>
                  <button type="submit" className="text-sm font-medium underline underline-offset-4">
                    {service.isActive ? "Hide from calculator" : "Show in calculator"}
                  </button>
                </form>
              </div>
              <EditService service={service} action={updateServiceAction.bind(null, service.id)} />
            </li>
          ))}
        </ul>
      )}
      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Add a service</h2>
        <ServiceForm
          key={services.length}
          action={createServiceAction}
          submitLabel="Add service"
          pendingLabel="Adding…"
        />
      </section>
    </>
  );
}
