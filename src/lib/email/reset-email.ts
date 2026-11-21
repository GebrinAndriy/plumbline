import { RESET_TTL_MS } from "@/domain/auth/password-reset";
import type { EmailMessage } from "./resend";

export function resetEmail(to: string, link: string): EmailMessage {
  return {
    to,
    subject: "Reset your QuoteFlow password",
    text: [
      "Someone asked to reset the password of your QuoteFlow account.",
      `Set a new password here (the link works once, for ${RESET_TTL_MS / 60_000} minutes):`,
      link,
      "If it was not you, ignore this email: your password stays the same.",
    ].join("\n\n"),
  };
}
