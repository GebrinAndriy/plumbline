import { describe, expect, it } from "vitest";
import { parseStartCommands } from "./telegram-updates";

const token = "abcdefghijklmnop_1234-XYZ";
const update = (update_id: number, text: string | undefined, chatId = 555) => ({
  update_id,
  message: { text, chat: { id: chatId, type: "private" }, from: { id: chatId } },
});

describe("parseStartCommands", () => {
  it("takes the token and chat from /start messages", () => {
    const raw = { ok: true, result: [update(10, `/start ${token}`), update(11, "hello", 666)] };

    expect(parseStartCommands(raw)).toEqual({
      commands: [{ chatId: "555", token }],
      lastUpdateId: 11,
    });
  });

  it("ignores /start without a valid token and updates without a message", () => {
    const raw = {
      ok: true,
      result: [update(1, "/start"), update(2, "/start <script>"), update(3, undefined), { update_id: 4 }],
    };

    expect(parseStartCommands(raw)).toEqual({ commands: [], lastUpdateId: 4 });
  });

  it("handles an empty batch", () => {
    expect(parseStartCommands({ ok: true, result: [] })).toEqual({ commands: [], lastUpdateId: null });
  });

  it("keeps group chat ids negative", () => {
    const raw = { ok: true, result: [update(1, `/start ${token}`, -100123)] };

    expect(parseStartCommands(raw).commands).toEqual([{ chatId: "-100123", token }]);
  });
});
