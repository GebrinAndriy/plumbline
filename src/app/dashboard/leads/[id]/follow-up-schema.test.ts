import { describe, expect, it } from "vitest";
import { followUpFormSchema } from "./follow-up-schema";

describe("followUpFormSchema", () => {
  it("keeps a day and clears on an empty field", () => {
    expect(followUpFormSchema.parse({ on: "2026-11-28" })).toEqual({ on: "2026-11-28" });
    expect(followUpFormSchema.parse({ on: " " })).toEqual({ on: null });
  });

  it("refuses text that is not a real day", () => {
    expect(followUpFormSchema.safeParse({ on: "Thursday" }).success).toBe(false);
    expect(followUpFormSchema.safeParse({ on: "2026-02-30" }).success).toBe(false);
  });
});
