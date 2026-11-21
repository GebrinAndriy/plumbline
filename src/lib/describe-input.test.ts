import { describe, expect, it } from "vitest";
import { describeInput } from "./describe-input";

describe("describeInput", () => {
  it("shows the size, with the number of pieces only when there are several", () => {
    expect(describeInput({ kind: "per_area", widthCm: 210, heightCm: 160, quantity: 1 })).toBe("210 × 160 cm");
    expect(describeInput({ kind: "per_area", widthCm: 120, heightCm: 150, quantity: 3 })).toBe("3 × 120 × 150 cm");
  });

  it("shows hours with a decimal point and items as pieces", () => {
    expect(describeInput({ kind: "per_hour", hours: 2.5 })).toBe("2.5 h");
    expect(describeInput({ kind: "fixed", quantity: 2 })).toBe("2 pcs");
  });
});
