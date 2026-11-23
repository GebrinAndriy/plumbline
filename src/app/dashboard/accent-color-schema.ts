import { z } from "zod";
import { DEFAULT_ACCENT, MIN_TEXT_CONTRAST, accentContrast, normalizeHex } from "@/domain/catalog/accent-color";

const accentColor = z
  .string()
  .optional()
  .transform((text, ctx) => {
    if (!text?.trim()) return null;
    const hex = normalizeHex(text);
    if (!hex) {
      ctx.addIssue({ code: "custom", message: "Enter a colour like #1d4ed8" });
      return z.NEVER;
    }
    const contrast = accentContrast(hex);
    if (contrast < MIN_TEXT_CONTRAST) {
      ctx.addIssue({ code: "custom", message: `Too light to read on your page: ${contrast.toFixed(1)}:1, needs ${MIN_TEXT_CONTRAST}:1` });
      return z.NEVER;
    }
    return hex === DEFAULT_ACCENT ? null : hex;
  });

export const accentColorFormSchema = z.object({ accentColor }).transform(({ accentColor }) => accentColor);
