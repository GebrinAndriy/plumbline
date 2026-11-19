import type { ServiceListing } from "@/domain/catalog/catalog";
import { describeRule } from "@/lib/describe-rule";
import { setServiceActiveAction, updateServiceAction } from "./actions";
import { EditService } from "./edit-service";
import { priceExample } from "./price-example";
import { ServiceOptions } from "./service-options";

const KIND_LABELS = { per_area: "Per area", per_hour: "Per hour", fixed: "Fixed price" } as const;

export function ServiceCard({ service }: { service: ServiceListing }) {
  return (
    <li className={`flex flex-col gap-5 rounded-card border border-rule p-5 sm:p-6 ${service.isActive ? "bg-white" : "border-dashed bg-surface"}`}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className={`flex flex-col gap-1 ${service.isActive ? "" : "opacity-60"}`}>
          <p className="text-xs font-semibold tracking-[0.13em] text-accent uppercase">{KIND_LABELS[service.rule.kind]}</p>
          <h2 className="font-serif text-2xl font-medium">{service.name}</h2>
          <p className="text-muted">{describeRule(service.rule)}</p>
          <p className="text-xs text-muted tabular-nums">For example: {priceExample(service.rule)}</p>
        </div>
        <form action={setServiceActiveAction.bind(null, service.id, !service.isActive)} className="flex items-center gap-3 sm:flex-col sm:items-end">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${service.isActive ? "bg-success-soft text-success" : "bg-disabled text-disabled-text"}`}>
            {service.isActive ? "On your page" : "Hidden"}
          </span>
          <button type="submit" className="text-sm font-medium whitespace-nowrap text-muted underline-offset-4 hover:text-ink hover:underline">
            {service.isActive ? "Hide from calculator" : "Show in calculator"}
          </button>
        </form>
      </div>
      <ServiceOptions service={service} />
      <EditService service={service} action={updateServiceAction.bind(null, service.id)} />
    </li>
  );
}
