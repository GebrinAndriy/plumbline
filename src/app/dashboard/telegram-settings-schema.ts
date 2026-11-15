import { z } from "zod";

// Empty input disconnects Telegram; user chats have positive ids, groups negative ones.
export const telegramSettingsSchema = z.object({
  chatId: z
    .string()
    .trim()
    .regex(/^(-?\d{5,20})?$/, "Chat ID is a number, for example 123456789")
    .transform((value) => value || null),
});
