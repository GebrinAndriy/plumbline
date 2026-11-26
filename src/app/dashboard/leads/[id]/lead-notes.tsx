"use client";

import { useRef, type KeyboardEvent } from "react";
import { inputClass } from "@/components/field";
import { PrimaryButton } from "@/components/primary-button";
import { useFormSubmit } from "@/components/use-form-submit";
import { MAX_NOTE_LENGTH, type LeadNote } from "@/domain/leads/lead";
import { formatDateTime } from "@/lib/format-date";
import { RemoveOption } from "../../services/remove-option";
import type { NoteFormState } from "./note-actions";

const INITIAL: NoteFormState = { fieldErrors: {} };

type LeadNotesProps = {
  notes: LeadNote[];
  add: (state: NoteFormState, formData: FormData) => Promise<NoteFormState>;
  remove: (noteId: string) => Promise<void>;
};

export function LeadNotes({ notes, add, remove }: LeadNotesProps) {
  const { state, onSubmit, pending } = useFormSubmit(add, INITIAL);
  const form = useRef<HTMLFormElement>(null);
  const error = state.fieldErrors.body ?? state.message;

  // Ctrl or Cmd + Enter saves, the way chat and issue trackers do; plain Enter keeps a new line.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) form.current?.requestSubmit();
  }

  return (
    <section aria-labelledby="notes-title" className="flex flex-col gap-4">
      <h2 id="notes-title" className="font-serif text-xl font-medium">
        Notes
      </h2>
      <form ref={form} method="post" onSubmit={onSubmit} className="flex flex-col gap-2" noValidate>
        <label className="sr-only" htmlFor="note-body">
          New note
        </label>
        <textarea
          // Remounts after each saved note, which clears it.
          key={state.saved ?? 0}
          id="note-body"
          name="body"
          rows={2}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="Call back on Thursday, measure on Saturday…"
          onKeyDown={onKeyDown}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "note-error" : undefined}
          className={`${inputClass} resize-y`}
        />
        {error && (
          <p id="note-error" role="alert" className="animate-rise text-sm text-error">
            {error}
          </p>
        )}
        <PrimaryButton type="submit" disabled={pending} className="self-start px-4 py-2 text-sm">
          {pending ? "Saving…" : "Add note"}
        </PrimaryButton>
      </form>
      {notes.length > 0 ? (
        <ul className="flex flex-col divide-y divide-rule rounded-field border border-rule bg-field">
          {notes.map((note) => (
            <li key={note.id} className="flex animate-rise items-start gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-[15px] break-words whitespace-pre-line">{note.body}</p>
                <time dateTime={note.createdAt.toISOString()} className="text-xs text-muted">
                  {formatDateTime(note.createdAt)}
                </time>
              </div>
              <RemoveOption label="this note" action={remove.bind(null, note.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Only you see notes. Use them for call-backs, visit times and what was agreed.</p>
      )}
    </section>
  );
}
