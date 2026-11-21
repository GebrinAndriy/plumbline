export const MOTION_MS = { quick: 150, standard: 240, slow: 400 } as const;

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

// Money is in cents, so every frame of an animated price stays a whole number.
export function tween(from: number, to: number, progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.round(from + (to - from) * easeOutCubic(clamped));
}
