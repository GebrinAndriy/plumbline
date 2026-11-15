import { describe, expect, it } from "vitest";
import { consumeRateLimit, retryMessage, type RateLimitStore } from "./rate-limit";

function fakeStore(): RateLimitStore & { keys: string[] } {
  const counts = new Map<string, number>();
  const keys: string[] = [];
  return {
    keys,
    async increment(key, windowStart) {
      keys.push(key);
      const id = `${key}@${windowStart.toISOString()}`;
      const next = (counts.get(id) ?? 0) + 1;
      counts.set(id, next);
      return next;
    },
  };
}

const policy = { name: "test", limit: 2, windowMs: 60_000 };
const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, seconds));

describe("consumeRateLimit", () => {
  it("allows hits up to the limit and blocks the next one", async () => {
    const store = fakeStore();
    expect(await consumeRateLimit(store, policy, "1.2.3.4", at(0))).toEqual({ allowed: true });
    expect(await consumeRateLimit(store, policy, "1.2.3.4", at(10))).toEqual({ allowed: true });
    expect(await consumeRateLimit(store, policy, "1.2.3.4", at(20))).toEqual({
      allowed: false,
      retryAfterMs: 40_000,
    });
  });

  it("counts each subject separately", async () => {
    const store = fakeStore();
    await consumeRateLimit(store, policy, "a", at(0));
    await consumeRateLimit(store, policy, "a", at(1));
    expect(await consumeRateLimit(store, policy, "b", at(2))).toEqual({ allowed: true });
  });

  it("starts counting again in the next window", async () => {
    const store = fakeStore();
    for (const second of [0, 1, 2]) await consumeRateLimit(store, policy, "a", at(second));
    expect(await consumeRateLimit(store, policy, "a", at(60))).toEqual({ allowed: true });
  });

  it("prefixes the key with the policy name", async () => {
    const store = fakeStore();
    await consumeRateLimit(store, policy, "a", at(0));
    expect(store.keys).toEqual(["test:a"]);
  });
});

describe("retryMessage", () => {
  it("rounds up to whole minutes and never says zero", () => {
    expect(retryMessage(61_000)).toBe("Too many attempts. Try again in 2 min.");
    expect(retryMessage(500)).toBe("Too many attempts. Try again in 1 min.");
  });
});
