import type { Service } from "@/domain/pricing/types";
import { MAX_SURCHARGES } from "@/domain/pricing/validate-service";
import { describeSurcharge } from "@/lib/describe-rule";
import { AddSurcharge } from "./add-surcharge";
import { addSurchargeAction, removeSurchargeAction } from "./surcharge-actions";

export function ServiceOptions({ service }: { service: Service }) {
  const { surcharges } = service;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-xs font-semibold tracking-[0.13em] text-muted uppercase">Paid options</p>
      {surcharges.length > 0 ? (
        <ul className="flex flex-col divide-y divide-rule rounded-field border border-rule" aria-label={`Options of ${service.name}`}>
          {surcharges.map((surcharge) => (
            <li key={surcharge.id} className="flex animate-rise items-center gap-3 px-3.5 py-2.5">
              <span className="flex-1">{surcharge.label}</span>
              <span className="font-semibold tabular-nums">{describeSurcharge(surcharge)}</span>
              <form action={removeSurchargeAction.bind(null, service.id, surcharge.id)}>
                <button
                  type="submit"
                  aria-label={`Remove ${surcharge.label}`}
                  className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-error-soft hover:text-error"
                >
                  <span aria-hidden>×</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">None yet. Add installation, delivery or an urgent visit, and customers tick what they need.</p>
      )}
      {surcharges.length < MAX_SURCHARGES ? (
        // Remounts after each change, so the form closes and clears once an option is added.
        <AddSurcharge key={surcharges.length} action={addSurchargeAction.bind(null, service.id)} />
      ) : (
        <p className="text-muted">This service has the maximum of {MAX_SURCHARGES} options.</p>
      )}
    </div>
  );
}
