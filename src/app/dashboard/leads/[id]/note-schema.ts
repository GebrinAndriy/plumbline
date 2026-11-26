import { z } from "zod";
import { MAX_NOTE_LENGTH } from "@/domain/leads/lead";

export const noteFormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write the note first")
    .max(MAX_NOTE_LENGTH, `Keep the note under ${MAX_NOTE_LENGTH} characters`),
});
