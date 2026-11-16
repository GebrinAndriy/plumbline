import type { SessionRepository } from "../auth/session";
import { RATE_LIMITS, type RateLimitStore } from "../rate-limit/rate-limit";
import type { TelegramLinkRepository } from "../telegram/telegram-link";

type PurgeDeps = {
  sessions: Pick<SessionRepository, "deleteExpired">;
  telegramLinks: Pick<TelegramLinkRepository, "deleteExpired">;
  rateLimits: Pick<RateLimitStore, "deleteWindowsStartedBefore">;
};

export type PurgeReport = { sessions: number; telegramLinks: number; rateLimits: number };

// A row's policy is not stored, so it is kept until even the longest window has ended.
export const RATE_LIMIT_RETENTION_MS = Math.max(
  ...Object.values(RATE_LIMITS).map((policy) => policy.windowMs),
);

export async function purgeExpired(deps: PurgeDeps, now: Date): Promise<PurgeReport> {
  return {
    sessions: await deps.sessions.deleteExpired(now),
    telegramLinks: await deps.telegramLinks.deleteExpired(now),
    rateLimits: await deps.rateLimits.deleteWindowsStartedBefore(
      new Date(now.getTime() - RATE_LIMIT_RETENTION_MS),
    ),
  };
}
