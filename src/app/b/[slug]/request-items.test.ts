import { describe, expect, it } from "vitest";
import type { Service } from "@/domain/pricing/types";
import { EMPTY_FIELDS } from "./preview-quote";
import { combinedQuote, isBlank, priceItem, toPayload, type ItemDraft } from "./request-items";

const blinds: Service = { id: "s1", name: "Roller blinds", rule: { kind: "per_area", ratePerSqm: 5_000 }, surcharges: [] };
const cleaning: Service = { id: "s2", name: "Cleaning", rule: { kind: "per_hour", ratePerHour: 3_000 }, surcharges: [] };

const window200x150: ItemDraft = { serviceId: "s1", fields: { ...EMPTY_FIELDS, widthCm: "200", heightCm: "150" }, surchargeIds: [], choices: {} };
const threeHours: ItemDraft = { serviceId: "s2", fields: { ...EMPTY_FIELDS, hours: "3" }, surchargeIds: [], choices: {} };

describe("request items", () => {
  it("adds up every item into one receipt", () => {
    const quote = combinedQuote([priceItem([blinds, cleaning], window200x150), priceItem([blinds, cleaning], threeHours)]);
    expect(quote).toEqual({
      lines: [
        { label: "Roller blinds, 200 × 150 cm", amount: 15_000 },
        { label: "Cleaning, 3 h", amount: 9_000 },
      ],
      total: 24_000,
    });
  });

  it("shows no total while an item is unfinished or its service is gone", () => {
    const unfinished = { ...window200x150, fields: { ...window200x150.fields, heightCm: "" } };
    expect(combinedQuote([priceItem([blinds], window200x150), priceItem([blinds], unfinished)])).toBeNull();
    expect(combinedQuote([priceItem([cleaning], window200x150)])).toBeNull();
  });

  it("treats an item as blank until a field differs from how it opened", () => {
    expect(isBlank({ ...window200x150, fields: EMPTY_FIELDS })).toBe(true);
    expect(isBlank(window200x150)).toBe(false);
    expect(isBlank({ ...window200x150, fields: { ...EMPTY_FIELDS, quantity: "2" } })).toBe(false);
  });

  it("sends the raw fields with the service's pricing kind", () => {
    expect(toPayload(threeHours, cleaning)).toEqual({
      serviceId: "s2",
      input: { kind: "per_hour", ...EMPTY_FIELDS, hours: "3" },
      surchargeIds: [],
      choices: {},
    });
  });
});
