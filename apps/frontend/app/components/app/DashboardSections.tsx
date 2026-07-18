import { useEffect, useMemo, useState } from "react";
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
  Bookmark,
  BookmarkCheck,
  Braces,
  Briefcase,
  CheckCircle2,
  Clock,
  Database,
  Dumbbell,
  FileText,
  Globe,
  Hexagon,
  ListChecks,
  Loader2,
  MapPin,
  Wallet,
  MessagesSquare,
  Mic,
  Network,
  PlayCircle,
  Search,
  Settings,
  Sparkles,
  Target,
  Terminal,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import EmptyState from "./EmptyState";
import ResumeAnalyzer from "./resume-analyzer/ResumeAnalyzer";
import type { RecordingStatus } from "./RecordingPlayer";
import {
  PublicInterviewFeedCard,
  PublicInterviewFeedCardSkeleton,
  formatDuration,
  type PublicInterviewFeedItem,
} from "./PublicInterviewFeedCard";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { useAuth, usePageEyebrow } from "~/store/store";
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

const SKILL_META: Record<string, { icon: LucideIcon; accent: string }> = {
  react: { icon: Atom, accent: "oklch(0.72 0.13 220)" },
  nodejs: { icon: Hexagon, accent: "oklch(0.68 0.15 145)" },
  "distributed-systems": { icon: Network, accent: "oklch(0.55 0.15 300)" },
  "system-design": { icon: Blocks, accent: "oklch(0.6 0.17 265)" },
  "sql-databases": { icon: Database, accent: "oklch(0.62 0.18 292)" },
  javascript: { icon: Braces, accent: "oklch(0.55 0.18 255)" },
  python: { icon: Terminal, accent: "oklch(0.75 0.15 85)" },
  dsa: { icon: Binary, accent: "oklch(0.6 0.11 185)" },
};

const SKILL_BG: Record<string, string> = {
  react: "react",
  nodejs: "nodejs",
  "distributed-systems": "distributedsystem",
  "system-design": "systemdesign",
  "sql-databases": "sql",
  javascript: "typescript",
  python: "python",
  dsa: "dsa",
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

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const setPageEyebrow = usePageEyebrow((s) => s.setEyebrow);
  useEffect(() => {
    setPageEyebrow(eyebrow);
    return () => setPageEyebrow(null);
  }, [eyebrow, setPageEyebrow]);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="ln-eyebrow md:hidden">{eyebrow}</span>
      <div className="flex flex-wrap items-end justify-between gap-0">
        <div>
          {title && (
            <h1 className="ln-display-md text-foreground">{title}</h1>
          )}
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

function formatMinutes(total: number): string {
  if (total <= 0) return "0m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function KpiCard({
  icon: Icon,
  accent,
  label,
  value,
  hint,
  hintTone = "neutral",
}: {
  icon: LucideIcon;
  accent: string;
  label: string;
  value: string;
  hint?: string;
  hintTone?: "up" | "down" | "neutral";
}) {
  return (
    <div
      style={{ ["--accent" as string]: accent }}
      className="ln-lift ln-rise rounded-2xl border border-border bg-card p-5"
    >
      <span
        className="flex size-9 items-center justify-center rounded-lg text-[var(--accent)] ring-1 ring-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
        style={{
          background: "color-mix(in oklab, var(--accent) 13%, var(--card))",
        }}
      >
        <Icon className="size-4" />
      </span>
      <p className="ln-eyebrow mt-4">{label}</p>
      <p className="ln-mono mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {hint && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            hintTone === "up" && "text-[var(--success)]",
            hintTone === "down" && "text-destructive",
            hintTone === "neutral" && "text-ink-tertiary",
          )}
        >
          {hintTone === "up" && <TrendingUp className="size-3" />}
          {hintTone === "down" && <TrendingDown className="size-3" />}
          {hint}
        </p>
      )}
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="ln-lift rounded-2xl border border-border bg-card p-5">
      <div className="skeleton-shimmer size-9 rounded-lg bg-muted" />
      <div className="skeleton-shimmer mt-4 h-3 w-20 rounded bg-muted" />
      <div className="skeleton-shimmer mt-2 h-7 w-16 rounded bg-muted" />
    </div>
  );
}

function RecordingRow({ interview }: { interview: PastInterview }) {
  const date = new Date(interview.createdAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const status = interview.recordingStatus ?? "NONE";
  const ready = status === "READY";
  const processing = status === "PROCESSING";
  const duration = formatDuration(interview.recordingDurationMs);

  return (
    <Link
      to={`/dashboard/interviews/${interview.id}/result`}
      className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          ready
            ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
            : "bg-muted text-ink-tertiary",
        )}
      >
        {processing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PlayCircle className="size-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {interview.jobRole}
        </p>
        <p className="truncate text-[11px] text-ink-tertiary">
          {LEVEL_LABEL[interview.experience]}
          {dateLabel ? ` · ${dateLabel}` : ""}
          {processing
            ? " · Preparing"
            : ready
              ? duration
                ? ` · ${duration}`
                : ""
              : " · No recording"}
        </p>
      </div>
    </Link>
  );
}

const RESUME_FEATURES = [
  "ATS Score",
  "Keyword Matching",
  "Missing Skills Detection",
  "Resume Improvements",
  "Recruiter Feedback",
  "Formatting Suggestions",
];

function ResumeFeatureCard({ atsScore }: { atsScore: number | null }) {
  return (
    <div className="ln-lift ln-rise relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)",
        }}
      />
      <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <h2 className="ln-display-md mt-2 text-foreground">
            Beat the ATS before you apply.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-subtle">
            Upload your resume and get a transparent, category-by-category
            score with concrete fixes — not a black-box number.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {RESUME_FEATURES.map((f) => (
              <span
                key={f}
                className="flex items-center gap-2 text-xs text-ink-subtle"
              >
                <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                {f}
              </span>
            ))}
          </div>
          <Button asChild size="lg" className="mt-6 gap-2">
            <Link to="/dashboard/resume">
              Analyze Resume
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p className="mt-2.5 text-xs text-ink-tertiary">
            Improve your chances of passing ATS screening before applying.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="ln-lift flex size-40 flex-col items-center justify-center gap-1 rounded-full border border-border bg-muted/40 sm:size-48">
            {atsScore != null ? (
              <>
                <span className="ln-mono text-4xl font-semibold tabular-nums text-foreground">
                  {Math.round(atsScore)}
                </span>
                <span className="text-xs text-ink-tertiary">
                  Latest ATS score
                </span>
              </>
            ) : (
              <>
                <FileText className="size-8 text-ink-tertiary" />
                <span className="mt-1 max-w-28 text-center text-xs text-ink-tertiary">
                  No analysis yet
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomCta() {
  const startInterview = useStartInterview();
  return (
    <div className="ln-lift ln-rise relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full opacity-70"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%)",
        }}
      />
      <h2 className="ln-display-md text-foreground">
        Ready for your next interview?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-subtle">
        Practice with a resume-tailored session or drill a single skill —
        either way, you'll walk away with a scored, actionable breakdown.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" className="gap-2" onClick={startInterview}>
          Start AI Interview
          <ArrowRight className="size-4" />
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/dashboard/practice">Explore features</Link>
        </Button>
      </div>
    </div>
  );
}

type DashboardOverviewData = {
  totalInterviews: number;
  minutesPracticed: number;
  bestScore: number | null;
  avgScore: number | null;
  lastScoreDelta: number | null;
  savedJobs: number;
  latestAtsScore: number | null;
  recent: PastInterview[];
};

const FEATURED_SKILL_IDS = ["react", "nodejs", "javascript"];

export function Overview() {
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);

  const [dashboard, setDashboard] = useState<DashboardOverviewData | null>(
    null,
  );
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [skills, setSkills] = useState<PracticeSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [publicInterviews, setPublicInterviews] = useState<
    PublicInterviewFeedItem[]
  >([]);
  const [publicInterviewsLoading, setPublicInterviewsLoading] =
    useState(true);

  useEffect(() => {
    if (!user) {
      setDashboard(null);
      setDashboardLoading(false);
      return;
    }
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/dashboard`, { withCredentials: true })
      .then((res) => {
        if (!cancelled) setDashboard(res.data?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setDashboard(null);
      })
      .finally(() => {
        if (!cancelled) setDashboardLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/interview/public`, {
        params: { limit: 8 },
        withCredentials: true,
      })
      .then((res) => {
        if (!cancelled)
          setPublicInterviews(res.data?.data?.interviews ?? []);
      })
      .catch(() => {
        if (!cancelled) setPublicInterviews([]);
      })
      .finally(() => {
        if (!cancelled) setPublicInterviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/interview/practice/skills`, {
        withCredentials: true,
      })
      .then((res) => {
        if (cancelled) return;
        const all: PracticeSkill[] = res.data?.data?.skills ?? [];
        const featured = FEATURED_SKILL_IDS.map((id) =>
          all.find((s) => s.id === id),
        ).filter((s): s is PracticeSkill => Boolean(s));
        setSkills(featured.length > 0 ? featured : all.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setSkills([]);
      })
      .finally(() => {
        if (!cancelled) setSkillsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const jobsRequest = axios.get(`${BACKEND_URL}/jobs`, {
      params: { page: 1, pageSize: 6 },
      withCredentials: true,
    });
    const request = user
      ? Promise.all([
          jobsRequest,
          axios
            .get(`${BACKEND_URL}/jobs/saved`, { withCredentials: true })
            .catch(() => ({ data: { data: { jobs: [] } } })),
        ])
      : jobsRequest.then((jobsRes) => [jobsRes, null] as const);
    request
      .then(([jobsRes, savedRes]) => {
        if (cancelled) return;
        setJobs(jobsRes.data?.data?.jobs ?? []);
        const savedList: Job[] = savedRes?.data?.data?.jobs ?? [];
        setSavedIds(new Set(savedList.map((j) => j.id)));
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      })
      .finally(() => {
        if (!cancelled) setJobsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveJob = (job: Job) => {
    const wasSaved = savedIds.has(job.id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(job.id);
      else next.add(job.id);
      return next;
    });
    const request = wasSaved
      ? axios.delete(`${BACKEND_URL}/jobs/${job.id}/save`, {
          withCredentials: true,
        })
      : axios.post(
          `${BACKEND_URL}/jobs/${job.id}/save`,
          {},
          { withCredentials: true },
        );
    request
      .then(() => toast.success(wasSaved ? "Removed from saved" : "Job saved"))
      .catch(() => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(job.id);
          else next.delete(job.id);
          return next;
        });
        toast.error("Couldn't update saved jobs. Please try again.");
      });
  };

  const toggleSave = (job: Job) => {
    if (!user) {
      openAuthModal({ mode: "signin", onSuccess: () => saveJob(job) });
      return;
    }
    saveJob(job);
  };

  const greetingName = user?.email ? user.email.split("@")[0] : null;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Workspace"
        description="Your interview activity at a glance. Start a session and your progress builds up here."
      />

      <StartInterviewHero />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Recent recordings
            </h2>
            <Link
              to="/dashboard/interviews"
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-subtle hover:text-primary"
            >
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {dashboardLoading ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="skeleton-shimmer size-8 shrink-0 rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="skeleton-shimmer h-3.5 w-32 rounded bg-muted" />
                    <div className="skeleton-shimmer mt-2 h-2.5 w-24 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboard && dashboard.recent.length > 0 ? (
            <div className="ln-lift flex flex-col rounded-2xl border border-border bg-card p-3">
              {dashboard.recent.map((interview) => (
                <RecordingRow key={interview.id} interview={interview} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Mic}
              title="No recordings yet"
              description="Every interview is recorded. Finish a session and replay it here to hear exactly how you answered."
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Globe className="size-4 text-primary" />
                Public interviews
              </h2>
              <p className="mt-1 text-xs text-ink-subtle">
                Recordings other candidates have chosen to share publicly.
              </p>
            </div>
            <Link
              to="/dashboard/overview/public"
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-subtle hover:text-primary"
            >
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {publicInterviewsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <PublicInterviewFeedCardSkeleton key={i} />
              ))}
            </div>
          ) : publicInterviews.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {publicInterviews.slice(0, 4).map((interview) => (
                <PublicInterviewFeedCard key={interview.id} interview={interview} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Globe}
              title="No public interviews yet"
              description="Once candidates share a recording from their profile, it shows up here for everyone to see."
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Practice by Skill
            </h2>
            <p className="mt-1 text-xs text-ink-subtle">
              No resume required. Master individual technologies with
              expertly researched interview questions.
            </p>
          </div>
          <Link
            to="/dashboard/practice"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-subtle hover:text-primary"
          >
            View all skills
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {skillsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {skills.map((skill, i) => (
              <SkillCard key={skill.id} skill={skill} index={i} />
            ))}
          </div>
        )}
      </div>

      <ResumeFeatureCard atsScore={dashboard?.latestAtsScore ?? null} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Latest Jobs
            </h2>
            <p className="mt-1 text-xs text-ink-subtle">
              Discover curated software engineering jobs from multiple
              sources.
            </p>
          </div>
          <Link
            to="/dashboard/jobs"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-subtle hover:text-primary"
          >
            View all jobs
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {jobsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                saved={savedIds.has(job.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No jobs available"
            description="Check back soon — new roles are ingested regularly."
          />
        )}
      </div>

      <BottomCta />
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
  const bgSlug = SKILL_BG[skill.id];

  return (
    <Link
      to={`/dashboard/practice/${skill.id}`}
      style={{
        ["--accent" as string]: accent,
        animationDelay: `${Math.min(index, 8) * 45}ms`,
      }}
      className={cn(
        "ln-lift ln-rise group relative isolate flex min-h-[190px] flex-col justify-between overflow-hidden rounded-2xl border bg-card p-5 text-left",
        "border-[color-mix(in_oklab,var(--accent)_25%,var(--border))]",
        "transition-[transform,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_55%,var(--border))]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--accent)_55%,transparent)]",
        "active:translate-y-0 active:scale-[0.99]",
      )}
    >
      {bgSlug && (
        <>
          <img
            src={`/${bgSlug}-light-mode.png`}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-20 size-full scale-105 object-cover object-right transition-transform duration-500 ease-out group-hover:scale-110 dark:hidden"
          />
          <img
            src={`/${bgSlug}-dark-mode.png`}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-20 hidden size-full scale-105 object-cover object-right transition-transform duration-500 ease-out group-hover:scale-110 dark:block"
          />
        </>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-card via-card/80 to-card/10"
      />

      <div className="relative flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[var(--accent)] ring-1 ring-[color-mix(in_oklab,var(--accent)_35%,transparent)] transition-transform duration-200 ease-out group-hover:scale-[1.06]"
          style={{
            background: "color-mix(in oklab, var(--accent) 16%, var(--card))",
          }}
        >
          <Icon className="size-5" />
        </span>
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
          {skill.label}
        </h3>
      </div>

      <div className="relative">
        <p className="line-clamp-2 max-w-[62%] text-xs leading-relaxed text-ink-subtle">
          {skill.blurb}
        </p>
        <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors duration-200 group-hover:bg-brand-hover">
          View details
          <ArrowRight className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

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
    <div className="ln-lift flex min-h-[190px] flex-col justify-between rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton-shimmer size-10 rounded-xl bg-muted" />
        <div className="skeleton-shimmer h-4 w-28 rounded bg-muted" />
      </div>
      <div>
        <div className="skeleton-shimmer h-3 w-full max-w-[62%] rounded bg-muted" />
        <div className="skeleton-shimmer mt-1.5 h-3 w-1/3 max-w-[62%] rounded bg-muted" />
        <div className="skeleton-shimmer mt-4 h-8 w-28 rounded-lg bg-muted" />
      </div>
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);
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

  const handleStartClick = () => {
    if (!user) {
      openAuthModal({ mode: "signup", onSuccess: () => startPractice() });
      return;
    }
    startPractice();
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
            onClick={handleStartClick}
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
  recordingStatus?: RecordingStatus;
  recordingDurationMs?: number | null;
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
      to={`/dashboard/interviews/${interview.id}/result`}
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
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);
  const startInterview = useStartInterview();
  const [interviews, setInterviews] = useState<PastInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setInterviews([]);
      setLoading(false);
      return;
    }
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
  }, [user]);

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
      {!user ? (
        <EmptyState
          icon={MessagesSquare}
          title="Sign in to see your past interviews"
          description="Once you're signed in, every completed session — transcript, score, and recording — lands here."
          action={
            <Button variant="outline" onClick={() => openAuthModal({ mode: "signin" })}>
              Sign in
              <ArrowRight className="size-4" />
            </Button>
          }
        />
      ) : loading ? (
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
        description="Complete a few interviews and Hireflow charts your score trend, strengths by topic, and areas to focus on next."
      />
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
  category: string | null;
  description: string;
  tags: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
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

const SOURCE_LABELS: Record<Job["source"], string> = {
  REMOTIVE: "Remotive",
  ARBEITNOW: "Arbeitnow",
  ADZUNA: "Adzuna",
};

const PAGE_SIZE = 20;

const JOB_ACCENT = "oklch(0.84 0.04 278)";

const JOB_ACCENTS = Array(8).fill(JOB_ACCENT) as readonly string[];

function jobAccent(company: string): string {
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = (hash * 31 + company.charCodeAt(i)) | 0;
  }
  return JOB_ACCENTS[Math.abs(hash) % JOB_ACCENTS.length];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  CAD: "$",
  AUD: "$",
};

function compactMoney(n: number, symbol: string): string {
  if (n >= 1000) {
    const k = n / 1000;
    const rounded = k >= 100 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${symbol}${rounded}k`;
  }
  return `${symbol}${Math.round(n)}`;
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
): string | null {
  if (!min && !max) return null;
  const code = (currency ?? "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] ?? "";
  const suffix = symbol ? "" : ` ${code}`;
  if (min && max) {
    if (min === max) return `${compactMoney(min, symbol)}${suffix}`;
    return `${compactMoney(min, symbol)}–${compactMoney(max, symbol)}${suffix}`;
  }
  if (min) return `From ${compactMoney(min, symbol)}${suffix}`;
  return `Up to ${compactMoney(max as number, symbol)}${suffix}`;
}

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

function JobCard({
  job,
  index,
  saved,
  onToggleSave,
}: {
  job: Job;
  index: number;
  saved: boolean;
  onToggleSave: (job: Job) => void;
}) {
  const posted = timeAgo(job.postedAt);
  const snippet = stripHtml(job.description);
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const accent = jobAccent(job.company);
  const tags = (job.tags ?? []).slice(0, 3);
  const extraTags = Math.max(0, (job.tags?.length ?? 0) - tags.length);

  return (
    <article
      style={{
        ["--accent" as string]: accent,
        animationDelay: `${Math.min(index, 8) * 45}ms`,
      }}
      className={cn(
        "ln-lift ln-rise group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5",
        "transition-[transform,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border))]",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 ease-out group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--accent) 45%, transparent), transparent 70%)",
        }}
      />

      <div className="flex items-start gap-3">
        {job.companyLogo ? (
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-[color-mix(in_oklab,var(--accent)_22%,transparent)] transition-transform duration-200 ease-out group-hover:scale-[1.06]">
            <img
              src={job.companyLogo}
              alt=""
              className="size-full object-contain p-1.5"
            />
          </span>
        ) : (
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-[var(--accent)] ring-1 ring-[color-mix(in_oklab,var(--accent)_22%,transparent)] transition-transform duration-200 ease-out group-hover:scale-[1.06]"
            style={{
              background: "color-mix(in oklab, var(--accent) 13%, var(--card))",
            }}
          >
            {job.company.slice(0, 1).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground transition-colors duration-200 group-hover:text-[var(--accent)]">
            {job.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-subtle">
            <span className="truncate">{job.company}</span>
            <span aria-hidden className="text-ink-tertiary">
              ·
            </span>
            <span className="shrink-0 text-ink-tertiary">
              {SOURCE_LABELS[job.source]}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleSave(job)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved jobs" : "Save job"}
          title={saved ? "Saved" : "Save"}
          className={cn(
            "-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border",
            "transition-[transform,color,background-color,border-color] duration-150 ease-out active:scale-[0.92]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--accent)_55%,transparent)]",
            saved
              ? "border-[color-mix(in_oklab,var(--accent)_40%,var(--border))] bg-[color-mix(in_oklab,var(--accent)_12%,var(--card))] text-[var(--accent)]"
              : "border-transparent text-ink-tertiary hover:border-border hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {saved ? (
            <BookmarkCheck className="size-4" />
          ) : (
            <Bookmark className="size-4" />
          )}
        </button>
      </div>

      {salary && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Wallet className="size-3.5 text-[var(--accent)]" />
          {salary}
        </p>
      )}

      {snippet && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-subtle">
          {snippet}
        </p>
      )}

      {(tags.length > 0 || job.jobType !== "OTHER") && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {tags.length > 0
            ? tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-ink-subtle"
                >
                  {t}
                </span>
              ))
            : job.jobType !== "OTHER" && (
                <Badge variant="outline">{JOB_TYPE_LABELS[job.jobType]}</Badge>
              )}
          {extraTags > 0 && (
            <span className="px-1 py-0.5 text-[11px] text-ink-tertiary">
              +{extraTags}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-tertiary">
          {job.remote && (
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent)]">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              Remote
            </span>
          )}
          {job.location && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{job.location}</span>
            </span>
          )}
          {posted && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {posted}
            </span>
          )}
        </div>

        <Button asChild size="sm" className="shrink-0">
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            Apply
            <ArrowRight className="transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function JobCardSkeleton() {
  return (
    <div className="ln-lift flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="skeleton-shimmer size-11 shrink-0 rounded-xl bg-muted" />
        <div className="min-w-0 flex-1">
          <div className="skeleton-shimmer h-4 w-40 rounded bg-muted" />
          <div className="skeleton-shimmer mt-2 h-3 w-24 rounded bg-muted" />
        </div>
        <div className="skeleton-shimmer size-8 shrink-0 rounded-lg bg-muted" />
      </div>
      <div className="skeleton-shimmer mt-3 h-4 w-28 rounded bg-muted" />
      <div className="skeleton-shimmer mt-3 h-3 w-full rounded bg-muted" />
      <div className="skeleton-shimmer mt-1.5 h-3 w-2/3 rounded bg-muted" />
      <div className="mt-3 flex gap-1.5">
        <div className="skeleton-shimmer h-5 w-14 rounded-md bg-muted" />
        <div className="skeleton-shimmer h-5 w-16 rounded-md bg-muted" />
        <div className="skeleton-shimmer h-5 w-12 rounded-md bg-muted" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
        <div className="skeleton-shimmer h-3 w-24 rounded bg-muted" />
        <div className="skeleton-shimmer h-7 w-16 rounded-lg bg-muted" />
      </div>
    </div>
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
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);
  const [view, setView] = useState<"all" | "saved">("all");

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

  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setSavedJobs([]);
      setSavedIds(new Set());
      setSavedError(false);
      setSavedLoading(false);
      return;
    }
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/jobs/saved`, { withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        const list: Job[] = res.data?.data?.jobs ?? [];
        setSavedJobs(list);
        setSavedIds(new Set(list.map((j) => j.id)));
      })
      .catch(() => {
        if (!cancelled) setSavedError(true);
      })
      .finally(() => {
        if (!cancelled) setSavedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveJob = (job: Job) => {
    const wasSaved = savedIds.has(job.id);

    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(job.id);
      else next.add(job.id);
      return next;
    });
    setSavedJobs((prev) =>
      wasSaved
        ? prev.filter((j) => j.id !== job.id)
        : prev.some((j) => j.id === job.id)
          ? prev
          : [job, ...prev],
    );

    const request = wasSaved
      ? axios.delete(`${BACKEND_URL}/jobs/${job.id}/save`, {
          withCredentials: true,
        })
      : axios.post(
          `${BACKEND_URL}/jobs/${job.id}/save`,
          {},
          { withCredentials: true },
        );

    request
      .then(() => toast.success(wasSaved ? "Removed from saved" : "Job saved"))
      .catch(() => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(job.id);
          else next.delete(job.id);
          return next;
        });
        setSavedJobs((prev) =>
          wasSaved
            ? prev.some((j) => j.id === job.id)
              ? prev
              : [job, ...prev]
            : prev.filter((j) => j.id !== job.id),
        );
        toast.error("Couldn't update saved jobs. Please try again.");
      });
  };

  const toggleSave = (job: Job) => {
    if (!user) {
      openAuthModal({ mode: "signin", onSuccess: () => saveJob(job) });
      return;
    }
    saveJob(job);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Opportunities"
        title="Jobs"
        description="Software-engineering roles aggregated from top sources. Save the ones worth a second look, then apply on the original site."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {(["all", "saved"] as const).map((v) => {
            const on = view === v;
            const count = v === "saved" ? savedIds.size : null;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={on}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-sm font-medium transition-colors",
                  on
                    ? "bg-primary/10 text-primary"
                    : "text-ink-subtle hover:text-foreground",
                )}
              >
                {v === "saved" && <Bookmark className="size-3.5" />}
                {v === "all" ? "All jobs" : "Saved"}
                {count !== null && count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px] tabular-nums",
                      on ? "bg-primary/15" : "bg-muted text-ink-tertiary",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {view === "all" && (
          <>
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
          </>
        )}
      </div>

      {view === "saved" ? (
        !user ? (
          <EmptyState
            icon={Bookmark}
            title="Sign in to save jobs"
            description="Create an account to bookmark roles you like and pick up where you left off."
            action={
              <Button variant="outline" onClick={() => openAuthModal({ mode: "signin" })}>
                Sign in
              </Button>
            }
          />
        ) : savedLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : savedError ? (
          <EmptyState
            icon={Briefcase}
            title="Couldn't load saved jobs"
            description="Something went wrong fetching your saved roles. Please try again in a moment."
          />
        ) : savedJobs.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved jobs yet"
            description="Tap the bookmark on any role to keep it here for later."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                saved={savedIds.has(job.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        )
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                saved={savedIds.has(job.id)}
                onToggleSave={toggleSave}
              />
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
