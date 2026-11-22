import { describe, expect, it } from "vitest";
import { parseLeadSearch } from "./lead-search";

describe("parseLeadSearch", () => {
  it("ignores an empty or blank query", () => {
    expect(parseLeadSearch("")).toBeUndefined();
    expect(parseLeadSearch("   ")).toBeUndefined();
  });

  it("searches names by the trimmed text", () => {
    expect(parseLeadSearch("  Aoife   Kelly ")).toEqual({ text: "Aoife Kelly", phoneDigits: null });
  });

  it("turns a phone typed any way into digits without the leading zeros", () => {
    for (const typed of ["087 123 4567", "(087) 123-4567", "00353 87 123 4567", "+353 87 123 4567"]) {
      expect(parseLeadSearch(typed)?.phoneDigits).toMatch(/871234567$/);
    }
    expect(parseLeadSearch("087 123 4567")?.phoneDigits).toBe("871234567");
  });

  it("does not treat a name with digits or a too short number as a phone", () => {
    expect(parseLeadSearch("Flat 12")?.phoneDigits).toBeNull();
    expect(parseLeadSearch("08")?.phoneDigits).toBeNull();
  });
});
