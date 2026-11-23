import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_ACCENT, PAGE_BACKGROUND, contrastRatio as contrast } from "@/domain/catalog/accent-color";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`No --color-${name} in globals.css`);
  return match[1];
}

const WHITE = "#ffffff";
const BACKGROUNDS = [WHITE, token("paper"), token("surface"), token("receipt"), token("disabled")];

describe("design tokens", () => {
  it("matches the defaults the business accent is checked against", () => {
    expect(token("accent")).toBe(DEFAULT_ACCENT);
    expect(token("paper")).toBe(PAGE_BACKGROUND);
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
