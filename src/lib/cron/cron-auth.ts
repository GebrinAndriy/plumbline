import { matchesSecret } from "@/lib/auth/matches-secret";

export function isAuthorizedCron(authorization: string | null, secret: string | undefined): boolean {
  return matchesSecret(authorization, secret ? `Bearer ${secret}` : undefined);
}
