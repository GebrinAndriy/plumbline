"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { primaryButtonClass } from "@/components/primary-button";
import { checkTelegramLinkAction, startTelegramLinkAction } from "./telegram-actions";

type State =
  | { step: "idle"; error?: string }
  | { step: "waiting"; link: string; qrCode: string }
  | { step: "expired" };

const POLL_MS = 3000;

export function ConnectTelegram({ connected }: { connected: boolean }) {
  const [state, setState] = useState<State>({ step: "idle" });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function start() {
    startTransition(async () => {
      const result = await startTelegramLinkAction();
      setState(result.ok ? { step: "waiting", ...result } : { step: "idle", error: result.error });
    });
  }

  useEffect(() => {
    if (state.step !== "waiting") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const status = await checkTelegramLinkAction().catch(() => "waiting" as const);
      if (cancelled) return;
      if (status === "connected") {
        setState({ step: "idle" });
        router.refresh();
      } else if (status === "expired") {
        setState({ step: "expired" });
      } else {
        timer = setTimeout(poll, POLL_MS);
      }
    }

    timer = setTimeout(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state.step, router]);

  if (state.step === "waiting") {
    return (
      <div className="flex flex-col gap-4">
        <Image
          src={state.qrCode}
          alt="QR code that opens our Telegram bot"
          width={160}
          height={160}
          unoptimized
          // White in both themes: phone cameras read dark modules on a light quiet zone.
          className="rounded-field border border-rule bg-white p-2"
        />
        <div className="flex max-w-xs flex-col gap-3 text-sm">
          <p className="text-muted">
            Scan the code with your phone or open the link, then press <strong>Start</strong> in the bot.
          </p>
          <a
            href={state.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`self-start ${primaryButtonClass}`}
          >
            Open Telegram
          </a>
          <p role="status" className="text-muted">
            Waiting for Telegram…
          </p>
          <button
            type="button"
            onClick={() => setState({ step: "idle" })}
            className="self-start font-medium underline underline-offset-4"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {state.step === "expired" && (
        <p className="text-sm text-muted">The link expired. Get a new one.</p>
      )}
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className={connected ? "tap-target self-start text-sm font-medium underline underline-offset-4 disabled:opacity-50" : `self-start ${primaryButtonClass} text-sm`}
      >
        {pending ? "Preparing…" : connected ? "Connect another chat" : "Connect Telegram"}
      </button>
      {state.step === "idle" && state.error && (
        <p role="alert" className="animate-shake text-sm text-error">
          {state.error}
        </p>
      )}
    </div>
  );
}
