import { describe, expect, it } from "vitest";
import type { PricingRule } from "@/domain/pricing/types";
import { previewDescription, previewPrices, previewTitle } from "./link-preview";

const service = (name: string, rule: PricingRule) => ({ name, rule });

const blinds = service("Roller blinds", { kind: "per_area", ratePerSqm: 5_000, minimumTotal: 8_000 });
const cleaning = service("Apartment cleaning", { kind: "per_hour", ratePerHour: 3_000, minimumHours: 3 });
const assembly = service("Furniture assembly", { kind: "fixed", price: 6_000 });
const mounting = service("TV mounting", { kind: "fixed", price: 6_500 });

describe("link preview", () => {
  it("puts the business name in the title", () => {
    expect(previewTitle("Ó Briain Blinds")).toBe("Ó Briain Blinds · Instant prices");
  });

  it("lists headline prices without minimums", () => {
    expect(previewPrices([blinds, cleaning])).toEqual([
      { name: "Roller blinds", rate: "€50 per m²" },
      { name: "Apartment cleaning", rate: "€30 per hour" },
    ]);
  });

  it("names three services and counts the rest", () => {
    expect(previewDescription([blinds, cleaning, assembly, mounting])).toBe(
      "See the exact price online and send a request. Roller blinds €50 per m², Apartment cleaning €30 per hour, " +
        "Furniture assembly €60 per item and 1 more.",
    );
  });

  it("still describes a business that has no services yet", () => {
    expect(previewDescription([])).toBe("See the exact price online and send a request.");
  });
});
