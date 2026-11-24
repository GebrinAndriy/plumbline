import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format-money";
import { describeChoice, describeRule, describeSurcharge } from "./describe-rule";

describe("describeRule", () => {
  it("describes each pricing kind with its minimum", () => {
    expect(describeRule({ kind: "per_area", ratePerSqm: 120_000, minimumTotal: 150_000 })).toBe(
      `${formatMoney(120_000)} per m², minimum ${formatMoney(150_000)}`,
    );
    expect(describeRule({ kind: "per_hour", ratePerHour: 45_000, minimumHours: 3 })).toBe(
      `${formatMoney(45_000)} per hour, minimum 3 h`,
    );
    expect(describeRule({ kind: "fixed", price: 80_000 })).toBe(`${formatMoney(80_000)} per item`);
  });

  it("skips a minimum that is not set", () => {
    expect(describeRule({ kind: "per_hour", ratePerHour: 45_000 })).toBe(`${formatMoney(45_000)} per hour`);
  });
});

describe("describeSurcharge", () => {
  it("shows a flat amount and a percent", () => {
    expect(describeSurcharge({ id: "a", label: "Installation", kind: "flat", amount: 50_000 })).toBe(
      `+${formatMoney(50_000)}`,
    );
    expect(describeSurcharge({ id: "b", label: "Urgent", kind: "percent", percent: 20 })).toBe("+20%");
  });
});

describe("describeChoice", () => {
  it("names a free choice as included and a paid one by how it adds", () => {
    expect(describeChoice({ id: "a", label: "Basic", kind: "rate", amount: 0 }, "per_area")).toBe("Included");
    expect(describeChoice({ id: "b", label: "Blackout", kind: "rate", amount: 1_500 }, "per_area")).toBe(`+${formatMoney(1_500)} per m²`);
    expect(describeChoice({ id: "c", label: "Eco", kind: "rate", amount: 500 }, "per_hour")).toBe(`+${formatMoney(500)} per hour`);
    expect(describeChoice({ id: "d", label: "Motor", kind: "flat", amount: 12_000 }, "per_area")).toBe(`+${formatMoney(12_000)}`);
  });
});
