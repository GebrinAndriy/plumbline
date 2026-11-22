import { slugSchema, SLUG_RULES } from "../auth-schemas";

type SlugFieldProps = {
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

export function SlugField({ value, error, onChange }: SlugFieldProps) {
  const parsed = slugSchema.safeParse(value);
  const status = error ? (
    <span className="animate-rise text-error">{error}</span>
  ) : parsed.success ? (
    <span className="text-success">
      <span aria-hidden>✓ </span>Customers will open <span className="font-semibold">/b/{parsed.data}</span>
    </span>
  ) : (
    <span className="text-muted">{SLUG_RULES}</span>
  );

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor="slug" className="font-medium">
        Page address
      </label>
      <div
        className={`flex items-center rounded-field border bg-white transition-colors focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/15 ${
          error ? "border-error" : "border-control"
        }`}
      >
        <span aria-hidden className="pl-3 text-base text-muted">
          /b/
        </span>
        <input
          id="slug"
          name="slug"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="your-business"
          aria-invalid={error ? true : undefined}
          aria-describedby="slug-status"
          className="min-w-0 flex-1 rounded-field bg-transparent py-2.5 pr-3 pl-0.5 text-base outline-none placeholder:text-disabled-text"
        />
      </div>
      <span id="slug-status" aria-live="polite" className={error ? "text-sm" : "text-xs"}>
        {status}
      </span>
    </div>
  );
}
