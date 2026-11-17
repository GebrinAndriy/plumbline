import { describe, expect, it } from "vitest";
import { matchesSecret } from "./matches-secret";

describe("matchesSecret", () => {
  it("accepts the exact secret", () => {
    expect(matchesSecret("s3cret-value", "s3cret-value")).toBe(true);
  });

  it("rejects a different, longer or missing value", () => {
    expect(matchesSecret("s3cret-valuX", "s3cret-value")).toBe(false);
    expect(matchesSecret("s3cret-value-and-more", "s3cret-value")).toBe(false);
    expect(matchesSecret(null, "s3cret-value")).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    expect(matchesSecret("", "")).toBe(false);
    expect(matchesSecret("undefined", undefined)).toBe(false);
  });
});
