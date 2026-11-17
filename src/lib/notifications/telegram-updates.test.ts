import { describe, expect, it } from "vitest";
import { parseStartCommands, parseStartUpdate } from "./telegram-updates";

const token = "abcdefghijklmnop_1234-XYZ";
const start = (update_id: number, chat: object, text = `/start ${token}`) => ({
  update_id,
  message: { text, chat: { type: "private", ...chat } },
});

describe("parseStartCommands", () => {
  it("takes the token and chat from /start messages", () => {
    const raw = {
      ok: true,
      result: [start(10, { id: 555, username: "olena", first_name: "Olena" }), start(11, { id: 666 }, "hello")],
    };

    expect(parseStartCommands(raw)).toEqual({
      commands: [{ chat: { id: "555", name: "@olena" }, token }],
      lastUpdateId: 11,
    });
  });

  it("names a chat without a username after the person, and a group after its title", () => {
    const raw = {
      ok: true,
      result: [
        start(1, { id: 555, first_name: "Olena", last_name: "Koval" }),
        start(2, { id: -100123, type: "group", title: "Blinds team" }),
        start(3, { id: 777 }),
      ],
    };

    expect(parseStartCommands(raw).commands.map(({ chat }) => chat)).toEqual([
      { id: "555", name: "Olena Koval" },
      { id: "-100123", name: "Blinds team" },
      { id: "777", name: null },
    ]);
  });

  it("ignores /start without a valid token and updates without a message", () => {
    const raw = {
      ok: true,
      result: [start(1, { id: 555 }, "/start"), start(2, { id: 555 }, "/start <script>"), { update_id: 4 }],
    };

    expect(parseStartCommands(raw)).toEqual({ commands: [], lastUpdateId: 4 });
  });

  it("handles an empty batch", () => {
    expect(parseStartCommands({ ok: true, result: [] })).toEqual({ commands: [], lastUpdateId: null });
  });
});

describe("parseStartUpdate", () => {
  it("takes the command from a single webhook update", () => {
    expect(parseStartUpdate(start(7, { id: 555, username: "olena" }))).toEqual({
      chat: { id: "555", name: "@olena" },
      token,
    });
  });

  it("ignores other messages, other update types and malformed bodies", () => {
    expect(parseStartUpdate(start(7, { id: 555 }, "hello"))).toBeNull();
    expect(parseStartUpdate({ update_id: 8, edited_message: {} })).toBeNull();
    expect(parseStartUpdate({ message: "nope" })).toBeNull();
    expect(parseStartUpdate(null)).toBeNull();
  });
});
