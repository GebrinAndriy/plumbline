import { describe, expect, it } from "vitest";
import { formatAnimated, formatMoney, formatMoneyInput } from "./format-money";
import { parseMoney } from "./parse-money";

describe("formatMoney", () => {
  it("formats cents as euro", () => {
    expect(formatMoney(150_050)).toBe("€1,500.50");
  });

  it("drops cents when there are none", () => {
    expect(formatMoney(386_000)).toBe("€3,860");
    expect(formatMoney(0)).toBe("€0");
  });

  it("keeps two digits for a partial euro", () => {
    expect(formatMoney(134_805)).toBe("€1,348.05");
  });
});

describe("formatMoneyInput", () => {
  it("drops zero cents and pads the rest", () => {
    expect(formatMoneyInput(45_000)).toBe("450");
    expect(formatMoneyInput(45_050)).toBe("450.50");
    expect(formatMoneyInput(45_005)).toBe("450.05");
  });

  it("is read back by parseMoney as the same amount", () => {
    for (const amount of [1, 99, 100, 45_050, 100_000_000]) {
      expect(parseMoney(formatMoneyInput(amount))).toBe(amount);
    }
  });
});

describe("formatAnimated", () => {
  it("rounds to whole euros while counting and shows the exact total at the end", () => {
    expect(formatAnimated(123_456, 134_854)).toBe("€1,235");
    expect(formatAnimated(134_854, 134_854)).toBe("€1,348.54");
  });
});
