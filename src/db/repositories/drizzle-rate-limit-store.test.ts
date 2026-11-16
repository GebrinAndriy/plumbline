import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { RateLimitStore } from "@/domain/rate-limit/rate-limit";
import { createTestDb } from "../testing/create-test-db";
import { createDrizzleRateLimitStore } from "./drizzle-rate-limit-store";

let close: () => Promise<void>;
let store: RateLimitStore;

beforeEach(async () => {
  const testDb = await createTestDb();
  close = testDb.close;
  store = createDrizzleRateLimitStore(testDb.db);
});

afterEach(() => close());

const firstWindow = new Date("2026-01-01T12:00:00Z");
const secondWindow = new Date("2026-01-01T12:15:00Z");

describe("drizzle rate limit store", () => {
  it("counts hits per key within a window", async () => {
    expect(await store.increment("a", firstWindow)).toBe(1);
    expect(await store.increment("a", firstWindow)).toBe(2);
    expect(await store.increment("b", firstWindow)).toBe(1);
  });

  it("resets the count when a new window starts", async () => {
    await store.increment("a", firstWindow);
    await store.increment("a", firstWindow);
    expect(await store.increment("a", secondWindow)).toBe(1);
  });

  it("does not lose hits that arrive at the same time", async () => {
    const hits = await Promise.all(Array.from({ length: 5 }, () => store.increment("a", firstWindow)));
    expect(hits.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("deletes rows whose window started before the cutoff", async () => {
    await store.increment("old", firstWindow);
    await store.increment("current", secondWindow);

    expect(await store.deleteWindowsStartedBefore(secondWindow)).toBe(1);
    expect(await store.increment("old", firstWindow)).toBe(1);
    expect(await store.increment("current", secondWindow)).toBe(2);
  });
});
