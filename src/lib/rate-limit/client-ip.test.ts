import { describe, expect, it } from "vitest";
import { clientIpFrom } from "./client-ip";

describe("clientIpFrom", () => {
  it("takes the first address from x-forwarded-for", () => {
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIpFrom(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
  });

  it("groups requests without an address under one key", () => {
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});
