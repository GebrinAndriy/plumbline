import { describe, expect, it } from "vitest";
import { draftPriceExample, priceExample } from "./price-example";

const normalize = (s: string | null) => s?.replace(/\s/g, " ");

describe("priceExample", () => {
  it("prices a 200 × 150 cm order by area", () => {
    expect(normalize(priceExample({ kind: "per_area", ratePerSqm: 100_000 }))).toBe(
      "200 × 150 cm = 3 m² × 1 000 ₴ = 3 000 ₴",
    );
  });

  it("shows when the minimum order raises the price", () => {
    expect(normalize(priceExample({ kind: "per_area", ratePerSqm: 50_000, minimumTotal: 200_000 }))).toBe(
      "200 × 150 cm = 3 m² × 500 ₴, raised to the minimum order 2 000 ₴",
    );
  });

  it("prices three hours and two items", () => {
    expect(normalize(priceExample({ kind: "per_hour", ratePerHour: 40_000 }))).toBe("3 h × 400 ₴ = 1 200 ₴");
    expect(normalize(priceExample({ kind: "fixed", price: 65_000 }))).toBe("2 × 650 ₴ = 1 300 ₴");
  });
});

describe("draftPriceExample", () => {
  it("quotes the form as typed, without needing a name", () => {
    expect(normalize(draftPriceExample({ kind: "per_hour", ratePerHour: "400", minimumHours: "" }))).toBe(
      "3 h × 400 ₴ = 1 200 ₴",
    );
  });

  it("returns null while the price is missing or invalid", () => {
    expect(draftPriceExample({ kind: "per_area", ratePerSqm: "" })).toBeNull();
    expect(draftPriceExample({ kind: "fixed", price: "0x10" })).toBeNull();
  });
});
