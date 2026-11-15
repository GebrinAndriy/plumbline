import "server-only";
import { createHash, randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { z } from "zod";
import type { StartCommand } from "@/domain/telegram/telegram-link";
import { callTelegram } from "./telegram-api";
import { parseStartCommands } from "./telegram-updates";

export const generateToken = () => randomBytes(24).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const botToken = () => process.env.TELEGRAM_BOT_TOKEN || null;

let username: Promise<string> | undefined;

// The username never changes for a token, so one getMe per server process is enough.
export function botUsername(token: string): Promise<string> {
  username ??= callTelegram(token, "getMe", {})
    .then((raw) => z.object({ result: z.object({ username: z.string() }) }).parse(raw).result.username)
    .catch((error) => {
      username = undefined;
      throw error;
    });
  return username;
}

export async function qrCodeDataUrl(link: string): Promise<string> {
  const svg = await QRCode.toString(link, { type: "svg", margin: 1 });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Without a webhook the server asks Telegram for new messages; fine for a small number of owners.
export async function readStartCommands(
  token: string,
): Promise<{ commands: StartCommand[]; acknowledge: () => Promise<void> }> {
  const raw = await callTelegram(token, "getUpdates", { timeout: 0, allowed_updates: ["message"] });
  const { commands, lastUpdateId } = parseStartCommands(raw);
  return {
    commands,
    acknowledge: async () => {
      if (lastUpdateId === null) return;
      await callTelegram(token, "getUpdates", { offset: lastUpdateId + 1, limit: 1, timeout: 0 });
    },
  };
}
