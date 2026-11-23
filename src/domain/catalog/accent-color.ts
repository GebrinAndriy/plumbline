export const DEFAULT_ACCENT = "#c2410c";
// The darkest page background the accent sits on as text; white is lighter, so it passes too.
export const PAGE_BACKGROUND = "#f6f3ee";
export const MIN_TEXT_CONTRAST = 4.5;

export const ACCENT_PRESETS = [
  { name: "Plumbline orange", hex: DEFAULT_ACCENT },
  { name: "Brick red", hex: "#b91c1c" },
  { name: "Raspberry", hex: "#be185d" },
  { name: "Violet", hex: "#7e22ce" },
  { name: "Indigo", hex: "#4338ca" },
  { name: "Royal blue", hex: "#1d4ed8" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Forest green", hex: "#15803d" },
  { name: "Slate", hex: "#334155" },
] as const;

export type AccentPalette = { accent: string; hover: string; soft: string };

const HEX = /^#[0-9a-f]{6}$/;

export function normalizeHex(text: string): string | null {
  const hex = text.trim().toLowerCase();
  return HEX.test(hex) ? hex : null;
}

function channels(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function toHex(values: number[]): string {
  return `#${values.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function mix(hex: string, target: string, amount: number): string {
  const from = channels(hex);
  const to = channels(target);
  return toHex(from.map((value, i) => value + (to[i] - value) * amount));
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export function accentContrast(hex: string): number {
  return contrastRatio(hex, PAGE_BACKGROUND);
}

export function isReadableAccent(hex: string): boolean {
  return accentContrast(hex) >= MIN_TEXT_CONTRAST;
}

// Keeps the hue and darkens in small steps, so a light brand colour becomes the closest readable one.
export function readableShade(hex: string): string {
  for (let step = 0; step <= 20; step++) {
    const shade = mix(hex, "#000000", step * 0.05);
    if (isReadableAccent(shade)) return shade;
  }
  return "#000000";
}

export function accentPalette(hex: string): AccentPalette {
  return { accent: hex, hover: mix(hex, "#000000", 0.2), soft: mix(hex, "#ffffff", 0.86) };
}
