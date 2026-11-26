"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db/get-repositories";
import { requireOwner } from "@/lib/auth/current-owner";
import { toFieldErrors, type FieldErrors } from "@/lib/field-errors";
import { noteFormSchema } from "./note-schema";

export type NoteFormState = { fieldErrors: FieldErrors; message?: string; saved?: number };

export async function addNoteAction(leadId: string, previous: NoteFormState, formData: FormData): Promise<NoteFormState> {
  const { business } = await requireOwner();
  if (!business) return { fieldErrors: {}, message: "This account has no business" };

  const parsed = noteFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const note = await getRepositories().leads.addNote(business.id, leadId, parsed.data.body, new Date());
  if (!note) return { fieldErrors: {}, message: "This request no longer exists" };
  refresh();
  // A new number each time, so the form can clear itself after every saved note.
  return { fieldErrors: {}, saved: (previous.saved ?? 0) + 1 };
}

export async function removeNoteAction(noteId: string): Promise<void> {
  const { business } = await requireOwner();
  const id = z.uuid().safeParse(noteId);
  if (!business || !id.success) return;
  await getRepositories().leads.removeNote(business.id, id.data);
  refresh();
}
