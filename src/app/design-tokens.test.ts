import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DARK_PAGE_BACKGROUND,
  DEFAULT_ACCENT,
  PAGE_BACKGROUND,
  contrastRatio as contrast,
} from "@/domain/catalog/accent-color";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

function block(start: string): string {
  const from = css.indexOf(start);
  if (from < 0) throw new Error(`No "${start}" in globals.css`);
  return css.slice(from, css.indexOf("\n}", from));
}

function tokens(source: string): Record<string, string> {
  return Object.fromEntries([...source.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

const light = tokens(block("@theme {"));
const darkOnly = tokens(block("@media (prefers-color-scheme: dark) {\n  :root {"));
const dark = { ...light, ...darkOnly };

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme", (_name, t) => {
  const pages = [t.paper, t.surface, t.receipt, t.field];

  it("draws field borders at 3:1 or more on every background", () => {
    for (const background of [...pages, t.disabled]) {
      expect(contrast(t.control, background), background).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps body, secondary and accent text at 4.5:1 or more", () => {
    for (const background of pages) {
      expect(contrast(t.ink, background), background).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.muted, background), background).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.accent, background), background).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps button text readable on accent and error fills", () => {
    for (const fill of [t.accent, t["accent-hover"], t.error]) {
      expect(contrast(t["on-accent"], fill), fill).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps light text readable on dark bands", () => {
    expect(contrast(t["on-band"], t.band)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps status colours readable on their tints and on the page", () => {
    expect(contrast(t["accent-hover"], t["accent-soft"])).toBeGreaterThanOrEqual(4.5);
    for (const status of ["success", "error", "info", "quoted"]) {
      expect(contrast(t[status], t[`${status}-soft`]), status).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t[status], t.paper), status).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("design tokens", () => {
  it("defines every light colour again for dark mode", () => {
    expect(Object.keys(light).filter((name) => !(name in darkOnly))).toEqual([]);
  });

  it("matches the backgrounds the business accent is checked against", () => {
    expect(light.accent).toBe(DEFAULT_ACCENT);
    expect(light.paper).toBe(PAGE_BACKGROUND);
    expect(dark.paper).toBe(DARK_PAGE_BACKGROUND);
  });
});
