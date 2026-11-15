import { z } from "zod";
import type { TelegramChat } from "@/domain/catalog/catalog";
import type { StartCommand } from "@/domain/telegram/telegram-link";

const chatSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

const updatesSchema = z.object({
  result: z.array(
    z.object({
      update_id: z.number(),
      message: z.object({ text: z.string().optional(), chat: chatSchema }).optional(),
    }),
  ),
});

const START = /^\/start ([A-Za-z0-9_-]{16,64})$/;
const MAX_NAME_LENGTH = 100;

// Groups have a title; private chats show the @username, or the person's name when there is none.
function chatName(chat: z.infer<typeof chatSchema>): string | null {
  const fullName = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
  const name = chat.title ?? (chat.username ? `@${chat.username}` : fullName);
  return name.trim().slice(0, MAX_NAME_LENGTH) || null;
}

function toChat(chat: z.infer<typeof chatSchema>): TelegramChat {
  return { id: String(chat.id), name: chatName(chat) };
}

export function parseStartCommands(raw: unknown): { commands: StartCommand[]; lastUpdateId: number | null } {
  const { result } = updatesSchema.parse(raw);
  const commands = result.flatMap(({ message }) => {
    const token = message?.text?.match(START)?.[1];
    return message && token ? [{ chat: toChat(message.chat), token }] : [];
  });
  const lastUpdateId = result.length ? Math.max(...result.map((update) => update.update_id)) : null;
  return { commands, lastUpdateId };
}
