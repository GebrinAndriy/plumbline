import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyInput } from "./format-money";
import { parseMoney } from "./parse-money";

// Intl uses non-breaking spaces as thousand separators.
const normalize = (s: string) => s.replace(/\s/g, " ");

describe("formatMoney", () => {
  it("formats kopiykas as hryvnias", () => {
    expect(normalize(formatMoney(150_050))).toBe("1 500,50 ₴");
  });

  it("drops kopiykas when there are none", () => {
    expect(normalize(formatMoney(386_000))).toBe("3 860 ₴");
    expect(normalize(formatMoney(0))).toBe("0 ₴");
  });

  it("keeps two digits for a partial hryvnia", () => {
    expect(normalize(formatMoney(134_805))).toBe("1 348,05 ₴");
  });
});

describe("formatMoneyInput", () => {
  it("drops zero kopiykas and pads the rest", () => {
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
