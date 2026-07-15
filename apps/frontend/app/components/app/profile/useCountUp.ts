import { useEffect, useRef, useState } from "react";

const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animates a number from 0 (or its previous value) up to `value` over `durationMs`.
 * Mirrors the rAF + prefers-reduced-motion approach used by ScoreBar
 * (app/components/ui/score-bar.tsx) so counters feel consistent across the app.
 */
export function useCountUp(value: number | null, durationMs = 900): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (value == null || Number.isNaN(value)) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;

    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setDisplay(from + delta * EASE_OUT_CUBIC(progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return display;
}
