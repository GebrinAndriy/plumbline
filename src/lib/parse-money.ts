import type { Money } from "@/domain/pricing/types";

const MONEY_PATTERN = /^(\d{1,9})(?:[.,](\d{1,2}))?$/;

// Parses hryvnias typed by a person ("450", "450.5", "1 200,99") without going through floats.
export function parseMoney(text: string): Money | null {
  const match = MONEY_PATTERN.exec(text.replace(/\s/g, ""));
  if (!match) return null;
  const [, hryvnias, kopiykas = ""] = match;
  return Number(hryvnias) * 100 + Number(kopiykas.padEnd(2, "0"));
}
