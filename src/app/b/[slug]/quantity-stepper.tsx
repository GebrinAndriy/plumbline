import { MAX_QUANTITY } from "@/domain/pricing/strategies";

type QuantityStepperProps = {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

const stepClass =
  "grid w-11 shrink-0 place-items-center text-lg text-ink transition-colors hover:bg-surface disabled:text-disabled-text disabled:hover:bg-transparent";

export function QuantityStepper({ label, value, error, onChange }: QuantityStepperProps) {
  const current = Number(value);
  const valid = Number.isInteger(current) && current >= 1;
  const set = (next: number) => onChange(String(Math.min(MAX_QUANTITY, Math.max(1, next))));

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor="quantity" className="font-medium text-ink">
        {label}
      </label>
      <div className="flex h-[46px] w-40 overflow-hidden rounded-field border border-control bg-white focus-within:border-ink">
        <button type="button" aria-label="Fewer" disabled={!valid || current <= 1} onClick={() => set(current - 1)} className={stepClass}>
          −
        </button>
        <input
          id="quantity"
          name="quantity"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          required
          value={value}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 border-x border-rule text-center text-base outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button type="button" aria-label="More" disabled={valid && current >= MAX_QUANTITY} onClick={() => set(valid ? current + 1 : 1)} className={stepClass}>
          +
        </button>
      </div>
      {error && <span className="animate-rise text-error">{error}</span>}
    </div>
  );
}
