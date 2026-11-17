import { ConnectTelegram } from "./connect-telegram";
import { disconnectTelegramAction } from "./telegram-actions";

type Props = { chatId: string | null; chatName: string | null };

export function TelegramSettings({ chatId, chatName }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-rule p-4">
      <h2 className="font-serif text-lg font-semibold">Telegram notifications</h2>
      {chatId ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-success">
            Connected{chatName && <> to <strong>{chatName}</strong></>}. New requests arrive in Telegram.
          </p>
          <form action={disconnectTelegramAction}>
            <button type="submit" className="font-medium underline underline-offset-4">
              Turn off
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted">Get every new request in Telegram.</p>
      )}
      <ConnectTelegram connected={chatId !== null} />
    </section>
  );
}
