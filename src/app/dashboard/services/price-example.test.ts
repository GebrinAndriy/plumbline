import { describe, expect, it } from "vitest";
import { draftPriceExample, priceExample } from "./price-example";

describe("priceExample", () => {
  it("prices a 200 × 150 cm order by area", () => {
    expect(priceExample({ kind: "per_area", ratePerSqm: 5_000 })).toBe("200 × 150 cm = 3 m² × €50 = €150");
  });

  it("shows when the minimum order raises the price", () => {
    expect(priceExample({ kind: "per_area", ratePerSqm: 2_000, minimumTotal: 8_000 })).toBe(
      "200 × 150 cm = 3 m² × €20, raised to the minimum order €80",
    );
  });

  it("prices three hours and two items", () => {
    expect(priceExample({ kind: "per_hour", ratePerHour: 3_000 })).toBe("3 h × €30 = €90");
    expect(priceExample({ kind: "fixed", price: 6_500 })).toBe("2 × €65 = €130");
  });
});

describe("draftPriceExample", () => {
  it("quotes the form as typed, without needing a name", () => {
    expect(draftPriceExample({ kind: "per_hour", ratePerHour: "30", minimumHours: "" })).toBe("3 h × €30 = €90");
  });

  it("returns null while the price is missing or invalid", () => {
    expect(draftPriceExample({ kind: "per_area", ratePerSqm: "" })).toBeNull();
    expect(draftPriceExample({ kind: "fixed", price: "0x10" })).toBeNull();
  });
});
