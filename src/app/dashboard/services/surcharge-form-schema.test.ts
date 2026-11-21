import { describe, expect, it } from "vitest";
import { toFieldErrors } from "@/lib/field-errors";
import { surchargeFormSchema } from "./surcharge-form-schema";

describe("surchargeFormSchema", () => {
  it("builds a flat option in cents", () => {
    expect(surchargeFormSchema.parse({ kind: "flat", label: " Installation ", amount: "500,50" })).toEqual({
      kind: "flat",
      label: "Installation",
      amount: 50_050,
    });
  });

  it("builds a percent option", () => {
    expect(surchargeFormSchema.parse({ kind: "percent", label: "Urgent", percent: "20" })).toEqual({
      kind: "percent",
      label: "Urgent",
      percent: 20,
    });
  });

  it.each(["0", "", "101", "12.5", "lots", "0x14", "2e1"])("rejects percent %j", (percent) => {
    const result = surchargeFormSchema.safeParse({ kind: "percent", label: "Urgent", percent });
    expect(result.success).toBe(false);
    expect(Object.keys(toFieldErrors(result.error!))).toEqual(["percent"]);
  });

  it("points errors at the label and amount", () => {
    const result = surchargeFormSchema.safeParse({ kind: "flat", label: "x", amount: "free" });
    expect(Object.keys(toFieldErrors(result.error!)).sort()).toEqual(["amount", "label"]);
  });

  it("rejects an unknown kind", () => {
    expect(surchargeFormSchema.safeParse({ kind: "per_km", label: "Distance", amount: "10" }).success).toBe(false);
  });
});
