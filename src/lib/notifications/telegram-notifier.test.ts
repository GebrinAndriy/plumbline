import { describe, expect, it } from "vitest";
import type { Business } from "@/domain/catalog/catalog";
import type { Lead, LeadItem } from "@/domain/leads/lead";
import type { LeadEvent } from "@/domain/leads/lead-events";
import { formatMoney } from "@/lib/format-money";
import { leadMessage, leadUrl, telegramNotifier } from "./telegram-notifier";

const ORIGIN = "https://plumbline.test";

const blinds: LeadItem = {
  serviceId: "s1",
  serviceName: "Roller blinds",
  input: { kind: "per_area", widthCm: 210, heightCm: 160, quantity: 1 },
  quote: {
    lines: [
      { label: "Roller blinds", amount: 16_800 },
      { label: "Installation", amount: 3_000 },
      { label: "Blackout fabric", amount: 2_520 },
    ],
    total: 22_320,
  },
};
const cleaning: LeadItem = {
  serviceId: "s2",
  serviceName: "Cleaning",
  input: { kind: "per_hour", hours: 3 },
  quote: { lines: [{ label: "Cleaning", amount: 9_000 }], total: 9_000 },
};

const lead = {
  id: "7f0c",
  customerName: "Aoife",
  phone: "+353871234567",
  comment: "After 6 pm, please",
  items: [blinds],
  total: 22_320,
} as unknown as Lead;

function eventFor(telegramChatId: string | null): LeadEvent {
  const business: Business = {
    id: "b1",
    slug: "blinds",
    name: "Blinds",
    telegramChatId,
    telegramChatName: null,
    phone: null,
    address: null,
    accentColor: null,
    logoUrl: null,
  };
  return { type: "lead.created", lead, business };
}

function recordingFetch(status = 200) {
  const calls: { url: string; body: unknown }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    return new Response("{}", { status });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

describe("leadMessage", () => {
  it("lists what the customer chose, the total and a link to the request", () => {
    expect(leadMessage(lead, leadUrl(ORIGIN, lead.id)).split("\n")).toEqual([
      "New request · Roller blinds",
      "",
      "Aoife",
      "+353 87 123 4567",
      "Roller blinds · 210 × 160 cm · Installation · Blackout fabric",
      `Total: ${formatMoney(22_320)}`,
      "Comment: After 6 pm, please",
      "",
      "Open the request: https://plumbline.test/dashboard/leads/7f0c",
    ]);
  });

  it("lists each item with its price when the request has several", () => {
    const several = { ...lead, comment: null, items: [blinds, cleaning], total: 31_320 } as Lead;
    expect(leadMessage(several, leadUrl(ORIGIN, lead.id)).split("\n").slice(0, 7)).toEqual([
      "New request · Roller blinds and 1 more",
      "",
      "Aoife",
      "+353 87 123 4567",
      `• Roller blinds · 210 × 160 cm · Installation · Blackout fabric — ${formatMoney(22_320)}`,
      `• Cleaning · 3 h — ${formatMoney(9_000)}`,
      `Total: ${formatMoney(31_320)}`,
    ]);
  });

  it("leaves out the comment line when there is none", () => {
    expect(leadMessage({ ...lead, comment: null } as Lead, leadUrl(ORIGIN, lead.id))).not.toContain("Comment:");
  });
});

describe("telegramNotifier", () => {
  it("sends the lead to the business chat", async () => {
    const { calls, fetchImpl } = recordingFetch();

    await telegramNotifier("bot-token", ORIGIN, fetchImpl).handle(eventFor("123456789"));

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.telegram.org/botbot-token/sendMessage");
    expect(calls[0].body).toEqual({
      chat_id: "123456789",
      text: leadMessage(lead, leadUrl(ORIGIN, lead.id)),
    });
  });

  it("skips a business that has not connected Telegram", async () => {
    const { calls, fetchImpl } = recordingFetch();

    await telegramNotifier("bot-token", ORIGIN, fetchImpl).handle(eventFor(null));

    expect(calls).toEqual([]);
  });

  it("fails without leaking the bot token when Telegram rejects the message", async () => {
    const { fetchImpl } = recordingFetch(403);
    const sending = telegramNotifier("secret-token", ORIGIN, fetchImpl).handle(eventFor("123456789"));

    await expect(sending).rejects.toThrow("status 403");
    await expect(sending).rejects.not.toThrow("secret-token");
  });
});
