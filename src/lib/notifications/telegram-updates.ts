import { z } from "zod";
import type { StartCommand } from "@/domain/telegram/telegram-link";

const updatesSchema = z.object({
  result: z.array(
    z.object({
      update_id: z.number(),
      message: z.object({ text: z.string().optional(), chat: z.object({ id: z.number() }) }).optional(),
    }),
  ),
});

const START = /^\/start ([A-Za-z0-9_-]{16,64})$/;

export function parseStartCommands(raw: unknown): { commands: StartCommand[]; lastUpdateId: number | null } {
  const { result } = updatesSchema.parse(raw);
  const commands = result.flatMap(({ message }) => {
    const token = message?.text?.match(START)?.[1];
    return message && token ? [{ chatId: String(message.chat.id), token }] : [];
  });
  const lastUpdateId = result.length ? Math.max(...result.map((update) => update.update_id)) : null;
  return { commands, lastUpdateId };
}
