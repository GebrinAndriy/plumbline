import { describe, expect, it } from "vitest";
import type { LeadItem } from "@/domain/leads/lead";
import { describeLeadItem, receiptQuote, serviceNames } from "./describe-lead-item";

const blinds: LeadItem = {
  serviceId: "s1",
  serviceName: "Roller blinds",
  input: { kind: "per_area", widthCm: 200, heightCm: 150, quantity: 1 },
  quote: {
    lines: [
      { label: "Roller blinds", amount: 15_000 },
      { label: "Fabric: Linen", amount: 9_000 },
    ],
    total: 24_000,
  },
};
const cleaning: LeadItem = {
  serviceId: "s2",
  serviceName: "Cleaning",
  input: { kind: "per_hour", hours: 3 },
  quote: { lines: [{ label: "Cleaning", amount: 9_000 }], total: 9_000 },
};

describe("lead item descriptions", () => {
  it("names the service, the size and every pick", () => {
    expect(describeLeadItem(blinds)).toBe("Roller blinds · 200 × 150 cm · Fabric: Linen");
  });

  it("builds one receipt for all items, each base line with its size", () => {
    expect(receiptQuote([blinds, cleaning])).toEqual({
      lines: [
        { label: "Roller blinds, 200 × 150 cm", amount: 15_000 },
        { label: "Fabric: Linen", amount: 9_000 },
        { label: "Cleaning, 3 h", amount: 9_000 },
      ],
      total: 33_000,
    });
  });

  it("names one service, or the first and how many more", () => {
    expect(serviceNames([blinds])).toBe("Roller blinds");
    expect(serviceNames([blinds, cleaning, cleaning])).toBe("Roller blinds and 2 more");
  });
});
