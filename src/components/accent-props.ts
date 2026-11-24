import type { CSSProperties } from "react";
import { accentPalette, darkAccentPalette } from "@/domain/catalog/accent-color";

// The .brand-accent rule in globals.css picks the light or dark set, so every bg-accent inside follows.
export function accentProps(color: string | null): { className?: string; style?: CSSProperties } {
  if (!color) return {};
  const light = accentPalette(color);
  const dark = darkAccentPalette(color);
  return {
    className: "brand-accent",
    style: {
      "--brand-accent": light.accent,
      "--brand-accent-hover": light.hover,
      "--brand-accent-soft": light.soft,
      "--brand-accent-dark": dark.accent,
      "--brand-accent-dark-hover": dark.hover,
      "--brand-accent-dark-soft": dark.soft,
    } as CSSProperties,
  };
}
