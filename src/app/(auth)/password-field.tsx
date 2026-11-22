"use client";

import { useState } from "react";
import { inputClass } from "@/components/field";

type PasswordFieldProps = {
  autoComplete: "new-password" | "current-password";
  label?: string;
  hint?: string;
  error?: string;
};

export function PasswordField({ autoComplete, label = "Password", hint, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const describedBy = error ? "password-error" : hint ? "password-hint" : undefined;

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor="password" className="font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputClass} w-full pr-16`}
        />
        <button
          type="button"
          aria-controls="password"
          aria-pressed={visible}
          aria-label="Show password"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 min-w-11 rounded-r-field px-3 text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? (
        <span id="password-error" className="animate-rise text-error">
          {error}
        </span>
      ) : (
        hint && (
          <span id="password-hint" className="text-xs text-muted">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
