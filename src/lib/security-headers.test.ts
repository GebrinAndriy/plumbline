import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./security-headers";

const directives = (csp: string) => new Map(csp.split("; ").map((d) => [d.split(" ")[0], d]));
const header = (isDev: boolean, key: string) => securityHeaders(isDev).find((h) => h.key === key)?.value;

describe("contentSecurityPolicy", () => {
  it("loads scripts, styles and requests only from this site", () => {
    const csp = directives(contentSecurityPolicy(false));

    expect(csp.get("default-src")).toBe("default-src 'self'");
    expect(csp.get("script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(csp.get("connect-src")).toBe("connect-src 'self'");
    expect(csp.get("object-src")).toBe("object-src 'none'");
  });

  it("forbids framing and posting forms elsewhere", () => {
    const csp = directives(contentSecurityPolicy(false));

    expect(csp.get("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(csp.get("form-action")).toBe("form-action 'self'");
    expect(csp.get("base-uri")).toBe("base-uri 'self'");
  });

  it("allows eval only in development, where React needs it for error overlays", () => {
    expect(contentSecurityPolicy(false)).not.toContain("unsafe-eval");
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
  });
});

describe("securityHeaders", () => {
  it("sends HSTS and upgrades requests only in production", () => {
    expect(header(false, "Strict-Transport-Security")).toBe("max-age=63072000; includeSubDomains");
    expect(header(true, "Strict-Transport-Security")).toBeUndefined();
    expect(contentSecurityPolicy(true)).not.toContain("upgrade-insecure-requests");
  });

  it("sets the classic hardening headers", () => {
    expect(header(false, "X-Frame-Options")).toBe("DENY");
    expect(header(false, "X-Content-Type-Options")).toBe("nosniff");
    expect(header(false, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
});
