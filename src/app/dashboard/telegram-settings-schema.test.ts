import { describe, expect, it } from "vitest";
import { telegramSettingsSchema } from "./telegram-settings-schema";

const parse = (chatId: string) => telegramSettingsSchema.safeParse({ chatId });

describe("telegramSettingsSchema", () => {
  it("accepts a user or group chat id", () => {
    expect(parse(" 123456789 ").data).toEqual({ chatId: "123456789" });
    expect(parse("-1001234567890").data).toEqual({ chatId: "-1001234567890" });
  });

  it("turns an empty value into a disconnect", () => {
    expect(parse("").data).toEqual({ chatId: null });
  });

  it("rejects anything that is not a chat id", () => {
    expect(parse("@my_channel").success).toBe(false);
    expect(parse("12ab").success).toBe(false);
  });
});
