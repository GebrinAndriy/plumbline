import "server-only";
import { after } from "next/server";
import { notifyAll, type LeadEvent, type LeadEventListener } from "@/domain/leads/lead-events";
import { telegramNotifier } from "./telegram-notifier";

function listeners(): LeadEventListener[] {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  return botToken ? [telegramNotifier(botToken)] : [];
}

// Runs after the response is sent, so a slow Telegram never delays the customer.
export function publishLeadEvent(event: LeadEvent): void {
  after(() => notifyAll(listeners(), event, (error) => console.error("Lead notification failed", error)));
}
