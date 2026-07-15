import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SkillCount, ScoreTrendPoint, TypeCount, WeeklyPracticePoint } from "./types";

const SKILL_LABEL: Record<string, string> = {
  react: "React",
  nodejs: "Node.js",
  "system-design": "System Design",
  "sql-databases": "SQL & Databases",
  javascript: "JavaScript",
  python: "Python",
  dsa: "DSA",
};

// CSS custom properties defined in app.css, validated for both chart surfaces
// with the dataviz skill's palette checker (fixed categorical order, never cycled).
const SKILL_COLOR: Record<string, string> = {
  react: "var(--skill-react)",
  nodejs: "var(--skill-nodejs)",
  "system-design": "var(--skill-system-design)",
  "sql-databases": "var(--skill-sql-databases)",
  javascript: "var(--skill-javascript)",
  python: "var(--skill-python)",
  dsa: "var(--skill-dsa)",
};
const BEHAVIORAL_COLOR = "var(--skill-behavioral)";

function skillLabel(skill: string | null): string {
  if (!skill) return "Behavioral";
  return SKILL_LABEL[skill] ?? skill.replace(/-/g, " ");
}

function skillColor(skill: string | null): string {
  if (!skill) return BEHAVIORAL_COLOR;
  return SKILL_COLOR[skill] ?? BEHAVIORAL_COLOR;
}

function formatWeekTick(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ChartTooltip({
  active,
  payload,
  label,
  valueSuffix = "",
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  valueSuffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm">
      <p className="text-ink-tertiary">{label}</p>
      <p className="mt-0.5 font-semibold text-foreground">
        {Math.round(payload[0]!.value)}
        {valueSuffix}
      </p>
    </div>
  );
}

function WeeklyPracticeChart({ data }: { data: WeeklyPracticePoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: formatWeekTick(d.weekStart) }));
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }}
          interval={1}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltip valueSuffix="m" />}
        />
        <Bar dataKey="minutes" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  const recent = data.slice(-12).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={recent} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis hide domain={[0, 100]} />
        <Tooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#scoreTrendFill)"
          dot={false}
          activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Part-to-whole across named skill identities reads better as direct-labeled
// horizontal bars than a donut (see dataviz skill: donuts mislead on close
// values). Each bar is both the mark and its own label — no legend needed.
function SkillDistributionBars({ skills }: { skills: SkillCount[] }) {
  const sorted = [...skills].filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...sorted.map((s) => s.count));

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((s) => {
        const key = s.skill ?? "behavioral";
        const pct = Math.max(6, Math.round((s.count / max) * 100));
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-ink-subtle">
              {skillLabel(s.skill)}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${pct}%`, background: skillColor(s.skill) }}
              />
            </div>
            <span className="ln-mono w-6 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
              {s.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TypeSplit({ types }: { types: TypeCount[] }) {
  const real = types.find((t) => t.type === "REAL")?.count ?? 0;
  const practice = types.find((t) => t.type === "PRACTICE")?.count ?? 0;
  const total = real + practice;
  if (total === 0) return null;
  const realPct = Math.round((real / total) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {real > 0 && (
          <div className="h-full bg-primary" style={{ width: `${realPct}%` }} />
        )}
        {practice > 0 && (
          <div className="h-full bg-[var(--skill-system-design)]" style={{ width: `${100 - realPct}%` }} />
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-ink-tertiary">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          Real ({real})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[var(--skill-system-design)]" />
          Practice ({practice})
        </span>
      </div>
    </div>
  );
}

export function PracticeSummary({
  weeklyPractice,
  scoreTrend,
  typeDistribution,
  skillDistribution,
}: {
  weeklyPractice: WeeklyPracticePoint[];
  scoreTrend: ScoreTrendPoint[];
  typeDistribution: TypeCount[];
  skillDistribution: SkillCount[];
}) {
  const hasWeekly = useMemo(() => weeklyPractice.some((w) => w.minutes > 0), [weeklyPractice]);
  const hasTrend = scoreTrend.length > 0;
  const hasSkills = skillDistribution.some((s) => s.count > 0);

  return (
    <div className="ln-lift ln-rise rounded-2xl border border-border bg-card p-5 sm:p-6">
      <span className="ln-eyebrow">Practice summary</span>
      <h3 className="mt-1 text-sm font-semibold text-foreground">
        Your activity at a glance
      </h3>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-ink-subtle">Weekly practice</p>
          {hasWeekly ? (
            <WeeklyPracticeChart data={weeklyPractice} />
          ) : (
            <p className="mt-8 text-center text-xs text-ink-tertiary">
              Practice a few sessions to see your weekly rhythm.
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-ink-subtle">Score trend</p>
          {hasTrend ? (
            <ScoreTrendChart data={scoreTrend} />
          ) : (
            <p className="mt-8 text-center text-xs text-ink-tertiary">
              Complete a scored interview to start your trend line.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-xs font-medium text-ink-subtle">Real vs practice</p>
        <div className="mt-3">
          <TypeSplit types={typeDistribution} />
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-xs font-medium text-ink-subtle">By skill</p>
        <div className="mt-3">
          {hasSkills ? (
            <SkillDistributionBars skills={skillDistribution} />
          ) : (
            <p className="text-xs text-ink-tertiary">
              Try a skill-specific practice session to build your breakdown.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PracticeSummarySkeleton() {
  return (
    <div className="ln-lift rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="skeleton-shimmer h-4 w-40 rounded bg-muted" />
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="skeleton-shimmer h-36 rounded-lg bg-muted" />
        <div className="skeleton-shimmer h-36 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
