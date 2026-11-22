import type { Lead } from "@/domain/leads/lead";
import type { LeadEventListener } from "@/domain/leads/lead-events";
import { describeInput } from "@/lib/describe-input";
import { formatMoney } from "@/lib/format-money";
import { formatPhone } from "@/lib/format-phone";
import { sendTelegramMessage } from "./telegram-api";

export function leadUrl(appOrigin: string, leadId: string): string {
  return `${appOrigin}/dashboard#lead-${leadId}`;
}

export function leadMessage(lead: Lead, serviceName: string, url: string): string {
  const options = lead.quote.lines.slice(1).map((line) => line.label);
  return [
    `New request · ${serviceName}`,
    "",
    lead.customerName,
    formatPhone(lead.phone),
    describeInput(lead.input),
    options.length > 0 && `Options: ${options.join(", ")}`,
    `Total: ${formatMoney(lead.quote.total)}`,
    lead.comment && `Comment: ${lead.comment}`,
    "",
    `Open the request: ${url}`,
  ]
    .filter((line) => line !== false && line !== null)
    .join("\n");
}

export function telegramNotifier(
  botToken: string,
  appOrigin: string,
  fetchImpl: typeof fetch = fetch,
): LeadEventListener {
  return {
    async handle({ lead, business, serviceName }) {
      if (!business.telegramChatId) return;
      const text = leadMessage(lead, serviceName, leadUrl(appOrigin, lead.id));
      await sendTelegramMessage(botToken, business.telegramChatId, text, fetchImpl);
    },
  };
}
