import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format-money";
import { describeRule } from "./describe-rule";

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
