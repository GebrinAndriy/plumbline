"use client";

import { useRef } from "react";
import { inputClass } from "@/components/field";
import { useFormSubmit } from "@/components/use-form-submit";
import { addDays, type CalendarDay } from "@/domain/leads/follow-up";
import { FollowUpBadge } from "../../follow-up-badge";
import type { FollowUpFormState } from "./note-actions";

type FollowUpCardProps = {
  on: CalendarDay | null;
  today: CalendarDay;
  save: (state: FollowUpFormState, formData: FormData) => Promise<FollowUpFormState>;
};

const quick = "tap-target rounded-full border border-control px-3 py-1.5 text-xs font-semibold transition-colors hover:border-ink";

export function FollowUpCard({ on, today, save }: FollowUpCardProps) {
  const { state, onSubmit, pending } = useFormSubmit(save, {});
  const form = useRef<HTMLFormElement>(null);
  const day = useRef<HTMLInputElement>(null);

  // Quick picks fill the same field and send the form, so there is one way the day reaches the server.
  function pick(value: CalendarDay | "") {
    if (!day.current) return;
    day.current.value = value;
    form.current?.requestSubmit();
  }

  return (
    <form ref={form} method="post" onSubmit={onSubmit} className="flex flex-col gap-3 rounded-card border border-rule bg-surface p-5" noValidate>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="follow-up-on" className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          Follow up
        </label>
        {on && <FollowUpBadge on={on} today={today} />}
      </div>
      <div className="flex gap-2">
        <input
          // A new key after each save puts the saved day back into the field.
          key={on ?? "none"}
          ref={day}
          id="follow-up-on"
          type="date"
          name="on"
          min={today}
          defaultValue={on ?? ""}
          className={`${inputClass} min-w-0 flex-1`}
        />
        <button type="submit" disabled={pending} className="tap-target rounded-field border border-ink px-4 text-sm font-semibold hover:bg-field disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} onClick={() => pick(addDays(today, 1))} className={quick}>
          Tomorrow
        </button>
        <button type="button" disabled={pending} onClick={() => pick(addDays(today, 7))} className={quick}>
          Next week
        </button>
        {on && (
          <button type="button" disabled={pending} onClick={() => pick("")} className="tap-target ml-auto text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
            Clear
          </button>
        )}
      </div>
      {state.message && (
        <p role="alert" className="animate-rise text-sm text-error">
          {state.message}
        </p>
      )}
    </form>
  );
}
