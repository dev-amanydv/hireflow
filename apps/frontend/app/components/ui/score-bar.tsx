import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

/**
 * A refined, self-contained score meter. The fill grows from 0 → value once on
 * mount to convey the score, and collapses to an instant paint under
 * prefers-reduced-motion. `tone` colors the fill; default derives from the value.
 */
export function ScoreBar({
  value,
  tone,
  className,
  height = "h-1.5",
}: {
  value: number;
  tone?: string;
  className?: string;
  height?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-foreground/10",
        height,
        className,
      )}
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          tone ?? toneFill(clamped),
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function toneFill(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}
