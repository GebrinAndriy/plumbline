import type { CSSProperties } from "react";
import { accentPalette } from "@/domain/catalog/accent-color";

// Overrides the accent tokens for one subtree; every bg-accent and text-accent inside follows.
export function accentStyle(color: string | null): CSSProperties | undefined {
  if (!color) return undefined;
  const { accent, hover, soft } = accentPalette(color);
  return { "--color-accent": accent, "--color-accent-hover": hover, "--color-accent-soft": soft } as CSSProperties;
}
