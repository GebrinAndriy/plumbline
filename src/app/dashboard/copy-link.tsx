"use client";

import { useState } from "react";

const RESET_MS = 2000;

export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
      setCopied(true);
      setTimeout(() => setCopied(false), RESET_MS);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions); the link stays visible to copy by hand.
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="tap-target rounded-field border border-ink px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface"
    >
      <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}
