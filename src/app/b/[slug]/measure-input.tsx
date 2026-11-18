import type { CSSProperties, KeyboardEvent } from "react";
import { inputClass } from "@/components/field";

const RULER_MAX_CM = 500;
const RULER_MARKS = [0, 100, 200, 300, 400, 500];

type MeasureInputProps = {
  label: string;
  name: string;
  unit: string;
  value: string;
  error?: string;
  hint?: string;
  ruler?: boolean;
  onChange: (value: string) => void;
};

export function MeasureInput({ label, name, unit, value, error, hint, ruler, onChange }: MeasureInputProps) {
  const errorId = `${name}-error`;
  const numeric = Math.min(RULER_MAX_CM, Math.max(0, Number(value) || 0));

  // Arrow keys move the tape by 1 cm natively; Shift makes it 10 cm.
  function onRulerKey(event: KeyboardEvent<HTMLInputElement>) {
    if (!event.shiftKey || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -10 : 10;
    onChange(String(Math.min(RULER_MAX_CM, Math.max(1, numeric + step))));
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor={name} className="font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          required
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} w-full pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
          {unit}
        </span>
      </div>
      {ruler && (
        <div className="mt-1">
          <input
            type="range"
            min="0"
            max={RULER_MAX_CM}
            step="1"
            value={numeric}
            aria-label={`${label}, tape measure`}
            onKeyDown={onRulerKey}
            onChange={(e) => onChange(e.target.value === "0" ? "" : e.target.value)}
            className="tape-measure w-full"
            style={{ "--fill": `${(numeric / RULER_MAX_CM) * 100}%` } as CSSProperties}
          />
          <div aria-hidden className="flex justify-between text-[11px] text-muted tabular-nums">
            {RULER_MARKS.map((mark) => (
              <span key={mark}>{mark}</span>
            ))}
          </div>
        </div>
      )}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && (
        <span id={errorId} className="animate-rise text-error">
          {error}
        </span>
      )}
    </div>
  );
}
