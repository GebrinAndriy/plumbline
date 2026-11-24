import { describe, expect, it } from "vitest";
import { calculateQuote } from "./calculate-quote";
import { PricingConfigError, QuoteInputError } from "./errors";
import type { ChoiceGroup, QuoteInput, Service } from "./types";
import { MAX_CHOICE_GROUPS, validateService } from "./validate-service";

const fabric: ChoiceGroup = {
  id: "fabric",
  label: "Fabric",
  options: [
    { id: "basic", label: "Basic", kind: "rate", amount: 0 },
    { id: "blackout", label: "Blackout", kind: "rate", amount: 15_00 },
  ],
};

const control: ChoiceGroup = {
  id: "control",
  label: "Control",
  options: [
    { id: "chain", label: "Chain", kind: "flat", amount: 0 },
    { id: "motor", label: "Motor", kind: "flat", amount: 120_00 },
  ],
};

const curtains: Service = {
  id: "curtains",
  name: "Curtains",
  rule: { kind: "per_area", ratePerSqm: 40_00, minimumTotal: 100_00 },
  surcharges: [{ id: "urgent", label: "Urgent", kind: "percent", percent: 10 }],
  choices: [fabric, control],
};

// 2 windows of 150 × 200 cm: 6 m², €240 at the base rate.
const twoWindows: QuoteInput = { kind: "per_area", widthCm: 150, heightCm: 200, quantity: 2 };

describe("calculateQuote with choice groups", () => {
  it("adds a per-rate choice for every m² and a flat choice once", () => {
    const quote = calculateQuote(curtains, twoWindows, [], { fabric: "blackout", control: "motor" });
    expect(quote.lines).toEqual([
      { label: "Curtains", amount: 240_00 },
      { label: "Fabric: Blackout", amount: 90_00 },
      { label: "Control: Motor", amount: 120_00 },
    ]);
    expect(quote.total).toBe(450_00);
  });

  it("keeps a free choice as a line, so the receipt and the lead record what was picked", () => {
    const quote = calculateQuote(curtains, twoWindows, [], { fabric: "basic", control: "chain" });
    expect(quote.lines.map((line) => line.label)).toEqual(["Curtains", "Fabric: Basic", "Control: Chain"]);
    expect(quote.total).toBe(240_00);
  });

  it("takes percent options from the price with the chosen fabric", () => {
    const quote = calculateQuote(curtains, twoWindows, ["urgent"], { fabric: "blackout", control: "chain" });
    expect(quote.lines.at(-1)).toEqual({ label: "Urgent", amount: 33_00 });
  });

  it("multiplies a per-rate choice by billable hours for hourly services", () => {
    const cleaning: Service = {
      id: "cleaning",
      name: "Cleaning",
      rule: { kind: "per_hour", ratePerHour: 30_00, minimumHours: 3 },
      surcharges: [],
      choices: [{ id: "products", label: "Products", options: [
        { id: "own", label: "Customer's own", kind: "rate", amount: 0 },
        { id: "eco", label: "Eco", kind: "rate", amount: 5_00 },
      ] }],
    };
    const quote = calculateQuote(cleaning, { kind: "per_hour", hours: 2 }, [], { products: "eco" });
    expect(quote.lines[1]).toEqual({ label: "Products: Eco", amount: 15_00 });
  });

  it("refuses to quote until every group has a pick, and ignores unknown picks", () => {
    expect(() => calculateQuote(curtains, twoWindows, [], { fabric: "blackout" })).toThrow(QuoteInputError);
    expect(() => calculateQuote(curtains, twoWindows, [], { fabric: "silk", control: "chain" })).toThrow("Choose Fabric");
  });
});

describe("validateService with choice groups", () => {
  const withGroups = (choices: ChoiceGroup[]): Service => ({ ...curtains, choices });

  it("accepts groups with free and paid options", () => {
    expect(() => validateService(curtains)).not.toThrow();
  });

  it.each<[string, ChoiceGroup]>([
    ["a single option", { ...fabric, options: [fabric.options[0]] }],
    ["a duplicate option id", { ...fabric, options: [fabric.options[0], { ...fabric.options[1], id: "basic" }] }],
    ["a negative amount", { ...fabric, options: [fabric.options[0], { ...fabric.options[1], amount: -1 }] }],
    ["an empty label", { ...fabric, label: "  " }],
    ["an image that is not https", { ...fabric, options: [fabric.options[0], { ...fabric.options[1], imageUrl: "javascript:alert(1)" }] }],
  ])("rejects %s", (_name, group) => {
    expect(() => validateService(withGroups([group]))).toThrow(PricingConfigError);
  });

  it("rejects duplicate group ids and too many groups", () => {
    expect(() => validateService(withGroups([fabric, fabric]))).toThrow(PricingConfigError);
    const many = Array.from({ length: MAX_CHOICE_GROUPS + 1 }, (_, i) => ({ ...fabric, id: `g${i}` }));
    expect(() => validateService(withGroups(many))).toThrow(PricingConfigError);
  });
});
