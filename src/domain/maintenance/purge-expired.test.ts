import { describe, expect, it } from "vitest";
import { RATE_LIMITS } from "../rate-limit/rate-limit";
import { RATE_LIMIT_RETENTION_MS, purgeExpired } from "./purge-expired";

const now = new Date("2026-11-15T03:00:00Z");

function setup() {
  const calls: Record<string, Date> = {};
  const recorder = (name: string, deleted: number) => async (at: Date) => {
    calls[name] = at;
    return deleted;
  };
  const deps = {
    sessions: { deleteExpired: recorder("sessions", 2) },
    passwordResets: { deleteExpired: recorder("passwordResets", 3) },
    telegramLinks: { deleteExpired: recorder("telegramLinks", 1) },
    rateLimits: { deleteWindowsStartedBefore: recorder("rateLimits", 7) },
  };
  return { calls, deps };
}

describe("purgeExpired", () => {
  it("deletes sessions, password resets and links that expired by now", async () => {
    const { calls, deps } = setup();

    await purgeExpired(deps, now);

    expect(calls.sessions).toEqual(now);
    expect(calls.passwordResets).toEqual(now);
    expect(calls.telegramLinks).toEqual(now);
  });

  it("keeps rate limit rows until the longest window has ended", async () => {
    const { calls, deps } = setup();

    await purgeExpired(deps, now);

    expect(calls.rateLimits).toEqual(new Date(now.getTime() - RATE_LIMIT_RETENTION_MS));
    for (const policy of Object.values(RATE_LIMITS)) {
      expect(policy.windowMs).toBeLessThanOrEqual(RATE_LIMIT_RETENTION_MS);
    }
  });

  it("reports how many rows were deleted", async () => {
    const { deps } = setup();

    expect(await purgeExpired(deps, now)).toEqual({ sessions: 2, passwordResets: 3, telegramLinks: 1, rateLimits: 7 });
  });
});
