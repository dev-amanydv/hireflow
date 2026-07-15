import type { LucideIcon } from "lucide-react";
import { Award, Clock, Flame, ListChecks, Target } from "lucide-react";
import { useCountUp } from "./useCountUp";
import type { ProfileStats } from "./types";

function formatMinutes(total: number): string {
  if (total <= 0) return "0m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function StatCard({
  icon: Icon,
  accent,
  label,
  value,
  suffix = "",
  decimals = 0,
  description,
}: {
  icon: LucideIcon;
  accent: string;
  label: string;
  value: number | null;
  suffix?: string;
  decimals?: number;
  description: string;
}) {
  const animated = useCountUp(value);
  return (
    <div
      style={{ ["--accent" as string]: accent }}
      className="ln-lift ln-rise rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-0.5"
    >
      <span
        className="flex size-9 items-center justify-center rounded-lg text-[var(--accent)] ring-1 ring-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
        style={{ background: "color-mix(in oklab, var(--accent) 13%, var(--card))" }}
      >
        <Icon className="size-4" />
      </span>
      <p className="ln-eyebrow mt-4">{label}</p>
      <p className="ln-mono mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value == null ? "—" : `${animated.toFixed(decimals)}${suffix}`}
      </p>
      <p className="mt-1 text-xs text-ink-tertiary">{description}</p>
    </div>
  );
}

function MinutesCard({ accent, minutes }: { accent: string; minutes: number }) {
  const animated = useCountUp(minutes);
  return (
    <div
      style={{ ["--accent" as string]: accent }}
      className="ln-lift ln-rise rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-0.5"
    >
      <span
        className="flex size-9 items-center justify-center rounded-lg text-[var(--accent)] ring-1 ring-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
        style={{ background: "color-mix(in oklab, var(--accent) 13%, var(--card))" }}
      >
        <Clock className="size-4" />
      </span>
      <p className="ln-eyebrow mt-4">Minutes Practiced</p>
      <p className="ln-mono mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {formatMinutes(Math.round(animated))}
      </p>
      <p className="mt-1 text-xs text-ink-tertiary">Total time in the seat</p>
    </div>
  );
}

export function PerformancePanel({ stats }: { stats: ProfileStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        icon={ListChecks}
        accent="oklch(0.68 0.13 220)"
        label="Interviews Taken"
        value={stats.totalInterviews}
        description="Across practice and real sessions"
      />
      <MinutesCard accent="oklch(0.64 0.14 150)" minutes={stats.minutesPracticed} />
      <StatCard
        icon={Target}
        accent="oklch(0.72 0.12 70)"
        label="Average Score"
        value={stats.avgScore}
        decimals={0}
        description="Mean across scored interviews"
      />
      <StatCard
        icon={Award}
        accent="oklch(0.66 0.12 195)"
        label="Best Score"
        value={stats.bestScore}
        decimals={0}
        description="Your personal record"
      />
      <StatCard
        icon={Flame}
        accent="oklch(0.65 0.15 12)"
        label="Practice Streak"
        value={stats.currentStreak}
        suffix={stats.currentStreak === 1 ? " day" : " days"}
        description="Consecutive days practiced"
      />
    </div>
  );
}

export function PerformancePanelSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="ln-lift rounded-2xl border border-border bg-card p-5">
          <div className="skeleton-shimmer size-9 rounded-lg bg-muted" />
          <div className="skeleton-shimmer mt-4 h-3 w-20 rounded bg-muted" />
          <div className="skeleton-shimmer mt-2 h-7 w-16 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
