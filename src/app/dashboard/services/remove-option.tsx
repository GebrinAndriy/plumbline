"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type RemoveOptionProps = { label: string; action: () => Promise<void> };

export function RemoveOption({ label, action }: RemoveOptionProps) {
  const [confirming, setConfirming] = useState(false);
  const removeRef = useRef<HTMLButtonElement>(null);
  const reopened = useRef(false);

  useEffect(() => {
    if (!confirming && reopened.current) removeRef.current?.focus();
    reopened.current = confirming;
  }, [confirming]);

  if (!confirming) {
    return (
      <button
        ref={removeRef}
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Remove ${label}`}
        className="tap-target grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-error-soft hover:text-error"
      >
        <span aria-hidden>×</span>
      </button>
    );
  }

  return (
    <form
      action={action}
      onKeyDown={(event) => event.key === "Escape" && setConfirming(false)}
      className="flex animate-rise items-center gap-2"
    >
      <span className="text-xs text-muted">Remove?</span>
      <ConfirmButton label={label} />
      <button
        type="button"
        autoFocus
        onClick={() => setConfirming(false)}
        className="tap-target rounded-field px-2 py-1 text-xs font-medium text-muted hover:text-ink"
      >
        Keep
      </button>
    </form>
  );
}

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Yes, remove ${label}`}
      className="tap-target rounded-field bg-error px-2.5 py-1 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
