import "server-only";
import { after } from "next/server";
import { notifyAll, type LeadEvent, type LeadEventListener } from "@/domain/leads/lead-events";
import { appOrigin } from "@/lib/app-origin";
import { telegramNotifier } from "./telegram-notifier";

async function listeners(): Promise<LeadEventListener[]> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  return botToken ? [telegramNotifier(botToken, await appOrigin())] : [];
}

// Runs after the response is sent, so a slow Telegram never delays the customer.
export function publishLeadEvent(event: LeadEvent): void {
  after(async () =>
    notifyAll(await listeners(), event, (error) => console.error("Lead notification failed", error)),
  );
}
