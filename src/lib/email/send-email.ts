import "server-only";
import { sendWithResend, type EmailMessage } from "./resend";

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (apiKey && from) return sendWithResend(apiKey, from, message);

  // Never in production: the message holds a sign-in link, and server logs are not private.
  if (process.env.NODE_ENV === "production") {
    throw new Error("RESEND_API_KEY and EMAIL_FROM are required to send email");
  }
  console.info(`[email to ${message.to}] ${message.subject}\n${message.text}`);
}
