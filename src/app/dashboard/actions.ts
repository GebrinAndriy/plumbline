"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db/get-repositories";
import { changeLeadStatus } from "@/domain/leads/change-lead-status";
import { LEAD_STATUSES } from "@/domain/leads/lead-status";
import { requireOwner } from "@/lib/auth/current-owner";
import { telegramSettingsSchema } from "./telegram-settings-schema";

export type StatusFormState = { message?: string };

const statusChangeSchema = z.object({
  leadId: z.uuid(),
  from: z.enum(LEAD_STATUSES),
  to: z.enum(LEAD_STATUSES),
});

const MESSAGES = {
  forbidden: "This status change is not allowed",
  conflict: "This request was updated elsewhere, showing the latest status",
};

export async function changeLeadStatusAction(
  _previous: StatusFormState,
  formData: FormData,
): Promise<StatusFormState> {
  const { business } = await requireOwner();
  if (!business) return { message: "This account has no business" };

  const parsed = statusChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Invalid request" };

  const result = await changeLeadStatus(
    getRepositories().leads,
    { businessId: business.id, ...parsed.data },
    new Date(),
  );
  refresh();
  return result.ok ? {} : { message: MESSAGES[result.reason] };
}

export type TelegramFormState = { error?: string; saved?: boolean };

export async function saveTelegramChatAction(
  _previous: TelegramFormState,
  formData: FormData,
): Promise<TelegramFormState> {
  const { business } = await requireOwner();
  if (!business) return { error: "This account has no business" };

  const parsed = telegramSettingsSchema.safeParse({ chatId: formData.get("chatId") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await getRepositories().catalog.setTelegramChatId(business.id, parsed.data.chatId);
  refresh();
  return { saved: true };
}
