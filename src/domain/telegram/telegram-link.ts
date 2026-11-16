import type { TelegramChat } from "../catalog/catalog";

export interface TelegramLinkRepository {
  // Replaces any earlier link, so only the latest token works.
  save(businessId: string, link: { tokenHash: string; expiresAt: Date }): Promise<void>;
  findExpiry(businessId: string): Promise<Date | null>;
  findBusinessByToken(tokenHash: string, now: Date): Promise<string | null>;
  delete(businessId: string): Promise<void>;
  deleteExpired(now: Date): Promise<number>;
}

export type StartCommand = { chat: TelegramChat; token: string };

export const LINK_TTL_MS = 10 * 60_000;

type StartDeps = {
  links: TelegramLinkRepository;
  generateToken: () => string;
  hashToken: (token: string) => string;
};

export async function startTelegramLink(
  { links, generateToken, hashToken }: StartDeps,
  businessId: string,
  now: Date,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(now.getTime() + LINK_TTL_MS);
  await links.save(businessId, { tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

type LinkDeps = {
  links: TelegramLinkRepository;
  hashToken: (token: string) => string;
  connect: (businessId: string, chat: TelegramChat) => Promise<void>;
};

// Pressing Start in the bot proves the chat belongs to whoever opened the dashboard link.
export async function linkChats(
  { links, hashToken, connect }: LinkDeps,
  commands: StartCommand[],
  now: Date,
): Promise<{ businessId: string; chat: TelegramChat }[]> {
  const linked: { businessId: string; chat: TelegramChat }[] = [];
  for (const { chat, token } of commands) {
    const businessId = await links.findBusinessByToken(hashToken(token), now);
    if (!businessId) continue;
    await connect(businessId, chat);
    await links.delete(businessId);
    linked.push({ businessId, chat });
  }
  return linked;
}
