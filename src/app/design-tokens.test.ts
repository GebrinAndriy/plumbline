import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`No --color-${name} in globals.css`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const WHITE = "#ffffff";
const BACKGROUNDS = [WHITE, token("paper"), token("surface"), token("receipt"), token("disabled")];

describe("design tokens", () => {
  it("computes WCAG contrast", () => {
    expect(contrast("#000000", WHITE)).toBeCloseTo(21);
    expect(contrast(WHITE, WHITE)).toBe(1);
  });

  it("draws field borders at 3:1 or more on every background", () => {
    for (const background of BACKGROUNDS) {
      expect(contrast(token("control"), background)).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps body and secondary text at 4.5:1 or more on page backgrounds", () => {
    for (const background of [WHITE, token("paper"), token("surface")]) {
      expect(contrast(token("ink"), background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token("muted"), background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
