import { describe, expect, it } from "vitest";
import { fakeAccounts, fakeHasher } from "./fakes.test-utils";
import { RESET_TTL_MS, requestPasswordReset, resetPassword } from "./password-reset";

const now = new Date("2026-11-20T10:00:00Z");
const hashToken = (token: string) => `hash:${token}`;

function setup() {
  const accounts = fakeAccounts();
  accounts.owners.push({ email: "owner@example.com", passwordHash: "hashed:old", business: { slug: "b", name: "B" } });
  const saved: { userId: string; tokenHash: string; expiresAt: Date }[] = [];
  const changed: { userId: string; passwordHash: string }[] = [];
  const resets = {
    save: async (userId: string, reset: { tokenHash: string; expiresAt: Date }) => {
      saved.push({ userId, ...reset });
    },
    consume: async (tokenHash: string) => (tokenHash === "hash:valid" ? "user-1" : null),
  };
  accounts.changePassword = async (userId, passwordHash) => {
    changed.push({ userId, passwordHash });
  };
  return { accounts, resets, saved, changed, generateToken: () => "valid", hashToken };
}

describe("requestPasswordReset", () => {
  it("stores only the token hash, valid for 30 minutes", async () => {
    const deps = setup();

    const result = await requestPasswordReset(deps, "  Owner@Example.com ", now);

    expect(result).toEqual({ to: "owner@example.com", token: "valid" });
    expect(deps.saved).toEqual([
      { userId: "user-1", tokenHash: "hash:valid", expiresAt: new Date(now.getTime() + RESET_TTL_MS) },
    ]);
  });

  it("does nothing for an email without an account", async () => {
    const deps = setup();

    expect(await requestPasswordReset(deps, "stranger@example.com", now)).toBeNull();
    expect(deps.saved).toEqual([]);
  });
});

describe("resetPassword", () => {
  it("sets the new password hash for the link's user", async () => {
    const deps = { ...setup(), hasher: fakeHasher() };

    expect(await resetPassword(deps, "valid", "new password", now)).toEqual({ userId: "user-1" });
    expect(deps.changed).toEqual([{ userId: "user-1", passwordHash: "hashed:new password" }]);
  });

  it("changes nothing when the link is unknown, used or expired", async () => {
    const deps = { ...setup(), hasher: fakeHasher() };

    expect(await resetPassword(deps, "stale", "new password", now)).toBeNull();
    expect(deps.changed).toEqual([]);
  });
});
