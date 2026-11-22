import type { InputHTMLAttributes } from "react";

export const inputClass =
  "rounded-field border border-control bg-white px-3 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-disabled-text focus:border-ink focus-visible:ring-2 focus-visible:ring-ink/15 aria-invalid:border-error";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
};

export function Field({ label, name, error, className, ...input }: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className ?? ""}`}>
      <span className="font-medium text-ink">{label}</span>
      <input
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={inputClass}
        {...input}
      />
      {error && (
        <span id={errorId} className="animate-rise text-error">
          {error}
        </span>
      )}
    </label>
  );
}
