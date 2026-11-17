"use server";

import { refresh } from "next/cache";
import { getRepositories } from "@/db/get-repositories";
import { RATE_LIMITS, retryMessage } from "@/domain/rate-limit/rate-limit";
import { startTelegramLink } from "@/domain/telegram/telegram-link";
import { requireOwner } from "@/lib/auth/current-owner";
import {
  botToken,
  botUsername,
  connectChats,
  generateToken,
  hashToken,
  qrCodeDataUrl,
  readStartCommands,
  webhookSecret,
} from "@/lib/notifications/telegram-link-service";
import { limitBySubject } from "@/lib/rate-limit/rate-limiter";

export type StartLinkResult =
  | { ok: true; link: string; qrCode: string }
  | { ok: false; error: string };

export async function startTelegramLinkAction(): Promise<StartLinkResult> {
  const { business } = await requireOwner();
  if (!business) return { ok: false, error: "This account has no business" };

  const token = botToken();
  if (!token) return { ok: false, error: "Telegram is not configured on this server" };

  const limit = await limitBySubject(RATE_LIMITS.telegramLinkByBusiness, business.id);
  if (!limit.allowed) return { ok: false, error: retryMessage(limit.retryAfterMs) };

  let username: string;
  try {
    username = await botUsername(token);
  } catch (error) {
    console.error("Telegram getMe failed", error);
    return { ok: false, error: "Could not reach Telegram, please try again" };
  }

  const { token: startToken } = await startTelegramLink(
    { links: getRepositories().telegramLinks, generateToken, hashToken },
    business.id,
    new Date(),
  );
  const link = `https://t.me/${username}?start=${startToken}`;
  return { ok: true, link, qrCode: await qrCodeDataUrl(link) };
}

export type LinkStatus = "waiting" | "connected" | "expired";

export async function checkTelegramLinkAction(): Promise<LinkStatus> {
  const { business } = await requireOwner();
  if (!business) return "expired";

  const now = new Date();
  const expiresAt = await getRepositories().telegramLinks.findExpiry(business.id);
  // No pending link means another check already connected it, or it was never started.
  if (!expiresAt) return business.telegramChatId ? "connected" : "expired";
  if (expiresAt <= now) return "expired";

  const token = botToken();
  if (!token) return "expired";
  // With a webhook the link is made when Telegram calls us; the next check sees it as connected.
  if (webhookSecret()) return "waiting";

  try {
    const { commands, acknowledge } = await readStartCommands(token);
    const linked = await connectChats(token, commands, now);
    await acknowledge();
    if (linked.includes(business.id)) return "connected";
  } catch (error) {
    console.error("Telegram link check failed", error);
  }
  return "waiting";
}

export async function disconnectTelegramAction(): Promise<void> {
  const { business } = await requireOwner();
  if (!business) return;
  await getRepositories().catalog.setTelegramChat(business.id, null);
  refresh();
}
