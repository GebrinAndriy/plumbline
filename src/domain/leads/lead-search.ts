export type LeadSearch = { text: string; phoneDigits: string | null };

const PHONE_LIKE = /^[\d\s()+\-.]+$/;
const MIN_PHONE_DIGITS = 3;

export function parseLeadSearch(raw: string): LeadSearch | undefined {
  const text = raw.trim().replace(/\s+/g, " ");
  if (text === "") return undefined;
  // Phones are stored as +353…, so the national 0 or an international 00 would never match.
  const digits = text.replace(/\D/g, "").replace(/^0+/, "");
  const phoneDigits = PHONE_LIKE.test(text) && digits.length >= MIN_PHONE_DIGITS ? digits : null;
  return { text, phoneDigits };
}
