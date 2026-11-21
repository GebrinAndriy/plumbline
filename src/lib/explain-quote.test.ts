import { describe, expect, it } from "vitest";
import { explainQuote } from "./explain-quote";

describe("explainQuote", () => {
  const blinds = { kind: "per_area", ratePerSqm: 5_000, minimumTotal: 8_000 } as const;

  it("shows the area and the arithmetic for a size", () => {
    expect(explainQuote(blinds, { kind: "per_area", widthCm: 210, heightCm: 160, quantity: 1 }, 16_800)).toEqual({
      detail: "3.36 m²",
      formula: "210 × 160 cm = 3.36 m² × €50 = €168",
    });
  });

  it("counts several pieces and says when the minimum order applies", () => {
    expect(explainQuote(blinds, { kind: "per_area", widthCm: 50, heightCm: 40, quantity: 2 }, 8_000)).toEqual({
      detail: "0.4 m²",
      formula: "2 × 50 × 40 cm = 0.4 m² × €50, raised to the minimum order €80",
    });
  });

  it("bills at least the minimum hours", () => {
    const cleaning = { kind: "per_hour", ratePerHour: 3_000, minimumHours: 2 } as const;
    expect(explainQuote(cleaning, { kind: "per_hour", hours: 3 }, 9_000).formula).toBe("3 h × €30 = €90");
    expect(explainQuote(cleaning, { kind: "per_hour", hours: 1.5 }, 6_000)).toEqual({
      detail: "1.5 h",
      formula: "2 h × €30 = €60 (minimum 2 h)",
    });
  });

  it("multiplies a fixed price", () => {
    expect(explainQuote({ kind: "fixed", price: 6_500 }, { kind: "fixed", quantity: 2 }, 13_000)).toEqual({
      detail: "2 pcs",
      formula: "2 × €65 = €130",
    });
  });
});
