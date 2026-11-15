const TELEGRAM_API = "https://api.telegram.org";

export async function callTelegram(
  botToken: string,
  method: string,
  body: object,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  const response = await fetchImpl(`${TELEGRAM_API}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  // The URL holds the bot token, so it is kept out of the error.
  if (!response.ok) throw new Error(`Telegram ${method} failed with status ${response.status}`);
  return response.json();
}

// Plain text on purpose: no parse_mode, so customer input cannot inject markup.
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  await callTelegram(botToken, "sendMessage", { chat_id: chatId, text }, fetchImpl);
}
