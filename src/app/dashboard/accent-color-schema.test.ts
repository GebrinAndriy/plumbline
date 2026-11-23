import { describe, expect, it } from "vitest";
import { toFieldErrors } from "@/lib/field-errors";
import { accentColorFormSchema } from "./accent-color-schema";

describe("accentColorFormSchema", () => {
  it("stores a readable colour in lower case", () => {
    expect(accentColorFormSchema.parse({ accentColor: " #1D4ED8 " })).toBe("#1d4ed8");
  });

  it("stores nothing for an empty field or the default, so the page follows Plumbline", () => {
    expect(accentColorFormSchema.parse({ accentColor: "" })).toBeNull();
    expect(accentColorFormSchema.parse({})).toBeNull();
    expect(accentColorFormSchema.parse({ accentColor: "#C2410C" })).toBeNull();
  });

  it("rejects text that is not a hex colour", () => {
    const result = accentColorFormSchema.safeParse({ accentColor: "red; background: url(x)" });
    expect(toFieldErrors(result.error!)).toEqual({ accentColor: "Enter a colour like #1d4ed8" });
  });

  it("rejects a colour too light to read, with its contrast", () => {
    const result = accentColorFormSchema.safeParse({ accentColor: "#facc15" });
    expect(toFieldErrors(result.error!).accentColor).toMatch(/^Too light to read on your page: 1\.\d:1, needs 4\.5:1$/);
  });
});
