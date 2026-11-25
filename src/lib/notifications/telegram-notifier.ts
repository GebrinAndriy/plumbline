import type { Lead } from "@/domain/leads/lead";
import type { LeadEventListener } from "@/domain/leads/lead-events";
import { describeLeadItem, serviceNames } from "@/lib/describe-lead-item";
import { formatMoney } from "@/lib/format-money";
import { formatPhone } from "@/lib/format-phone";
import { sendTelegramMessage } from "./telegram-api";

export function leadUrl(appOrigin: string, leadId: string): string {
  return `${appOrigin}/dashboard/leads/${leadId}`;
}

export function leadMessage(lead: Lead, url: string): string {
  const several = lead.items.length > 1;
  return [
    `New request · ${serviceNames(lead.items)}`,
    "",
    lead.customerName,
    formatPhone(lead.phone),
    ...lead.items.map((item) => (several ? `• ${describeLeadItem(item)} — ${formatMoney(item.quote.total)}` : describeLeadItem(item))),
    `Total: ${formatMoney(lead.total)}`,
    lead.comment && `Comment: ${lead.comment}`,
    "",
    `Open the request: ${url}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function telegramNotifier(
  botToken: string,
  appOrigin: string,
  fetchImpl: typeof fetch = fetch,
): LeadEventListener {
  return {
    async handle({ lead, business }) {
      if (!business.telegramChatId) return;
      const text = leadMessage(lead, leadUrl(appOrigin, lead.id));
      await sendTelegramMessage(botToken, business.telegramChatId, text, fetchImpl);
    },
  };
}
