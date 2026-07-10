import { FileText, Network } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export function ProfileMockup() {
  const skills = ["TypeScript", "Go", "Postgres", "Redis", "gRPC", "Kafka", "AWS", "Docker"];
  return (
    <div className="ln-lift overflow-hidden rounded-xl border border-hairline-strong bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background">
          AK
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">Ada Kramer</span>
            <span className="text-[13px] text-ink-subtle">· Berlin</span>
          </div>
          <div className="mt-0.5 text-[13px] text-ink-muted">
            Senior Backend Engineer · 6 yrs
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-ink-subtle">
            <span className="inline-flex items-center gap-1.5">
              <FaGithub className="size-3.5" /> github.com/adakramer
            </span>
          </div>
        </div>
        <span className="ln-mono rounded-full bg-primary/15 px-2.5 py-1 text-[11px] text-[#828fff]">
          parsed
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
        {skills.map((s) => (
          <span
            key={s}
            className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-ink-muted"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5">
        {(
          [
            [FileText, "12 skills"],
            [FaGithub, "5 projects"],
            [Network, "3 roles"],
          ] as [React.ComponentType<{ className?: string }>, string][]
        ).map(([Icon, label], i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2.5 text-[13px] text-ink-muted"
          >
            <Icon className="size-4 text-ink-subtle" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScorecardMockup() {
  const bars: [string, number, string][] = [
    ["Technical depth", 86, "#5e6ad2"],
    ["System design", 79, "#7a7fad"],
    ["Communication", 72, "#7a7fad"],
    ["Problem solving", 91, "#5e6ad2"],
  ];
  const score = 84;
  const circumference = 2 * Math.PI * 52;
  return (
    <div className="ln-lift grid grid-cols-1 gap-6 overflow-hidden rounded-xl border border-hairline-strong bg-card p-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="flex items-center gap-5">
        <div className="relative grid size-[132px] place-items-center">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[30px] font-semibold tracking-tight text-foreground">
              {score}
            </span>
            <span className="ln-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
              overall
            </span>
          </div>
        </div>
        <div className="sm:hidden">
          <div className="text-sm font-medium text-foreground">Strong hire signal</div>
          <div className="text-[13px] text-ink-subtle">Backend Engineer · Mid</div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-foreground">Strong hire signal</div>
          <div className="text-[13px] text-ink-subtle">Backend Engineer · Mid</div>
        </div>
        {bars.map(([label, val, color]) => (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-muted">{label}</span>
              <span className="ln-mono text-foreground">{val}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${val}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
