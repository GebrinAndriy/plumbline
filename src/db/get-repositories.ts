import "server-only";
import { getDb } from "./client";
import { createDrizzleAccountRepository } from "./repositories/drizzle-account-repository";
import { createDrizzleCatalogRepository } from "./repositories/drizzle-catalog-repository";
import { createDrizzleLeadRepository } from "./repositories/drizzle-lead-repository";
import { createDrizzleRateLimitStore } from "./repositories/drizzle-rate-limit-store";
import { createDrizzleSessionRepository } from "./repositories/drizzle-session-repository";
import { createDrizzleTelegramLinkRepository } from "./repositories/drizzle-telegram-link-repository";

export function getRepositories() {
  const db = getDb();
  return {
    accounts: createDrizzleAccountRepository(db),
    catalog: createDrizzleCatalogRepository(db),
    leads: createDrizzleLeadRepository(db),
    rateLimits: createDrizzleRateLimitStore(db),
    sessions: createDrizzleSessionRepository(db),
    telegramLinks: createDrizzleTelegramLinkRepository(db),
  };
}
