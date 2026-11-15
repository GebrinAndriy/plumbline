import { describe, expect, it } from "vitest";
import { LINK_TTL_MS, linkChats, startTelegramLink, type TelegramLinkRepository } from "./telegram-link";

type Row = { tokenHash: string; expiresAt: Date };

function fakeLinks(): TelegramLinkRepository & { rows: Map<string, Row> } {
  const rows = new Map<string, Row>();
  return {
    rows,
    save: async (businessId, link) => void rows.set(businessId, link),
    findExpiry: async (businessId) => rows.get(businessId)?.expiresAt ?? null,
    async findBusinessByToken(tokenHash, now) {
      const match = [...rows].find(([, row]) => row.tokenHash === tokenHash && row.expiresAt > now);
      return match?.[0] ?? null;
    },
    delete: async (businessId) => void rows.delete(businessId),
  };
}

const hashToken = (token: string) => `hash:${token}`;
const now = new Date("2026-01-01T12:00:00Z");

function setup() {
  const links = fakeLinks();
  const connected: { businessId: string; chatId: string }[] = [];
  let next = 0;
  const startDeps = { links, hashToken, generateToken: () => `token-${++next}` };
  const linkDeps = {
    links,
    hashToken,
    connect: async (businessId: string, chatId: string) => void connected.push({ businessId, chatId }),
  };
  return { links, connected, startDeps, linkDeps };
}

describe("startTelegramLink", () => {
  it("returns the token and stores only its hash", async () => {
    const { links, startDeps } = setup();

    const link = await startTelegramLink(startDeps, "b1", now);

    expect(link).toEqual({ token: "token-1", expiresAt: new Date(now.getTime() + LINK_TTL_MS) });
    expect(links.rows.get("b1")).toEqual({ tokenHash: "hash:token-1", expiresAt: link.expiresAt });
  });

  it("makes the previous token useless", async () => {
    const { connected, startDeps, linkDeps } = setup();
    await startTelegramLink(startDeps, "b1", now);
    await startTelegramLink(startDeps, "b1", now);

    await linkChats(linkDeps, [{ chatId: "555", token: "token-1" }], now);

    expect(connected).toEqual([]);
  });
});

describe("linkChats", () => {
  it("connects the chat that sent the business's token", async () => {
    const { links, connected, startDeps, linkDeps } = setup();
    await startTelegramLink(startDeps, "b1", now);

    const linked = await linkChats(linkDeps, [{ chatId: "555", token: "token-1" }], now);

    expect(linked).toEqual([{ businessId: "b1", chatId: "555" }]);
    expect(connected).toEqual([{ businessId: "b1", chatId: "555" }]);
    expect(links.rows.size).toBe(0);
  });

  it("uses a token only once", async () => {
    const { connected, startDeps, linkDeps } = setup();
    await startTelegramLink(startDeps, "b1", now);

    await linkChats(
      linkDeps,
      [
        { chatId: "555", token: "token-1" },
        { chatId: "666", token: "token-1" },
      ],
      now,
    );

    expect(connected).toEqual([{ businessId: "b1", chatId: "555" }]);
  });

  it("ignores unknown and expired tokens", async () => {
    const { connected, startDeps, linkDeps } = setup();
    await startTelegramLink(startDeps, "b1", now);
    const later = new Date(now.getTime() + LINK_TTL_MS);

    await linkChats(linkDeps, [{ chatId: "555", token: "guess" }], now);
    await linkChats(linkDeps, [{ chatId: "555", token: "token-1" }], later);

    expect(connected).toEqual([]);
  });
});
