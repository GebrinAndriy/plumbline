import { describe, expect, it } from "vitest";
import { explainQuote } from "./explain-quote";

const normalize = (s: string) => s.replace(/\s/g, " ");
const explain = (...args: Parameters<typeof explainQuote>) => {
  const { detail, formula } = explainQuote(...args);
  return { detail: normalize(detail), formula: normalize(formula) };
};

describe("explainQuote", () => {
  const blinds = { kind: "per_area", ratePerSqm: 100_000, minimumTotal: 150_000 } as const;

  it("shows the area and the arithmetic for a size", () => {
    expect(explain(blinds, { kind: "per_area", widthCm: 210, heightCm: 160, quantity: 1 }, 336_000)).toEqual({
      detail: "3,36 m²",
      formula: "210 × 160 cm = 3,36 m² × 1 000 ₴ = 3 360 ₴",
    });
  });

  it("counts several pieces and says when the minimum order applies", () => {
    expect(explain(blinds, { kind: "per_area", widthCm: 50, heightCm: 40, quantity: 2 }, 150_000)).toEqual({
      detail: "0,4 m²",
      formula: "2 × 50 × 40 cm = 0,4 m² × 1 000 ₴, raised to the minimum order 1 500 ₴",
    });
  });

  it("bills at least the minimum hours", () => {
    const cleaning = { kind: "per_hour", ratePerHour: 40_000, minimumHours: 2 } as const;
    expect(explain(cleaning, { kind: "per_hour", hours: 3 }, 120_000).formula).toBe("3 h × 400 ₴ = 1 200 ₴");
    expect(explain(cleaning, { kind: "per_hour", hours: 1.5 }, 80_000)).toEqual({
      detail: "1,5 h",
      formula: "2 h × 400 ₴ = 800 ₴ (minimum 2 h)",
    });
  });

  it("multiplies a fixed price", () => {
    expect(explain({ kind: "fixed", price: 65_000 }, { kind: "fixed", quantity: 2 }, 130_000)).toEqual({
      detail: "2 pcs",
      formula: "2 × 650 ₴ = 1 300 ₴",
    });
  });
});
