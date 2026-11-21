import { describe, expect, it } from "vitest";
import { parseMoney } from "./parse-money";

describe("parseMoney", () => {
  it("turns euros into cents", () => {
    expect(parseMoney("450")).toBe(45_000);
    expect(parseMoney("450.5")).toBe(45_050);
    expect(parseMoney("0,99")).toBe(99);
  });

  it("accepts commas and spaces between thousands", () => {
    expect(parseMoney("1,200.99")).toBe(120_099);
    expect(parseMoney("1,200")).toBe(120_000);
    expect(parseMoney(" 1 200,99 ")).toBe(120_099);
  });

  it("keeps exact cents where floats would drift", () => {
    expect(parseMoney("0.29")).toBe(29);
    expect(parseMoney("1.15")).toBe(115);
  });

  it("rejects anything that is not an amount", () => {
    for (const text of ["", "-5", "12.345", "1e3", "abc", "1.2.3"]) {
      expect(parseMoney(text)).toBeNull();
    }
  });
});
