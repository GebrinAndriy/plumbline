import { ConnectTelegram } from "./connect-telegram";
import { disconnectTelegramAction } from "./telegram-actions";

export function TelegramSettings({ chatId }: { chatId: string | null }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">Telegram notifications</h2>
      {chatId ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-green-700 dark:text-green-400">Connected. New requests arrive in Telegram.</p>
          <form action={disconnectTelegramAction}>
            <button type="submit" className="font-medium underline underline-offset-4">
              Turn off
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Get every new request in Telegram.</p>
      )}
      <ConnectTelegram connected={chatId !== null} />
    </section>
  );
}
