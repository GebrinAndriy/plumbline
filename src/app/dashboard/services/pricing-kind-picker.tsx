import type { PricingKind } from "@/domain/pricing/types";

const KINDS: { kind: PricingKind; label: string; example: string }[] = [
  { kind: "per_area", label: "By area (m²)", example: "Blinds, curtains, flooring" },
  { kind: "per_hour", label: "By the hour", example: "Cleaning, repairs, moving" },
  { kind: "fixed", label: "Fixed price per item", example: "Assembly, mounting" },
];

type PricingKindPickerProps = { value: PricingKind; onChange: (kind: PricingKind) => void };

export function PricingKindPicker({ value, onChange }: PricingKindPickerProps) {
  return (
    <fieldset className="flex flex-col gap-1.5 text-sm">
      <legend className="mb-1.5 font-medium">How is it priced?</legend>
      <div className="grid gap-2">
        {KINDS.map(({ kind, label, example }) => (
          <label
            key={kind}
            className={`flex cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-field border px-3.5 py-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ink/15 ${
              value === kind ? "border-accent bg-receipt" : "border-rule bg-white hover:border-muted"
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              <input
                type="radio"
                name="kind"
                value={kind}
                checked={value === kind}
                onChange={() => onChange(kind)}
                className="size-4 accent-accent"
              />
              {label}
            </span>
            <span className="pl-6 text-xs text-muted sm:pl-0">{example}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
