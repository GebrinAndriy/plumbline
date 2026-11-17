import type { Service } from "@/domain/pricing/types";
import { MAX_SURCHARGES } from "@/domain/pricing/validate-service";
import { AddSurcharge } from "./add-surcharge";
import { describeSurcharge } from "./describe-rule";
import { addSurchargeAction, removeSurchargeAction } from "./surcharge-actions";

export function ServiceOptions({ service }: { service: Service }) {
  const { surcharges } = service;

  return (
    <div className="flex flex-col gap-2 text-sm">
      {surcharges.length > 0 && (
        <ul className="flex flex-col gap-1" aria-label={`Options of ${service.name}`}>
          {surcharges.map((surcharge) => (
            <li key={surcharge.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {surcharge.label}{" "}
                <span className="text-zinc-600 dark:text-zinc-400">{describeSurcharge(surcharge)}</span>
              </span>
              <form action={removeSurchargeAction.bind(null, service.id, surcharge.id)}>
                <button type="submit" className="font-medium underline underline-offset-4">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {surcharges.length < MAX_SURCHARGES ? (
        // Remounts after each change, so the form closes and clears once an option is added.
        <AddSurcharge key={surcharges.length} action={addSurchargeAction.bind(null, service.id)} />
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">This service has the maximum of {MAX_SURCHARGES} options.</p>
      )}
    </div>
  );
}
