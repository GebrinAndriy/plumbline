// Letters Unicode does not split into a base letter plus an accent.
const SPECIAL: Record<string, string> = { ß: "ss", æ: "ae", ø: "o", œ: "oe", đ: "d", ł: "l", þ: "th", ð: "d" };

const MAX_SLUG = 40;

export function toAscii(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[ßæøœđłþð]/g, (char) => SPECIAL[char])
    .replace(/['’]/g, "");
}

export function suggestSlug(businessName: string): string {
  return toAscii(businessName)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, MAX_SLUG)
    .replace(/-+$/, "");
}
