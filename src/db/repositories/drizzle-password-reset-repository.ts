import { and, eq, gt, lte } from "drizzle-orm";
import type { PasswordResetRepository } from "@/domain/auth/password-reset";
import type { Database } from "../database";
import { passwordResets } from "../schema";

export function createDrizzlePasswordResetRepository(db: Database): PasswordResetRepository {
  return {
    async save(userId, reset) {
      await db
        .insert(passwordResets)
        .values({ userId, ...reset })
        .onConflictDoUpdate({ target: passwordResets.userId, set: reset });
    },

    // DELETE ... RETURNING in one statement: two tabs submitting the same link cannot both succeed.
    async consume(tokenHash, now) {
      const [row] = await db
        .delete(passwordResets)
        .where(and(eq(passwordResets.tokenHash, tokenHash), gt(passwordResets.expiresAt, now)))
        .returning({ userId: passwordResets.userId });
      return row?.userId ?? null;
    },

    async deleteExpired(now) {
      const rows = await db
        .delete(passwordResets)
        .where(lte(passwordResets.expiresAt, now))
        .returning({ userId: passwordResets.userId });
      return rows.length;
    },
  };
}
