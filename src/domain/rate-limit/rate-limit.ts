export type RateLimitPolicy = { name: string; limit: number; windowMs: number };

export interface RateLimitStore {
  // Atomically counts one hit for the key in this window and returns the hits so far.
  increment(key: string, windowStart: Date): Promise<number>;
  deleteWindowsStartedBefore(cutoff: Date): Promise<number>;
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

const MINUTE = 60_000;

export const RATE_LIMITS = {
  signInByIp: { name: "sign-in:ip", limit: 20, windowMs: 15 * MINUTE },
  signInByEmail: { name: "sign-in:email", limit: 10, windowMs: 15 * MINUTE },
  signUpByIp: { name: "sign-up:ip", limit: 5, windowMs: 60 * MINUTE },
  leadByIp: { name: "lead:ip", limit: 10, windowMs: 60 * MINUTE },
  telegramLinkByBusiness: { name: "telegram-link:business", limit: 10, windowMs: 60 * MINUTE },
} satisfies Record<string, RateLimitPolicy>;

export async function consumeRateLimit(
  store: RateLimitStore,
  policy: RateLimitPolicy,
  subject: string,
  now: Date,
): Promise<RateLimitResult> {
  const windowStart = Math.floor(now.getTime() / policy.windowMs) * policy.windowMs;
  const hits = await store.increment(`${policy.name}:${subject}`, new Date(windowStart));
  if (hits <= policy.limit) return { allowed: true };
  return { allowed: false, retryAfterMs: windowStart + policy.windowMs - now.getTime() };
}

export function retryMessage(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / MINUTE));
  return `Too many attempts. Try again in ${minutes} min.`;
}
