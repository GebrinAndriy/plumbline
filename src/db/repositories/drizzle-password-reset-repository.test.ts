import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PasswordResetRepository } from "@/domain/auth/password-reset";
import { createTestDb } from "../testing/create-test-db";
import { createDrizzleAccountRepository } from "./drizzle-account-repository";
import { createDrizzlePasswordResetRepository } from "./drizzle-password-reset-repository";

let close: () => Promise<void>;
let resets: PasswordResetRepository;
let userId: string;

const now = new Date("2026-11-20T10:00:00Z");
const later = new Date("2026-11-20T10:30:00Z");

beforeEach(async () => {
  const testDb = await createTestDb();
  close = testDb.close;
  resets = createDrizzlePasswordResetRepository(testDb.db);
  ({ userId } = await createDrizzleAccountRepository(testDb.db).createOwner({
    email: "owner@example.com",
    passwordHash: "scrypt$hash",
    business: { slug: "blinds", name: "Blinds" },
  }));
}, 30_000);

afterEach(() => close());

describe("password resets", () => {
  it("can be used only once", async () => {
    await resets.save(userId, { tokenHash: "first", expiresAt: later });

    expect(await resets.consume("first", now)).toBe(userId);
    expect(await resets.consume("first", now)).toBeNull();
  });

  it("keeps only the latest link of a user", async () => {
    await resets.save(userId, { tokenHash: "first", expiresAt: later });
    await resets.save(userId, { tokenHash: "second", expiresAt: later });

    expect(await resets.consume("first", now)).toBeNull();
    expect(await resets.consume("second", now)).toBe(userId);
  });

  it("does not accept an expired link and purges it", async () => {
    await resets.save(userId, { tokenHash: "old", expiresAt: now });

    expect(await resets.consume("old", now)).toBeNull();
    expect(await resets.deleteExpired(now)).toBe(1);
  });
});
