import { describe, expect, it } from "vitest";
import { toFieldErrors } from "@/lib/field-errors";
import { serviceFormSchema } from "./service-form-schema";

describe("serviceFormSchema", () => {
  it("builds a per-area rule in cents", () => {
    const parsed = serviceFormSchema.parse({
      name: " Roller blinds ",
      kind: "per_area",
      ratePerSqm: "1200",
      minimumTotal: "1 500",
    });

    expect(parsed).toEqual({
      name: "Roller blinds",
      rule: { kind: "per_area", ratePerSqm: 120_000, minimumTotal: 150_000 },
    });
  });

  it("leaves out an optional minimum the owner did not fill", () => {
    const parsed = serviceFormSchema.parse({
      name: "Cleaning",
      kind: "per_hour",
      ratePerHour: "450",
      minimumHours: "",
    });

    expect(parsed.rule).toEqual({ kind: "per_hour", ratePerHour: 45_000 });
  });

  it("builds a fixed price rule", () => {
    expect(serviceFormSchema.parse({ name: "Assembly", kind: "fixed", price: "800" }).rule).toEqual({
      kind: "fixed",
      price: 80_000,
    });
  });

  it("points each error at its own field", () => {
    const result = serviceFormSchema.safeParse({
      name: "A",
      kind: "per_hour",
      ratePerHour: "free",
      minimumHours: "30",
    });

    expect(result.success).toBe(false);
    expect(Object.keys(toFieldErrors(result.error!)).sort()).toEqual([
      "minimumHours",
      "name",
      "ratePerHour",
    ]);
  });

  it("rejects zero and prices above the limit", () => {
    for (const price of ["0", "1000001"]) {
      expect(serviceFormSchema.safeParse({ name: "Assembly", kind: "fixed", price }).success).toBe(false);
    }
  });

  it("rejects an unknown pricing kind", () => {
    expect(serviceFormSchema.safeParse({ name: "Assembly", kind: "per_kg", price: "10" }).success).toBe(false);
  });
});
