import { describe, expect, it } from "vitest";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  DARK_PAGE_BACKGROUND,
  accentPalette,
  contrastRatio,
  darkAccentPalette,
  isReadableAccent,
  normalizeHex,
  readableShade,
} from "./accent-color";

describe("normalizeHex", () => {
  it("accepts six-digit hex in any case and rejects anything else", () => {
    expect(normalizeHex(" #1D4ED8 ")).toBe("#1d4ed8");
    expect(normalizeHex("#fff")).toBeNull();
    expect(normalizeHex("1d4ed8")).toBeNull();
    expect(normalizeHex("red")).toBeNull();
    expect(normalizeHex("#1d4ed8; color: red")).toBeNull();
  });
});

describe("contrastRatio", () => {
  it("matches the WCAG formula", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
});

describe("isReadableAccent", () => {
  it("accepts the default and dark brand colours", () => {
    expect(isReadableAccent(DEFAULT_ACCENT)).toBe(true);
    expect(isReadableAccent("#1d4ed8")).toBe(true);
    expect(isReadableAccent("#000000")).toBe(true);
  });

  it("accepts every preset offered to owners", () => {
    for (const preset of ACCENT_PRESETS) expect(isReadableAccent(preset.hex), preset.name).toBe(true);
  });

  it("rejects colours too light to read as text on the page", () => {
    expect(isReadableAccent("#facc15")).toBe(false);
    expect(isReadableAccent("#22c55e")).toBe(false);
    expect(isReadableAccent("#ffffff")).toBe(false);
  });
});

describe("readableShade", () => {
  it("leaves a readable colour as it is", () => {
    expect(readableShade("#1d4ed8")).toBe("#1d4ed8");
  });

  it("darkens a light colour until it is readable, keeping its hue", () => {
    const shade = readableShade("#facc15");
    expect(isReadableAccent(shade)).toBe(true);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(shade.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(b);
    expect(g).toBeGreaterThan(b);
  });

  it("finds a shade even for white", () => {
    expect(isReadableAccent(readableShade("#ffffff"))).toBe(true);
  });
});

describe("accentPalette", () => {
  it("derives a darker hover and a light tint from one colour", () => {
    const palette = accentPalette("#1d4ed8");
    expect(palette.accent).toBe("#1d4ed8");
    expect(contrastRatio(palette.hover, "#ffffff")).toBeGreaterThan(contrastRatio(palette.accent, "#ffffff"));
    expect(contrastRatio(palette.soft, "#ffffff")).toBeLessThan(1.3);
  });
});

describe("darkAccentPalette", () => {
  it("lightens dark brand colours until they read on the dark page", () => {
    for (const hex of ["#1d4ed8", "#000000", "#334155", ...ACCENT_PRESETS.map((preset) => preset.hex)]) {
      const { accent, hover } = darkAccentPalette(hex);
      expect(contrastRatio(accent, DARK_PAGE_BACKGROUND), hex).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(hover, DARK_PAGE_BACKGROUND), hex).toBeGreaterThan(contrastRatio(accent, DARK_PAGE_BACKGROUND));
    }
  });

  it("keeps a colour that already reads on the dark page and its hue", () => {
    expect(darkAccentPalette("#f08a4b").accent).toBe("#f08a4b");
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(darkAccentPalette("#1d4ed8").accent.slice(i, i + 2), 16));
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });
});
