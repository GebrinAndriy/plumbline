import { and, eq, gt, lte } from "drizzle-orm";
import type { TelegramLinkRepository } from "@/domain/telegram/telegram-link";
import type { Database } from "../database";
import { telegramLinks } from "../schema";

export function createDrizzleTelegramLinkRepository(db: Database): TelegramLinkRepository {
  return {
    async save(businessId, link) {
      await db
        .insert(telegramLinks)
        .values({ businessId, ...link })
        .onConflictDoUpdate({ target: telegramLinks.businessId, set: link });
    },

    async findExpiry(businessId) {
      const [row] = await db
        .select({ expiresAt: telegramLinks.expiresAt })
        .from(telegramLinks)
        .where(eq(telegramLinks.businessId, businessId))
        .limit(1);
      return row?.expiresAt ?? null;
    },

    async findBusinessByToken(tokenHash, now) {
      const [row] = await db
        .select({ businessId: telegramLinks.businessId })
        .from(telegramLinks)
        .where(and(eq(telegramLinks.tokenHash, tokenHash), gt(telegramLinks.expiresAt, now)))
        .limit(1);
      return row?.businessId ?? null;
    },

    async delete(businessId) {
      await db.delete(telegramLinks).where(eq(telegramLinks.businessId, businessId));
    },

    async deleteExpired(now) {
      const rows = await db
        .delete(telegramLinks)
        .where(lte(telegramLinks.expiresAt, now))
        .returning({ businessId: telegramLinks.businessId });
      return rows.length;
    },
  };
}
