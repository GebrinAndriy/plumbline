import type { Lead } from "@/domain/leads/lead";
import type { LeadEventListener } from "@/domain/leads/lead-events";
import { formatMoney } from "@/lib/format-money";

const TELEGRAM_API = "https://api.telegram.org";

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

      const response = await fetchImpl(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: business.telegramChatId, text: leadMessage(lead, serviceName) }),
        signal: AbortSignal.timeout(5000),
      });
      // The URL holds the bot token, so it is kept out of the error.
      if (!response.ok) throw new Error(`Telegram sendMessage failed with status ${response.status}`);
    },
  };
}
