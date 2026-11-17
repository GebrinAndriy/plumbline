import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

// Hashing gives equal lengths, so the comparison leaks neither the secret nor its length.
export function matchesSecret(received: string | null, expected: string | undefined): boolean {
  if (!expected || !received) return false;
  return timingSafeEqual(digest(received), digest(expected));
}
