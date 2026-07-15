import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  Download,
  Globe,
  Info,
  Loader2,
  Lock,
  Quote,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Route } from "./+types/interview-result";
import { Badge } from "~/components/ui/badge";
import { ScoreBar } from "~/components/ui/score-bar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import RecordingPlayer, {
  type RecordingStatus,
} from "~/components/app/RecordingPlayer";
import { downloadTranscriptPdf } from "~/lib/transcriptPdf";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Report — QuickHire" }];
}

// ── The v2 scorecard contract (mirrors backend feedbackSchema) ──────────────
type Evidence = { quote: string; note: string };
type Dimension = { key: string; name: string; score: number; rationale: string };
type Topic = {
  name: string;
  score: number;
  summary?: string;
  comment?: string; // v1 fallback
  wentWell?: string[];
  toImprove?: string[];
  evidence?: Evidence[];
};
type Highlight = { title: string; detail: string; evidence?: Evidence | null };
type StudyItem = { focus: string; why: string; action: string };

type Report = {
  schemaVersion?: number;
  overall: number;
  band?: "exceptional" | "strong" | "developing" | "early";
  bandLabel?: string;
  headline?: string;
  summary: string;
  dimensions?: Dimension[];
  topics?: Topic[];
  strengths?: Highlight[] | string[];
  growthAreas?: Highlight[];
  gaps?: string[]; // v1 fallback
  studyPlan?: StudyItem[];
  studyNext?: string[]; // v1 fallback
  transcriptNote?: string | null;
};

type ResultData = {
  status: "SCHEDULED" | "ONGOING" | "COMPLETED";
  type: "REAL" | "PRACTICE";
  skill: string | null;
  jobRole: string;
  experience: string;
  createdAt?: string;
  recordingStatus: RecordingStatus;
  recordingDurationMs: number | null;
  isPublic: boolean;
  ready: boolean;
  result: { score: number; report: Report | null } | null;
};

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 45; // ~3 minutes

// ── Tone helpers (theme-aware: the report now lives in the light/dark dashboard) ──
function scoreTone(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}
function barTone(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}
function bandDot(band?: string): string {
  switch (band) {
    case "exceptional":
      return "bg-emerald-400";
    case "strong":
      return "bg-emerald-500";
    case "developing":
      return "bg-amber-500";
    case "early":
      return "bg-rose-500";
    default:
      return "bg-foreground/40";
  }
}
function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Normalise a strength/growth item that may be a plain string (v1) or object (v2).
function asHighlight(item: Highlight | string): Highlight {
  return typeof item === "string" ? { title: item, detail: "" } : item;
}

// ── Layout primitives ───────────────────────────────────────────────────────
function Reveal({
  delay = 0,
  id,
  className,
  children,
}: {
  delay?: number;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={cn("ln-rise", id && "scroll-mt-24", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {children}
      </h2>
      {hint && <span className="text-xs text-ink-tertiary">{hint}</span>}
    </div>
  );
}

function EvidenceQuote({ evidence }: { evidence: Evidence }) {
  return (
    <figure className="rounded-xl bg-foreground/[0.035] p-4">
      <div className="flex gap-3">
        <Quote className="mt-0.5 size-3.5 shrink-0 text-ink-tertiary" />
        <blockquote className="text-[13.5px] leading-relaxed text-ink-muted">
          {evidence.quote}
        </blockquote>
      </div>
      {evidence.note && (
        <figcaption className="mt-2 pl-6 text-xs leading-relaxed text-ink-tertiary">
          {evidence.note}
        </figcaption>
      )}
    </figure>
  );
}

function DownloadTranscriptButton({
  interviewId,
  fullWidth = false,
}: {
  interviewId: string;
  fullWidth?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadTranscriptPdf(interviewId);
    } catch {
      toast.error("Couldn't generate the transcript. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60",
        fullWidth && "w-full justify-center",
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Download transcript
    </button>
  );
}

// ── Public/private visibility toggle ────────────────────────────────────────
function VisibilityToggle({
  interviewId,
  initialIsPublic,
}: {
  interviewId: string;
  initialIsPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !isPublic;
    setBusy(true);
    setIsPublic(next);
    try {
      await axios.patch(
        `${BACKEND_URL}/interview/${interviewId}/visibility`,
        { isPublic: next },
        { withCredentials: true },
      );
      toast.success(next ? "Interview is now public" : "Interview is now private");
    } catch {
      setIsPublic(!next);
      toast.error("Couldn't update visibility. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublic}
      onClick={toggle}
      disabled={busy}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {isPublic ? (
          <Globe className="size-4 text-primary" />
        ) : (
          <Lock className="size-4 text-ink-subtle" />
        )}
        {isPublic ? "Public" : "Private"}
      </span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          isPublic ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
            isPublic ? "translate-x-[18px]" : "translate-x-[3px]",
          )}
        />
      </span>
    </button>
  );
}

// ── The pinned verdict rail ─────────────────────────────────────────────────
type NavItem = { href: string; label: string };

function Rail({
  data,
  report,
  interviewId,
  nav,
}: {
  data: ResultData;
  report: Report;
  interviewId: string;
  nav: NavItem[];
}) {
  const overall = Math.round(report.overall ?? 0);
  const date = formatDate(data.createdAt);
  return (
    <aside className="shrink-0 lg:sticky lg:top-24 lg:w-[16.5rem]">
      <Reveal className="ln-lift flex flex-col gap-6 rounded-2xl border border-border bg-card p-6">
        {/* Identity */}
        <div className="flex flex-col gap-2.5">
          <span className="ln-eyebrow">Interview Report</span>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground text-balance">
            {data.jobRole}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={data.type === "PRACTICE" ? "secondary" : "outline"}>
              {data.type === "PRACTICE" ? "Practice" : "Interview"}
            </Badge>
            <span className="text-xs text-ink-tertiary">
              <span className="capitalize">{data.experience}</span>
              {date && <span> · {date}</span>}
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <div className="flex items-end gap-1.5">
            <span
              className={cn(
                "ln-mono text-6xl font-semibold leading-none tabular-nums",
                scoreTone(overall),
              )}
            >
              {overall}
            </span>
            <span className="mb-1 text-base text-ink-tertiary">/100</span>
          </div>
          {report.bandLabel && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-ink-muted">
              <span className={cn("size-1.5 rounded-full", bandDot(report.band))} />
              {report.bandLabel}
            </span>
          )}
        </div>

        {/* In-page nav */}
        {nav.length > 0 && (
          <nav className="flex flex-col gap-0.5 border-t border-border pt-5">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1.5 text-sm text-ink-subtle transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <VisibilityToggle interviewId={interviewId} initialIsPublic={data.isPublic} />
          <DownloadTranscriptButton interviewId={interviewId} fullWidth />
          <Link
            to="/dashboard/interviews"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-ink-subtle transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to interviews
          </Link>
        </div>
      </Reveal>
    </aside>
  );
}

// ── Detail column sections ──────────────────────────────────────────────────
function Lede({ report }: { report: Report }) {
  if (!report.headline && !report.summary && !report.transcriptNote) return null;
  return (
    <Reveal className="flex flex-col gap-4">
      {report.headline && (
        <p className="ln-display-md text-foreground text-balance">
          {report.headline}
        </p>
      )}
      {report.summary && (
        <p className="max-w-[64ch] text-base leading-relaxed text-ink-subtle text-pretty">
          {report.summary}
        </p>
      )}
      {report.transcriptNote && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-tertiary">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {report.transcriptNote}
        </p>
      )}
    </Reveal>
  );
}

function Dimensions({ dimensions }: { dimensions: Dimension[] }) {
  return (
    <Reveal id="competencies" delay={80}>
      <SectionTitle hint="Scored across every interview">Competencies</SectionTitle>
      <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {dimensions.map((d) => (
          <div key={d.key} className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground">{d.name}</span>
              <span
                className={cn(
                  "ln-mono text-sm font-semibold tabular-nums",
                  scoreTone(d.score),
                )}
              >
                {Math.round(d.score)}
              </span>
            </div>
            <ScoreBar value={d.score} tone={barTone(d.score)} />
            {d.rationale && (
              <p className="text-xs leading-relaxed text-ink-tertiary">
                {d.rationale}
              </p>
            )}
          </div>
        ))}
      </div>
    </Reveal>
  );
}

function PointList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "improve";
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
        {title}
      </span>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-subtle"
          >
            {tone === "good" ? (
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Topics({ topics }: { topics: Topic[] }) {
  return (
    <Reveal id="topics" delay={80}>
      <SectionTitle hint={`${topics.length} area${topics.length === 1 ? "" : "s"}`}>
        Topic breakdown
      </SectionTitle>
      <div className="rounded-2xl border border-border bg-card px-5 sm:px-6">
        <Accordion type="multiple">
          {topics.map((topic, i) => {
            const summary = topic.summary ?? topic.comment;
            const evidence = topic.evidence ?? [];
            const hasDetail =
              Boolean(summary) ||
              (topic.wentWell?.length ?? 0) > 0 ||
              (topic.toImprove?.length ?? 0) > 0 ||
              evidence.length > 0;
            return (
              <AccordionItem key={i} value={`topic-${i}`}>
                <AccordionTrigger>
                  <div className="flex flex-1 flex-col gap-2 pr-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {topic.name}
                      </span>
                      <span
                        className={cn(
                          "ln-mono text-sm font-semibold tabular-nums",
                          scoreTone(topic.score),
                        )}
                      >
                        {Math.round(topic.score)}
                      </span>
                    </div>
                    <ScoreBar value={topic.score} tone={barTone(topic.score)} height="h-1" />
                  </div>
                </AccordionTrigger>
                {hasDetail && (
                  <AccordionContent className="flex flex-col gap-5">
                    {summary && (
                      <p className="text-[13.5px] leading-relaxed text-ink-subtle text-pretty">
                        {summary}
                      </p>
                    )}
                    {((topic.wentWell?.length ?? 0) > 0 ||
                      (topic.toImprove?.length ?? 0) > 0) && (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <PointList
                          title="What went well"
                          items={topic.wentWell ?? []}
                          tone="good"
                        />
                        <PointList
                          title="What to improve"
                          items={topic.toImprove ?? []}
                          tone="improve"
                        />
                      </div>
                    )}
                    {evidence.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                          From the interview
                        </span>
                        {evidence.map((e, j) => (
                          <EvidenceQuote key={j} evidence={e} />
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </Reveal>
  );
}

function HighlightColumn({
  title,
  icon,
  items,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  items: Highlight[];
  accent: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-6 items-center justify-center rounded-md", accent)}>
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <p className="text-sm font-medium leading-snug text-foreground">
              {item.title}
            </p>
            {item.detail && (
              <p className="text-[13px] leading-relaxed text-ink-subtle text-pretty">
                {item.detail}
              </p>
            )}
            {item.evidence && <EvidenceQuote evidence={item.evidence} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Highlights({
  strengths,
  growthAreas,
}: {
  strengths: Highlight[];
  growthAreas: Highlight[];
}) {
  if (strengths.length === 0 && growthAreas.length === 0) return null;
  return (
    <Reveal id="strengths" delay={80}>
      <div className="grid gap-x-10 gap-y-10 rounded-2xl border border-border bg-card p-7 sm:grid-cols-2 sm:p-8">
        <HighlightColumn
          title="Strengths"
          icon={<Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-500/12"
          items={strengths}
        />
        <HighlightColumn
          title="Where to grow"
          icon={<TrendingUp className="size-3.5 text-amber-600 dark:text-amber-400" />}
          accent="bg-amber-500/12"
          items={growthAreas}
        />
      </div>
    </Reveal>
  );
}

function StudyPlan({ items }: { items: StudyItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <Reveal id="study" delay={80}>
      <SectionTitle>Your study plan</SectionTitle>
      <ol className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-xl border border-border bg-card p-5"
          >
            <span className="ln-mono flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tabular-nums text-ink-muted">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">{item.focus}</p>
              {item.why && (
                <p className="text-[13px] leading-relaxed text-ink-subtle text-pretty">
                  {item.why}
                </p>
              )}
              {item.action && (
                <p className="mt-0.5 flex items-start gap-1.5 text-[13px] leading-relaxed text-foreground/90">
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {item.action}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

function Scorecard({
  data,
  interviewId,
}: {
  data: ResultData;
  interviewId: string;
}) {
  const report = data.result?.report;
  if (!report) return null;

  // Normalise across v1/v2 shapes so old rows degrade instead of crashing.
  const dimensions = report.dimensions ?? [];
  const topics = report.topics ?? [];
  const strengths = (report.strengths ?? []).map(asHighlight);
  const growthAreas =
    report.growthAreas ?? (report.gaps ?? []).map((g) => ({ title: g, detail: "" }));
  const studyPlan =
    report.studyPlan ??
    (report.studyNext ?? []).map((s) => ({ focus: s, why: "", action: "" }));

  const nav: NavItem[] = [
    dimensions.length > 0 && { href: "#competencies", label: "Competencies" },
    topics.length > 0 && { href: "#topics", label: "Topic breakdown" },
    (strengths.length > 0 || growthAreas.length > 0) && {
      href: "#strengths",
      label: "Strengths & growth",
    },
    studyPlan.length > 0 && { href: "#study", label: "Study plan" },
  ].filter(Boolean) as NavItem[];

  return (
    <div className="flex flex-col gap-12 lg:flex-row-reverse lg:items-start lg:gap-14">
      <Rail data={data} report={report} interviewId={interviewId} nav={nav} />

      <div className="flex min-w-0 flex-1 flex-col gap-14">
        <Lede report={report} />
        {dimensions.length > 0 && <Dimensions dimensions={dimensions} />}
        {topics.length > 0 && <Topics topics={topics} />}
        <Highlights strengths={strengths} growthAreas={growthAreas} />
        <StudyPlan items={studyPlan} />
      </div>
    </div>
  );
}

// ── Non-report states ───────────────────────────────────────────────────────
function CenteredState({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary">
        {icon}
      </div>
      <span className="ln-eyebrow mt-6">Interview Report</span>
      <h1 className="ln-display-md mt-3 text-foreground">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-subtle">{description}</p>
      {children}
    </Reveal>
  );
}

// ── Processing skeleton ─────────────────────────────────────────────────────
// Shown while the transcript is still being scored. Mirrors the Scorecard's exact
// layout and section labels (job role/badges/nav are already known at this point —
// only the score and body content are pending) so the page never looks blank or
// generic, and settles into place instead of swapping layouts once ready.
function SkelBar({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton-shimmer rounded-md bg-muted", className)} />
  );
}

function SkeletonRail({
  data,
  timedOut,
}: {
  data: ResultData;
  timedOut: boolean;
}) {
  const date = formatDate(data.createdAt);
  return (
    <aside className="shrink-0 lg:sticky lg:top-24 lg:w-[16.5rem]">
      <div className="ln-lift flex flex-col gap-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-2.5">
          <span className="ln-eyebrow">Interview Report</span>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground text-balance">
            {data.jobRole}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={data.type === "PRACTICE" ? "secondary" : "outline"}>
              {data.type === "PRACTICE" ? "Practice" : "Interview"}
            </Badge>
            <span className="text-xs text-ink-tertiary">
              <span className="capitalize">{data.experience}</span>
              {date && <span> · {date}</span>}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <div className="flex items-center gap-2.5 text-ink-subtle">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm font-medium">
              {timedOut ? "Still scoring" : "Scoring in progress"}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
            <div className="ln-indeterminate h-full w-1/3 rounded-full bg-primary/70" />
          </div>
          <p className="text-xs leading-relaxed text-ink-tertiary">
            {timedOut
              ? "This is taking longer than usual. Your report will be ready in your past interviews shortly — no need to wait here."
              : "We're reading your transcript and putting together a detailed report. This usually takes a minute or two."}
          </p>
        </div>

        <nav className="flex flex-col gap-0.5 border-t border-border pt-5">
          {["Competencies", "Topic breakdown", "Strengths & growth", "Study plan"].map(
            (label) => (
              <span
                key={label}
                className="rounded-md px-2 py-1.5 text-sm text-ink-tertiary/50"
              >
                {label}
              </span>
            ),
          )}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <Link
            to="/dashboard/interviews"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-ink-subtle transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to interviews
          </Link>
        </div>
      </div>
    </aside>
  );
}

function SkeletonDimensions() {
  return (
    <div>
      <SectionTitle hint="Scored across every interview">Competencies</SectionTitle>
      <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <SkelBar className="h-3.5 w-28" />
              <SkelBar className="h-3.5 w-6" />
            </div>
            <SkelBar className="h-1.5 w-full rounded-full" />
            <SkelBar className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonTopics() {
  return (
    <div>
      <SectionTitle>Topic breakdown</SectionTitle>
      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card px-5 sm:px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <SkelBar className="h-3.5 w-36" />
              <SkelBar className="h-3.5 w-6" />
            </div>
            <SkelBar className="h-1 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonHighlights() {
  return (
    <div className="grid gap-x-10 gap-y-10 rounded-2xl border border-border bg-card p-7 sm:grid-cols-2 sm:p-8">
      {["Strengths", "Where to grow"].map((title) => (
        <div key={title} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <SkelBar className="size-6 rounded-md" />
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            <SkelBar className="h-3.5 w-4/5" />
            <SkelBar className="h-3 w-full" />
            <SkelBar className="h-3 w-11/12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonStudyPlan() {
  return (
    <div>
      <SectionTitle>Your study plan</SectionTitle>
      <ol className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-xl border border-border bg-card p-5"
          >
            <span className="ln-mono flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tabular-nums text-ink-muted">
              {i + 1}
            </span>
            <div className="flex flex-1 flex-col gap-2 pt-0.5">
              <SkelBar className="h-3.5 w-2/5" />
              <SkelBar className="h-3 w-full" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ScorecardSkeleton({
  data,
  timedOut,
}: {
  data: ResultData;
  timedOut: boolean;
}) {
  return (
    <div className="flex flex-col gap-12 lg:flex-row-reverse lg:items-start lg:gap-14">
      <SkeletonRail data={data} timedOut={timedOut} />
      <div className="flex min-w-0 flex-1 flex-col gap-14">
        <div className="flex flex-col gap-3">
          <SkelBar className="h-7 w-3/4" />
          <SkelBar className="h-4 w-full max-w-[52ch]" />
          <SkelBar className="h-4 w-5/6 max-w-[46ch]" />
        </div>
        <SkeletonDimensions />
        <SkeletonTopics />
        <SkeletonHighlights />
        <SkeletonStudyPlan />
      </div>
    </div>
  );
}

export default function InterviewResult() {
  const { interviewId } = useParams();

  const [data, setData] = useState<ResultData | null>(null);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!interviewId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/interview/${interviewId}/result`,
          { withCredentials: true },
        );
        if (cancelled) return;
        const payload = res.data?.data as ResultData;
        setData(payload);
        // Keep polling until BOTH the score is ready and the recording has resolved
        // (recording upload finishes around the same time the transcript is scored).
        const settled =
          payload?.ready && payload.recordingStatus !== "PROCESSING";
        if (settled) return;
        if (pollsRef.current >= MAX_POLLS) {
          setTimedOut(true);
          return;
        }
        pollsRef.current += 1;
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [interviewId]);

  if (!interviewId) {
    return (
      <CenteredState
        icon={<BarChart3 className="size-6 text-ink-subtle" />}
        title="Your report is on its way"
        description="Once you finish an interview, your recording and detailed report will appear here."
      />
    );
  }

  if (failed) {
    return (
      <CenteredState
        icon={<BarChart3 className="size-6 text-ink-subtle" />}
        title="Couldn't load your report"
        description="Something went wrong fetching your report. Head back and try again from your past interviews."
      >
        <Link
          to="/dashboard/interviews"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Back to interviews
        </Link>
      </CenteredState>
    );
  }

  const showReport = data?.ready && data.result?.report;

  return (
    <div className="flex flex-col gap-10">
      {data && (
        <RecordingPlayer
          interviewId={interviewId}
          status={data.recordingStatus}
          durationMs={data.recordingDurationMs}
        />
      )}

      {showReport ? (
        <Scorecard data={data!} interviewId={interviewId} />
      ) : data ? (
        <ScorecardSkeleton data={data} timedOut={timedOut} />
      ) : (
        <div className="flex justify-center py-24">
          <Loader2 className="size-5 animate-spin text-ink-subtle" />
        </div>
      )}
    </div>
  );
}
