import { ConnectTelegram } from "./connect-telegram";
import { disconnectTelegramAction } from "./telegram-actions";

type Props = { chatId: string | null; chatName: string | null };

export function TelegramSettings({ chatId, chatName }: Props) {
  return (
    <section aria-labelledby="telegram-title" className="flex flex-col gap-4 rounded-card border border-rule bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="telegram-title" className="font-serif text-xl font-medium">
          Telegram
        </h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${chatId ? "bg-success-soft text-success" : "bg-disabled text-disabled-text"}`}
        >
          {chatId ? "On" : "Off"}
        </span>
      </div>
      {chatId ? (
        <div className="flex flex-col gap-2 text-sm">
          <p>
            New requests arrive in {chatName ? <strong>{chatName}</strong> : "your chat"} the moment they are sent.
          </p>
          <form action={disconnectTelegramAction}>
            <button type="submit" className="tap-target font-medium text-muted underline underline-offset-4 hover:text-error">
              Turn off
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted">Get a message with the name, phone and price for every new request.</p>
      )}
      <ConnectTelegram connected={chatId !== null} />
    </section>
  );
}
