import type { Lead } from "@/domain/leads/lead";
import type { LeadEventListener } from "@/domain/leads/lead-events";
import { formatMoney } from "@/lib/format-money";
import { sendTelegramMessage } from "./telegram-api";

export function leadMessage(lead: Lead, serviceName: string): string {
  return [
    `New request: ${serviceName}`,
    `${lead.customerName}, ${lead.phone}`,
    `Total: ${formatMoney(lead.quote.total)}`,
    lead.comment && `Comment: ${lead.comment}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function telegramNotifier(botToken: string, fetchImpl: typeof fetch = fetch): LeadEventListener {
  return {
    async handle({ lead, business, serviceName }) {
      if (!business.telegramChatId) return;
      await sendTelegramMessage(botToken, business.telegramChatId, leadMessage(lead, serviceName), fetchImpl);
    },
  };
}
