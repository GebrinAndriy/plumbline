import { z } from "zod";

const DECIMAL_PATTERN = /^\d{1,9}(?:[.,]\d{1,6})?$/;

// Number() also accepts "0x10", "1e3", "Infinity" and reads "" as 0; people type only digits and a separator.
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim();
  return DECIMAL_PATTERN.test(trimmed) ? Number(trimmed.replace(",", ".")) : null;
}

export const decimalInput = (message = "Enter a number") =>
  z.string({ error: message }).transform((text, ctx) => {
    const value = parseDecimal(text);
    if (value === null) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return value;
  });
