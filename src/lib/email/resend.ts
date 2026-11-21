export type EmailMessage = { to: string; subject: string; text: string };

const RESEND_API = "https://api.resend.com/emails";

export async function sendWithResend(
  apiKey: string,
  from: string,
  message: EmailMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(RESEND_API, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Resend failed with status ${response.status}`);
}
