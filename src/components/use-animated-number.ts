import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MOTION_MS, tween } from "@/lib/motion";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const usePrefersReducedMotion = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED_MOTION).matches, () => true);

// Counts from the previous value to the new one; jumps straight there when motion is reduced.
export function useAnimatedNumber(target: number, durationMs: number = MOTION_MS.slow): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (reduced || from === target) {
      current.current = target;
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      current.current = tween(from, target, (now - start) / durationMs);
      setValue(current.current);
      if (current.current !== target) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);

  return reduced ? target : value;
}
