import { normalizeEmail, type AccountRepository, type PasswordHasher } from "./account";

export interface PasswordResetRepository {
  // One pending reset per user: a new request replaces the earlier link.
  save(userId: string, reset: { tokenHash: string; expiresAt: Date }): Promise<void>;
  /** Deletes the reset and returns its user, or null if it is unknown, used or expired. */
  consume(tokenHash: string, now: Date): Promise<string | null>;
  deleteExpired(now: Date): Promise<number>;
}

export const RESET_TTL_MS = 30 * 60_000;

type TokenDeps = {
  generateToken: () => string;
  hashToken: (token: string) => string;
};

type RequestDeps = TokenDeps & {
  accounts: Pick<AccountRepository, "findUserByEmail">;
  resets: Pick<PasswordResetRepository, "save">;
};

export async function requestPasswordReset(
  { accounts, resets, generateToken, hashToken }: RequestDeps,
  email: string,
  now: Date,
): Promise<{ to: string; token: string } | null> {
  const user = await accounts.findUserByEmail(normalizeEmail(email));
  if (!user) return null;

  const token = generateToken();
  await resets.save(user.id, { tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + RESET_TTL_MS) });
  return { to: user.email, token };
}

type ResetDeps = Pick<TokenDeps, "hashToken"> & {
  accounts: Pick<AccountRepository, "changePassword">;
  resets: Pick<PasswordResetRepository, "consume">;
  hasher: Pick<PasswordHasher, "hash">;
};

export async function resetPassword(
  { accounts, resets, hasher, hashToken }: ResetDeps,
  token: string,
  password: string,
  now: Date,
): Promise<{ userId: string } | null> {
  const userId = await resets.consume(hashToken(token), now);
  if (!userId) return null;

  await accounts.changePassword(userId, await hasher.hash(password));
  return { userId };
}
