import { describe, expect, it } from "vitest";
import { easeOutCubic, tween } from "./motion";

describe("easeOutCubic", () => {
  it("starts at 0, ends at 1 and decelerates", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(0.25)).toBeLessThan(easeOutCubic(0.5));
  });
});

describe("tween", () => {
  it("lands exactly on both ends", () => {
    expect(tween(150_000, 386_000, 0)).toBe(150_000);
    expect(tween(150_000, 386_000, 1)).toBe(386_000);
  });

  it("returns whole kopiykas in between, also when the price goes down", () => {
    const up = tween(0, 1_001, 0.3);
    const down = tween(386_000, 336_000, 0.3);
    expect(Number.isInteger(up)).toBe(true);
    expect(down).toBeLessThan(386_000);
    expect(down).toBeGreaterThan(336_000);
  });

  it("clamps progress outside 0..1", () => {
    expect(tween(10, 20, -1)).toBe(10);
    expect(tween(10, 20, 2)).toBe(20);
  });
});
