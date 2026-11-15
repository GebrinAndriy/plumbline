"use client";

import { Field } from "@/components/field";
import { useFormSubmit } from "@/components/use-form-submit";
import { saveTelegramChatAction, type TelegramFormState } from "./actions";

export function TelegramSettings({ chatId }: { chatId: string | null }) {
  const { state, onSubmit, pending } = useFormSubmit<TelegramFormState>(saveTelegramChatAction, {});

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">Telegram notifications</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Get every new request in Telegram. Start a chat with our bot, then paste your chat ID here.
        Leave it empty to turn notifications off.
      </p>
      <form method="post" onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <Field
          label="Chat ID"
          name="chatId"
          inputMode="numeric"
          defaultValue={chatId ?? ""}
          placeholder="123456789"
          error={state.error}
          className="min-w-48 flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      {state.saved && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Saved
        </p>
      )}
    </section>
  );
}
