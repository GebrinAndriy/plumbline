import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "./cron-auth";

describe("isAuthorizedCron", () => {
  it("accepts the bearer secret", () => {
    expect(isAuthorizedCron("Bearer s3cret-value", "s3cret-value")).toBe(true);
  });

  it("rejects a wrong or missing header", () => {
    expect(isAuthorizedCron("Bearer guess", "s3cret-value")).toBe(false);
    expect(isAuthorizedCron("s3cret-value", "s3cret-value")).toBe(false);
    expect(isAuthorizedCron(null, "s3cret-value")).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false);
  });
});
