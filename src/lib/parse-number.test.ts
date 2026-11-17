import { describe, expect, it } from "vitest";
import { decimalInput, parseDecimal } from "./parse-number";

describe("parseDecimal", () => {
  it.each([
    ["150", 150],
    [" 200.5 ", 200.5],
    ["1,5", 1.5],
    ["007", 7],
  ])("reads %j as %d", (text, value) => {
    expect(parseDecimal(text)).toBe(value);
  });

  it.each(["0x10", "0b11", "0o7", "1e3", "Infinity", "NaN", "", "  ", "-5", "+5", ".5", "5.", "1 000", "1.2.3"])(
    "rejects %j",
    (text) => {
      expect(parseDecimal(text)).toBeNull();
    },
  );
});

describe("decimalInput", () => {
  it("parses a decimal and reports anything else with the given message", () => {
    const schema = decimalInput("Enter a size");
    expect(schema.parse("12.5")).toBe(12.5);
    expect(schema.safeParse("0x10").error?.issues[0].message).toBe("Enter a size");
    expect(schema.safeParse(undefined).error?.issues[0].message).toBe("Enter a size");
  });
});
