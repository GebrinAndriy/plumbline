import type { Surcharge } from "@/domain/pricing/types";
import { describeSurcharge } from "@/lib/describe-rule";

type SurchargeOptionsProps = {
  surcharges: Surcharge[];
  selected: readonly string[];
  // Options the customer ticked that the owner has since removed, by label.
  removed: { id: string; label: string }[];
  onToggle: (id: string, checked: boolean) => void;
};

const rowClass = "flex items-center gap-3 rounded-field border px-4 py-3.5 text-base transition-colors";

export function SurchargeOptions({ surcharges, selected, removed, onToggle }: SurchargeOptionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {surcharges.map((s) => {
        const checked = selected.includes(s.id);
        return (
          <label
            key={s.id}
            className={`${rowClass} cursor-pointer ${checked ? "border-accent bg-receipt" : "border-rule bg-white hover:border-muted"}`}
          >
            <input
              type="checkbox"
              name="surchargeIds"
              value={s.id}
              checked={checked}
              onChange={(e) => onToggle(s.id, e.target.checked)}
              className="size-5 accent-accent"
            />
            <span className="flex-1">{s.label}</span>
            <span className="font-semibold tabular-nums">{describeSurcharge(s)}</span>
          </label>
        );
      })}
      {removed.map((s) => (
        <div key={s.id} className={`${rowClass} animate-shake border-error/40 bg-disabled text-disabled-text`}>
          <input type="checkbox" disabled aria-label={`${s.label}, no longer available`} className="size-5" />
          <span className="flex-1">{s.label} — no longer available</span>
        </div>
      ))}
    </div>
  );
}
