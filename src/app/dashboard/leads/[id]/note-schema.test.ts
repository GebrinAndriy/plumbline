import { describe, expect, it } from "vitest";
import { MAX_NOTE_LENGTH } from "@/domain/leads/lead";
import { toFieldErrors } from "@/lib/field-errors";
import { noteFormSchema } from "./note-schema";

describe("noteFormSchema", () => {
  it("keeps the note without surrounding spaces, line breaks inside included", () => {
    expect(noteFormSchema.parse({ body: "  Call back Thursday\nafter 6 pm  " })).toEqual({ body: "Call back Thursday\nafter 6 pm" });
  });

  it("refuses an empty or too long note", () => {
    expect(toFieldErrors(noteFormSchema.safeParse({ body: "   " }).error!)).toEqual({ body: "Write the note first" });
    expect(noteFormSchema.safeParse({ body: "x".repeat(MAX_NOTE_LENGTH + 1) }).success).toBe(false);
  });
});
