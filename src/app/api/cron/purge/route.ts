import { getRepositories } from "@/db/get-repositories";
import { purgeExpired } from "@/domain/maintenance/purge-expired";
import { isAuthorizedCron } from "@/lib/cron/cron-auth";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessions, telegramLinks, rateLimits } = getRepositories();
  const deleted = await purgeExpired({ sessions, telegramLinks, rateLimits }, new Date());
  return Response.json({ deleted });
}
