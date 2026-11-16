import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { TelegramLinkRepository } from "@/domain/telegram/telegram-link";
import { createTestDb } from "../testing/create-test-db";
import { createDrizzleCatalogRepository } from "./drizzle-catalog-repository";
import { createDrizzleTelegramLinkRepository } from "./drizzle-telegram-link-repository";

let close: () => Promise<void>;
let links: TelegramLinkRepository;
let businessId: string;

const now = new Date("2026-01-01T12:00:00Z");
const expiresAt = new Date("2026-01-01T12:10:00Z");

beforeEach(async () => {
  const testDb = await createTestDb();
  close = testDb.close;
  links = createDrizzleTelegramLinkRepository(testDb.db);
  const business = await createDrizzleCatalogRepository(testDb.db).createBusiness({
    slug: "blinds",
    name: "Blinds",
    telegramChatId: null,
  });
  businessId = business.id;
});

afterEach(() => close());

describe("drizzle telegram link repository", () => {
  it("finds the business by a live token", async () => {
    await links.save(businessId, { tokenHash: "hash-1", expiresAt });

    expect(await links.findBusinessByToken("hash-1", now)).toBe(businessId);
    expect(await links.findBusinessByToken("hash-1", expiresAt)).toBeNull();
    expect(await links.findBusinessByToken("other", now)).toBeNull();
  });

  it("replaces the earlier token of the same business", async () => {
    await links.save(businessId, { tokenHash: "hash-1", expiresAt });
    await links.save(businessId, { tokenHash: "hash-2", expiresAt });

    expect(await links.findBusinessByToken("hash-1", now)).toBeNull();
    expect(await links.findBusinessByToken("hash-2", now)).toBe(businessId);
  });

  it("deletes the link", async () => {
    await links.save(businessId, { tokenHash: "hash-1", expiresAt });
    await links.delete(businessId);

    expect(await links.findExpiry(businessId)).toBeNull();
  });

  it("deletes only expired links", async () => {
    await links.save(businessId, { tokenHash: "hash-1", expiresAt });

    expect(await links.deleteExpired(now)).toBe(0);
    expect(await links.deleteExpired(expiresAt)).toBe(1);
    expect(await links.findExpiry(businessId)).toBeNull();
  });
});
