import { describe, expect, it } from "vitest";
import { formatPhone } from "./format-phone";

describe("formatPhone", () => {
  it("groups a Ukrainian mobile number", () => {
    expect(formatPhone("+380671234567")).toBe("+380 67 123 45 67");
  });

  it("leaves other numbers as they are", () => {
    expect(formatPhone("+48123456789")).toBe("+48123456789");
  });
});
