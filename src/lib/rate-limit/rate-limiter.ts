import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getRepositories } from "@/db/get-repositories";
import { consumeRateLimit, type RateLimitPolicy, type RateLimitResult } from "@/domain/rate-limit/rate-limit";
import { clientIpFrom } from "./client-ip";

// Subjects are hashed so the table does not keep raw IPs or every email someone tried.
const hashSubject = (subject: string) => createHash("sha256").update(subject).digest("hex");

export async function limitBySubject(policy: RateLimitPolicy, subject: string): Promise<RateLimitResult> {
  return consumeRateLimit(getRepositories().rateLimits, policy, hashSubject(subject), new Date());
}

export async function limitByIp(policy: RateLimitPolicy): Promise<RateLimitResult> {
  return limitBySubject(policy, clientIpFrom(await headers()));
}
