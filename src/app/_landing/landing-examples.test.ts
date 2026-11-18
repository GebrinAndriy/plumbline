import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format-money";
import { LANDING_EXAMPLES, PRICING_MODELS } from "./landing-examples";

const normalize = (s: string) => s.replace(/\s/g, " ");
const money = (kopiykas: number) => normalize(formatMoney(kopiykas));
const byTab = (tab: string) => LANDING_EXAMPLES.find((example) => example.tab === tab)!;

describe("landing examples", () => {
  it("prices the blinds example per square metre with installation", () => {
    const example = byTab("Blinds · per m²");
    expect(normalize(example.detail)).toBe("3,36 m²");
    expect(example.quote.lines.map((line) => money(line.amount))).toEqual(["3 360 ₴", "500 ₴"]);
    expect(money(example.quote.total)).toBe("3 860 ₴");
    expect(normalize(example.serviceLine)).toBe("Roller blinds · 1 000 ₴ per m²");
  });

  it("adds the weekend percent on top of the hourly price", () => {
    const example = byTab("Cleaning · per hour");
    expect(normalize(example.detail)).toBe("4 h");
    expect(money(example.quote.total)).toBe("1 920 ₴");
  });

  it("multiplies the fixed price by the number of items", () => {
    const example = byTab("Repairs · fixed price");
    expect(normalize(example.detail)).toBe("2 pcs");
    expect(money(example.quote.total)).toBe("1 600 ₴");
  });
});

describe("pricing models", () => {
  it("shows base prices without options", () => {
    expect(PRICING_MODELS.map((model) => money(model.result))).toEqual(["3 360 ₴", "1 200 ₴", "1 300 ₴"]);
  });
});
