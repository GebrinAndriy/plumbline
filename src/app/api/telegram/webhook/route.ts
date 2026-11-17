import { matchesSecret } from "@/lib/auth/matches-secret";
import { botToken, connectChats, webhookSecret } from "@/lib/notifications/telegram-link-service";
import { parseStartUpdate } from "@/lib/notifications/telegram-updates";

export async function POST(request: Request) {
  if (!matchesSecret(request.headers.get("x-telegram-bot-api-secret-token"), webhookSecret())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = botToken();
  if (!token) return Response.json({ error: "Telegram is not configured" }, { status: 503 });

  const command = parseStartUpdate(await request.json().catch(() => null));
  // A non-2xx answer makes Telegram retry, so only a failed link is reported as an error.
  if (command) await connectChats(token, [command], new Date());
  return Response.json({ ok: true });
}
