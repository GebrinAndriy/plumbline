import { config } from "dotenv";
import { callTelegram } from "../src/lib/notifications/telegram-api";

config({ path: ".env.local", quiet: true });

const SECRET_FORMAT = /^[A-Za-z0-9_-]{1,256}$/;

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Set TELEGRAM_BOT_TOKEN");

  if (process.argv.includes("--delete")) {
    await callTelegram(token, "deleteWebhook", {});
    console.log("Webhook removed, the dashboard falls back to getUpdates");
    return;
  }

  const appUrl = process.env.APP_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!appUrl || !secret) throw new Error("Set APP_URL and TELEGRAM_WEBHOOK_SECRET");
  if (!SECRET_FORMAT.test(secret)) throw new Error("TELEGRAM_WEBHOOK_SECRET may use only A-Z, a-z, 0-9, _ and -");

  const url = new URL("/api/telegram/webhook", appUrl);
  if (url.protocol !== "https:") throw new Error("Telegram accepts only https webhooks");

  await callTelegram(token, "setWebhook", { url: url.href, secret_token: secret, allowed_updates: ["message"] });
  console.log(`Webhook set to ${url.href}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
