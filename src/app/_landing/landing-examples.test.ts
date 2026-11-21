import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format-money";
import { LANDING_EXAMPLES, PRICING_MODELS } from "./landing-examples";

const byTab = (tab: string) => LANDING_EXAMPLES.find((example) => example.tab === tab)!;

describe("landing examples", () => {
  it("prices the blinds example per square metre with installation", () => {
    const example = byTab("Blinds · per m²");
    expect(example.detail).toBe("3.36 m²");
    expect(example.quote.lines.map((line) => formatMoney(line.amount))).toEqual(["€168", "€30"]);
    expect(formatMoney(example.quote.total)).toBe("€198");
    expect(example.serviceLine).toBe("Roller blinds · €50 per m²");
  });

  it("adds the weekend percent on top of the hourly price", () => {
    const example = byTab("Cleaning · per hour");
    expect(example.detail).toBe("4 h");
    expect(formatMoney(example.quote.total)).toBe("€144");
  });

  it("multiplies the fixed price by the number of items", () => {
    const example = byTab("Repairs · fixed price");
    expect(example.detail).toBe("2 pcs");
    expect(formatMoney(example.quote.total)).toBe("€150");
  });
});

describe("pricing models", () => {
  it("shows base prices without options", () => {
    expect(PRICING_MODELS.map((model) => formatMoney(model.result))).toEqual(["€168", "€90", "€130"]);
  });
});
