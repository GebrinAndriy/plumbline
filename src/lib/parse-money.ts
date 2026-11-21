import type { Money } from "@/domain/pricing/types";

const MONEY_PATTERN = /^(\d{1,9})(?:[.,](\d{1,2}))?$/;
// A comma or space followed by exactly three digits groups thousands: "1,200" or "1 200".
const THOUSANDS = /[\s,](?=\d{3}(?:\D|$))/g;

// Parses euros as people type them ("450", "1,200.99", or "12,50" with a decimal comma), never through floats.
export function parseMoney(text: string): Money | null {
  const match = MONEY_PATTERN.exec(text.replace(THOUSANDS, "").replace(/\s/g, ""));
  if (!match) return null;
  const [, euros, cents = ""] = match;
  return Number(euros) * 100 + Number(cents.padEnd(2, "0"));
}
