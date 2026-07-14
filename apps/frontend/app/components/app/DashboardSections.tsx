import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BarChart3,
  Binary,
  Blocks,
  Braces,
  Briefcase,
  Clock,
  Database,
  Dumbbell,
  ExternalLink,
  Hexagon,
  ListChecks,
  Loader2,
  MapPin,
  MessagesSquare,
  Mic,
  Network,
  Search,
  Settings,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import EmptyState from "./EmptyState";
import ResumeAnalyzer from "./resume-analyzer/ResumeAnalyzer";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { useAuth } from "~/store/store";
import { useStartInterview } from "~/lib/useStartInterview";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";

type Difficulty = "beginner" | "junior" | "mid" | "senior" | "staff";

const PRACTICE_LEVELS: {
  value: Difficulty;
  label: string;
  note: string;
  desc: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    note: "0 yrs",
    desc: "Fundamentals and first principles",
  },
  {
    value: "junior",
    label: "Junior",
    note: "0–2 yrs",
    desc: "Core concepts and everyday patterns",
  },
  {
    value: "mid",
    label: "Mid",
    note: "2–5 yrs",
    desc: "Trade-offs and deliberate decisions",
  },
  {
    value: "senior",
    label: "Senior",
    note: "5–9 yrs",
    desc: "Internals, depth, and system thinking",
  },
  {
    value: "staff",
    label: "Staff",
    note: "10+ yrs",
    desc: "Architecture and ambiguous problems",
  },
];

// Per-skill identity: a distinct icon + a cohesive jewel-tone accent so the grid
// reads as a considered set rather than eight identical tiles. Accents are
// mid-lightness, restrained-chroma oklch — variety without breaking the theme.
const SKILL_META: Record<string, { icon: LucideIcon; accent: string }> = {
  react: { icon: Atom, accent: "oklch(0.68 0.13 220)" },
  nodejs: { icon: Hexagon, accent: "oklch(0.64 0.14 150)" },
  "distributed-systems": { icon: Network, accent: "oklch(0.62 0.15 285)" },
  "system-design": { icon: Blocks, accent: "oklch(0.72 0.12 70)" },
  "sql-databases": { icon: Database, accent: "oklch(0.66 0.12 195)" },
  javascript: { icon: Braces, accent: "oklch(0.74 0.13 95)" },
  python: { icon: Terminal, accent: "oklch(0.62 0.14 255)" },
  dsa: { icon: Binary, accent: "oklch(0.65 0.15 12)" },
};

const skillMeta = (id: string) =>
  SKILL_META[id] ?? { icon: Dumbbell, accent: "var(--primary)" };

const LEVEL_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff",
};

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="ln-eyebrow">{eyebrow}</span>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="ln-display-md text-foreground text-balance">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-subtle">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

function StartInterviewHero() {
  const startInterview = useStartInterview();
  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-border">
      <img
        src="/cta-light-start-interview.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 size-full object-cover object-right dark:hidden"
      />
      <img
        src="/cta-dark-start-interview.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 hidden size-full object-cover object-right dark:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-transparent"
      />

      <div className="absolute right-4 top-4 hidden items-center gap-2.5 rounded-lg border border-border bg-card/80 px-3 py-2 shadow-sm backdrop-blur-sm lg:flex">
        <span className="flex size-7 items-center justify-center rounded-md bg-muted text-foreground">
          <TrendingUp className="size-4" />
        </span>
        <span className="leading-tight">
          <span className="block text-xs font-semibold text-foreground">
            Track progress
          </span>
          <span className="block text-[11px] text-ink-tertiary">
            and improve
          </span>
        </span>
      </div>

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:p-6">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold leading-tight tracking-tight text-foreground text-balance sm:text-2xl">
              Practice smart.
              <br />
              Interview with <span className="text-primary">confidence.</span>
            </h2>
            <p className="max-w-md text-xs leading-relaxed text-ink-subtle sm:text-sm">
              Realistic interviews. Instant feedback.
              <br />
              Better you, one interview at a time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startInterview}
          className="group inline-flex w-fit shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-brand-hover sm:self-end sm:text-sm"
        >
          Start New Interview
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

function StatStrip({
  stats,
}: {
  stats: { label: string; value: string; hint: string }[];
}) {
  return (
    <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((s) => (
        <div key={s.label} className="px-5 py-4">
          <p className="text-xs text-ink-tertiary">{s.label}</p>
          <p className="ln-mono mt-1.5 text-2xl font-semibold tabular-nums text-foreground">
            {s.value}
          </p>
          <p className="mt-0.5 text-xs text-ink-tertiary">{s.hint}</p>
        </div>
      ))}
    </div>
  );
}

export function Overview() {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Workspace"
        title="Welcome back"
        description="Your interview activity at a glance. Start a session and your progress builds up here."
      />

      <StartInterviewHero />

      <StatStrip
        stats={[
          { label: "Interviews", value: "0", hint: "No sessions yet" },
          { label: "Best score", value: "—", hint: "Awaiting first result" },
          { label: "Avg. score", value: "—", hint: "Awaiting first result" },
        ]}
      />

      <EmptyState
        icon={Sparkles}
        title="No activity yet"
        description="Once you complete a session, your interview history, transcripts, and scores collect here so you can track how you improve over time."
      />
    </div>
  );
}

type PracticeSkill = { id: string; label: string; blurb: string };
type SkillTopic = { name: string; subtopics: string[] };
type SkillDetail = PracticeSkill & {
  topics: SkillTopic[];
  levelRubric: Record<Difficulty, string>;
};

function SkillCard({ skill, index }: { skill: PracticeSkill; index: number }) {
  const { icon: Icon, accent } = skillMeta(skill.id);
  return (
    <Link
      to={`/dashboard/practice/${skill.id}`}
      style={{
        ["--accent" as string]: accent,
        animationDelay: `${Math.min(index, 8) * 45}ms`,
      }}
      className={cn(
        "ln-lift ln-rise group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 text-left",
        "transition-[transform,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border))]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--accent)_55%,transparent)]",
        "active:translate-y-0 active:scale-[0.99]",
      )}
    >
      {/* Accent wash — atmosphere that only surfaces on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 ease-out group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--accent) 45%, transparent), transparent 70%)",
        }}
      />

      <span
        className="flex size-11 items-center justify-center rounded-xl text-[var(--accent)] ring-1 ring-[color-mix(in_oklab,var(--accent)_22%,transparent)] transition-transform duration-200 ease-out group-hover:scale-[1.06]"
        style={{
          background: "color-mix(in oklab, var(--accent) 13%, var(--card))",
        }}
      >
        <Icon className="size-5" />
      </span>

      <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">
        {skill.label}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-subtle">
        {skill.blurb}
      </p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-tertiary transition-colors duration-200 group-hover:text-[var(--accent)]">
        View details
        <ArrowRight className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

// Shared level picker — reads its accent from a `--accent` var on any ancestor.
function DifficultySelector({
  level,
  onLevel,
}: {
  level: Difficulty;
  onLevel: (v: Difficulty) => void;
}) {
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      {PRACTICE_LEVELS.map((l) => {
        const on = level === l.value;
        return (
          <button
            key={l.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onLevel(l.value)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left",
              "transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.99]",
              on
                ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_9%,transparent)]"
                : "border-border hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border))] hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
                on ? "border-[var(--accent)]" : "border-input",
              )}
            >
              {on && (
                <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {l.label}
                </span>
                <span className="ln-mono text-[11px] text-ink-tertiary">
                  {l.note}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-xs text-ink-subtle">
                {l.desc}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SkillCardSkeleton() {
  return (
    <div className="ln-lift rounded-2xl border border-border bg-card p-5">
      <div className="skeleton-shimmer size-11 rounded-xl bg-muted" />
      <div className="skeleton-shimmer mt-4 h-4 w-24 rounded bg-muted" />
      <div className="skeleton-shimmer mt-2.5 h-3 w-full rounded bg-muted" />
      <div className="skeleton-shimmer mt-1.5 h-3 w-2/3 rounded bg-muted" />
      <div className="skeleton-shimmer mt-4 h-3 w-20 rounded bg-muted" />
    </div>
  );
}

export function Practice() {
  const [skills, setSkills] = useState<PracticeSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/interview/practice/skills`, {
        withCredentials: true,
      })
      .then((res) => {
        if (!cancelled) setSkills(res.data?.data?.skills ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Practice"
        title="Skill practice interviews"
        description="Choose a skill to see what gets covered, pick your level, and our AI interviewer runs a mock interview focused purely on it. No resume needed."
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkillCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Dumbbell}
          title="Couldn't load skills"
          description="Something went wrong fetching practice skills. Please try again in a moment."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill, i) => (
            <SkillCard key={skill.id} skill={skill} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function PracticeDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className="ln-lift rounded-2xl border border-border bg-card p-6">
          <div className="skeleton-shimmer size-14 rounded-2xl bg-muted" />
          <div className="skeleton-shimmer mt-4 h-6 w-48 rounded bg-muted" />
          <div className="skeleton-shimmer mt-3 h-3 w-full max-w-md rounded bg-muted" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="ln-lift rounded-2xl border border-border bg-card p-5"
            >
              <div className="skeleton-shimmer h-4 w-32 rounded bg-muted" />
              <div className="skeleton-shimmer mt-3 h-3 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="ln-lift h-fit rounded-2xl border border-border bg-card p-5">
        <div className="skeleton-shimmer h-3 w-20 rounded bg-muted" />
        <div className="skeleton-shimmer mt-4 h-40 w-full rounded-xl bg-muted" />
        <div className="skeleton-shimmer mt-4 h-11 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function PracticeSkillDetail() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [level, setLevel] = useState<Difficulty>("mid");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!skillId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    axios
      .get(`${BACKEND_URL}/interview/practice/skills/${skillId}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (!cancelled) setSkill(res.data?.data?.skill ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  const startPractice = async () => {
    if (!skill || starting) return;
    setStarting(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/interview/practice`,
        { skill: skill.id, experience: level },
        { withCredentials: true },
      );
      const id = res.data?.data?.interview?.id;
      if (!id) throw new Error("missing interview id");
      navigate(`/interview/${id}?tab=lobby`);
    } catch {
      toast.error("Couldn't start the practice interview. Please try again.");
      setStarting(false);
    }
  };

  const backLink = (
    <Link
      to="/dashboard/practice"
      className="inline-flex w-fit items-center gap-1.5 text-sm text-ink-subtle transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      All skills
    </Link>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <PracticeDetailSkeleton />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <EmptyState
          icon={Dumbbell}
          title="Skill not found"
          description="We couldn't load this practice skill. It may have moved — head back and pick another."
          action={
            <Button variant="outline" onClick={() => navigate("/dashboard/practice")}>
              Back to skills
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      </div>
    );
  }

  const { icon: Icon, accent } = skillMeta(skill.id);
  const activeLevel = PRACTICE_LEVELS.find((l) => l.value === level);

  return (
    <div
      className="flex flex-col gap-6"
      style={{ ["--accent" as string]: accent }}
    >
      {backLink}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {/* Left: hero + topics + how it works */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="ln-lift ln-rise relative overflow-hidden rounded-2xl border border-border bg-card p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full opacity-70 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--accent) 30%, transparent), transparent 70%)",
              }}
            />
            <div className="relative flex items-start gap-4">
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-[var(--accent)] ring-1 ring-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
                style={{
                  background:
                    "color-mix(in oklab, var(--accent) 14%, var(--card))",
                }}
              >
                <Icon className="size-6" />
              </span>
              <div className="min-w-0">
                <span className="ln-eyebrow">Practice interview</span>
                <h1 className="ln-display-md mt-1 text-foreground">
                  {skill.label}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-subtle">
                  {skill.blurb}
                </p>
              </div>
            </div>

            <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <Mic className="size-3.5" />
                Voice interview
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                ~15 minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessagesSquare className="size-3.5" />
                No resume needed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="size-3.5" />
                Instant feedback
              </span>
            </div>
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ListChecks className="size-4 text-ink-tertiary" />
              <h2 className="text-sm font-semibold text-foreground">
                What you'll be asked
              </h2>
              <span className="ln-mono text-xs text-ink-tertiary">
                {skill.topics.length} areas
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {skill.topics.map((topic, i) => (
                <div
                  key={topic.name}
                  className="ln-lift ln-rise flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                    />
                    <h3 className="text-sm font-semibold text-foreground">
                      {topic.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-3.5">
                    {topic.subtopics.map((sub) => (
                      <span
                        key={sub}
                        className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-ink-subtle"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ln-lift rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              How it works
            </h2>
            <ol className="mt-3 flex flex-col gap-3">
              {[
                "Pick a difficulty that matches the level you're targeting.",
                "Talk through questions out loud with the AI interviewer — just like the real thing.",
                "Get an instant scored breakdown with strengths and what to work on.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="ln-mono flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-ink-subtle">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-ink-subtle">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Right: sticky launch panel */}
        <div className="ln-lift ln-rise h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-[4.5rem]">
          <span className="ln-eyebrow">Choose difficulty</span>
          <p className="mt-1 text-xs text-ink-subtle">
            Sets how deep the interviewer probes.
          </p>

          <div className="mt-4">
            <DifficultySelector level={level} onLevel={setLevel} />
          </div>

          {activeLevel && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3.5">
              <Target className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
              <div>
                <p className="text-xs font-medium text-foreground">
                  What good looks like at {activeLevel.label} level
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-subtle">
                  {skill.levelRubric[level]}
                </p>
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="mt-5 w-full gap-2 transition-transform duration-150 ease-out active:scale-[0.98]"
            disabled={starting}
            onClick={startPractice}
          >
            {starting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                Start practice interview
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <p className="mt-2.5 text-center text-[11px] text-ink-tertiary">
            Your mic turns on in the next step.
          </p>
        </div>
      </div>
    </div>
  );
}

type PastInterview = {
  id: string;
  type: "REAL" | "PRACTICE";
  skill: string | null;
  jobRole: string;
  experience: Difficulty;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED";
  createdAt: string;
  score: number | null;
};

function InterviewRow({ interview }: { interview: PastInterview }) {
  const date = new Date(interview.createdAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  return (
    <Link
      to={`/result?interviewId=${interview.id}`}
      className="ln-lift group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-ink-subtle group-hover:text-foreground">
        {interview.type === "PRACTICE" ? (
          <Dumbbell className="size-4" />
        ) : (
          <MessagesSquare className="size-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {interview.jobRole}
          </h3>
          <Badge
            variant={interview.type === "PRACTICE" ? "secondary" : "outline"}
          >
            {interview.type === "PRACTICE" ? "Practice" : "Interview"}
          </Badge>
        </div>
        <p className="truncate text-xs text-ink-tertiary">
          {LEVEL_LABEL[interview.experience]}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {interview.score != null ? (
          <p className="ln-mono text-lg font-semibold tabular-nums text-foreground">
            {Math.round(interview.score)}
          </p>
        ) : (
          <p className="text-xs text-ink-tertiary">
            {interview.status === "COMPLETED" ? "Scoring…" : "No score"}
          </p>
        )}
      </div>
      <ArrowRight className="size-4 shrink-0 text-ink-tertiary transition-colors group-hover:text-primary" />
    </Link>
  );
}

export function Interviews() {
  const startInterview = useStartInterview();
  const [interviews, setInterviews] = useState<PastInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/interview/list`, { withCredentials: true })
      .then((res) => {
        if (!cancelled) setInterviews(res.data?.data?.interviews ?? []);
      })
      .catch(() => {
        if (!cancelled) setInterviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="History"
        title="Past interviews"
        description="Every completed session, its transcript, and its score — all in one place."
        action={
          <Button onClick={startInterview}>
            <Sparkles className="size-4" />
            Start new interview
          </Button>
        }
      />
      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-20 text-sm text-ink-subtle">
          <Loader2 className="size-4 animate-spin" />
          Loading interviews…
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No interviews yet"
          description="Once you complete an interview, it lands here with the full transcript and a detailed breakdown you can revisit anytime."
          action={
            <Button variant="outline" onClick={startInterview}>
              Start your first interview
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {interviews.map((interview) => (
            <InterviewRow key={interview.id} interview={interview} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Resume() {
  return <ResumeAnalyzer />;
}

export function Insights() {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Analytics"
        title="Insights"
        description="Track how your scores trend over time and where your strongest and weakest topics are."
      />
      <EmptyState
        icon={BarChart3}
        title="Not enough data yet"
        description="Complete a few interviews and QuickHire charts your score trend, strengths by topic, and areas to focus on next."
      />
    </div>
  );
}

export function Profile() {
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Account"
        title="Profile"
        description="Your account details and connected sources."
      />
      {user ? (
        <div className="ln-lift max-w-2xl rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {user.email.split("@")[0]}
              </p>
              <p className="truncate text-sm text-ink-subtle">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            <div className="bg-card p-4">
              <p className="text-xs text-ink-tertiary">Connected GitHub</p>
              <p className="mt-1 text-sm text-ink-subtle">Not connected</p>
            </div>
            <div className="bg-card p-4">
              <p className="text-xs text-ink-tertiary">Connected LinkedIn</p>
              <p className="mt-1 text-sm text-ink-subtle">Not connected</p>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={User}
          title="You're not signed in"
          description="Sign in to save your interview history, track your scores, and connect your GitHub and LinkedIn."
          action={
            <Button
              variant="outline"
              onClick={() => openAuthModal({ mode: "signin" })}
            >
              Sign in
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      )}
    </div>
  );
}

export function SettingsSection() {
  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Account"
        title="Settings"
        description="Manage preferences, notifications, and connected accounts."
      />
      <EmptyState
        icon={Settings}
        title="Nothing to configure yet"
        description="Interview preferences, notification controls, and integrations will live here as they become available."
      />
    </div>
  );
}

type Job = {
  id: string;
  source: "REMOTIVE" | "ARBEITNOW" | "ADZUNA";
  title: string;
  company: string;
  companyLogo: string | null;
  location: string | null;
  remote: boolean;
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "OTHER";
  description: string;
  tags: string[];
  url: string;
  postedAt: string | null;
};

const JOB_TYPE_LABELS: Record<Job["jobType"], string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  OTHER: "Other",
};

const PAGE_SIZE = 20;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function JobCard({ job }: { job: Job }) {
  const posted = timeAgo(job.postedAt);
  const snippet = stripHtml(job.description);
  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className="ln-lift group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        {job.companyLogo ? (
          <img
            src={job.companyLogo}
            alt=""
            className="size-10 shrink-0 rounded-lg border border-border object-contain"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-sm font-semibold text-ink-subtle">
            {job.company.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {job.title}
          </h3>
          <p className="truncate text-sm text-ink-subtle">{job.company}</p>
        </div>
        <ExternalLink className="size-4 shrink-0 text-ink-tertiary transition-colors group-hover:text-primary" />
      </div>

      {snippet && (
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-subtle">
          {snippet}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {job.remote && <Badge variant="secondary">Remote</Badge>}
        {job.jobType !== "OTHER" && (
          <Badge variant="outline">{JOB_TYPE_LABELS[job.jobType]}</Badge>
        )}
        {job.location && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-tertiary">
            <MapPin className="size-3" />
            {job.location}
          </span>
        )}
        {posted && (
          <span className="ml-auto text-xs text-ink-tertiary">{posted}</span>
        )}
      </div>
    </a>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {children}
    </select>
  );
}

export function Jobs() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [type, setType] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, remoteOnly, type, source]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const params: Record<string, string | number | boolean> = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedQuery) params.q = debouncedQuery;
    if (remoteOnly) params.remote = true;
    if (type) params.type = type;
    if (source) params.source = source;

    axios
      .get(`${BACKEND_URL}/jobs`, { params, withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? {};
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setJobs([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, remoteOnly, type, source, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Opportunities"
        title="Jobs"
        description="Software-engineering roles aggregated from top sources. Click any role to apply on the original site."
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search role, company, or tag…"
              className="pl-9"
            />
          </div>

          <button
            type="button"
            onClick={() => setRemoteOnly((v) => !v)}
            aria-pressed={remoteOnly}
            className={cn(
              "h-9 rounded-lg border px-3 text-sm font-medium transition-colors",
              remoteOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-ink-subtle hover:text-foreground",
            )}
          >
            Remote only
          </button>

          <FilterSelect value={type} onChange={setType} label="Job type">
            <option value="">All types</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </FilterSelect>

          <FilterSelect value={source} onChange={setSource} label="Source">
            <option value="">All sources</option>
            <option value="REMOTIVE">Remotive</option>
            <option value="ARBEITNOW">Arbeitnow</option>
            <option value="ADZUNA">Adzuna</option>
          </FilterSelect>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-20 text-sm text-ink-subtle">
          <Loader2 className="size-4 animate-spin" />
          Loading jobs…
        </div>
      ) : error ? (
        <EmptyState
          icon={Briefcase}
          title="Couldn't load jobs"
          description="Something went wrong fetching listings. Please try again in a moment."
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No matching jobs"
          description="No roles match your filters right now. Try broadening your search or clearing filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-tertiary">
              {total} role{total === 1 ? "" : "s"} · page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
