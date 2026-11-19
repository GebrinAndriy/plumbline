import { Suspense } from "react";
import { getRepositories } from "@/db/get-repositories";
import { requireOwner } from "@/lib/auth/current-owner";
import { createServiceAction, setServiceActiveAction, updateServiceAction } from "./actions";
import { describeRule } from "@/lib/describe-rule";
import { EditService } from "./edit-service";
import { ServiceForm } from "./service-form";
import { ServiceOptions } from "./service-options";

export default function ServicesPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="font-serif text-4xl font-medium tracking-tight">Services</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <OwnerServices />
      </Suspense>
    </div>
  );
}

async function OwnerServices() {
  const { business } = await requireOwner();
  if (!business) return <p className="text-muted">This account has no business.</p>;

  const services = await getRepositories().catalog.listAllServices(business.id);

  return (
    <>
      {services.length === 0 ? (
        <p className="rounded-xl bg-surface p-6 text-muted">
          No services yet. Add the first one so customers can get a price.
        </p>
      ) : (
        <ul className="divide-y divide-rule rounded-xl border border-rule">
          {services.map((service) => (
            <li key={service.id} className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={service.isActive ? "" : "opacity-50"}>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted">{describeRule(service.rule)}</p>
                </div>
                <form action={setServiceActiveAction.bind(null, service.id, !service.isActive)}>
                  <button type="submit" className="text-sm font-medium underline underline-offset-4">
                    {service.isActive ? "Hide from calculator" : "Show in calculator"}
                  </button>
                </form>
              </div>
              <ServiceOptions service={service} />
              <EditService service={service} action={updateServiceAction.bind(null, service.id)} />
            </li>
          ))}
        </ul>
      )}
      <section className="flex flex-col gap-4 rounded-xl border border-rule p-4">
        <h2 className="font-serif text-lg font-semibold">Add a service</h2>
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
