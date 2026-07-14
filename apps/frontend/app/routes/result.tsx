import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  Download,
  GraduationCap,
  Info,
  Loader2,
  Quote,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Route } from "./+types/result";
import TopNav from "~/components/app/TopNav";
import { Badge } from "~/components/ui/badge";
import { ScoreBar } from "~/components/ui/score-bar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { downloadTranscriptPdf } from "~/lib/transcriptPdf";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Report — QuickHire" }];
}

// ── The v2 scorecard contract (mirrors backend feedbackSchema) ──────────────
type Evidence = { quote: string; note: string };
type Dimension = {
  key: string;
  name: string;
  score: number;
  rationale: string;
};
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
  ready: boolean;
  result: { score: number; report: Report | null } | null;
};

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 45; // ~3 minutes

// ── Tone helpers ────────────────────────────────────────────────────────────
function scoreTone(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
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
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto flex max-w-4xl flex-col px-5 py-16 sm:px-8">
        {children}
      </main>
    </div>
  );
}

function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("ln-rise", className)} style={{ animationDelay: `${delay}ms` }}>
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
  variant = "solid",
}: {
  interviewId: string;
  variant?: "solid" | "ghost";
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
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60",
        variant === "solid"
          ? "border border-border bg-secondary text-foreground hover:bg-muted"
          : "text-ink-subtle hover:text-foreground",
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

// ── Scorecard sections ──────────────────────────────────────────────────────
function Header({
  data,
  interviewId,
}: {
  data: ResultData;
  interviewId: string;
}) {
  const date = formatDate(data.createdAt);
  return (
    <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2.5">
        <span className="ln-eyebrow">Interview Report</span>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="ln-display-md text-foreground">{data.jobRole}</h1>
          <Badge variant={data.type === "PRACTICE" ? "secondary" : "outline"}>
            {data.type === "PRACTICE" ? "Practice" : "Interview"}
          </Badge>
        </div>
        <p className="text-sm text-ink-subtle">
          <span className="capitalize">{data.experience}</span> level
          {date && <span className="text-ink-tertiary"> · {date}</span>}
        </p>
      </div>
      <div className="shrink-0">
        <DownloadTranscriptButton interviewId={interviewId} />
      </div>
    </Reveal>
  );
}

function ScorePanel({ report }: { report: Report }) {
  const overall = Math.round(report.overall ?? 0);
  return (
    <Reveal delay={80}>
      <div className="ln-lift grid gap-8 rounded-2xl border border-border bg-card p-7 sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-9">
        <div className="flex flex-col items-start gap-3 sm:border-r sm:border-border sm:pr-10">
          <div className="flex items-end gap-1.5">
            <span
              className={cn(
                "ln-mono text-6xl font-semibold leading-none tabular-nums sm:text-7xl",
                scoreTone(overall),
              )}
            >
              {overall}
            </span>
            <span className="mb-1.5 text-lg text-ink-tertiary">/100</span>
          </div>
          {report.bandLabel && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-ink-muted">
              <span className={cn("size-1.5 rounded-full", bandDot(report.band))} />
              {report.bandLabel}
            </span>
          )}
        </div>
        <div className="flex flex-col justify-center gap-3">
          {report.headline && (
            <p className="text-lg font-medium leading-snug text-foreground text-pretty">
              {report.headline}
            </p>
          )}
          {report.summary && (
            <p className="max-w-[62ch] text-sm leading-relaxed text-ink-subtle text-pretty">
              {report.summary}
            </p>
          )}
          {report.transcriptNote && (
            <p className="mt-1 flex items-start gap-2 text-xs leading-relaxed text-ink-tertiary">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {report.transcriptNote}
            </p>
          )}
        </div>
      </div>
    </Reveal>
  );
}

function Dimensions({ dimensions }: { dimensions: Dimension[] }) {
  return (
    <Reveal delay={140}>
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
          <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-subtle">
            {tone === "good" ? (
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
            ) : (
              <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
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
    <Reveal delay={200}>
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
    <Reveal delay={260}>
      <div className="grid gap-x-10 gap-y-10 rounded-2xl border border-border bg-card p-7 sm:grid-cols-2 sm:p-8">
        <HighlightColumn
          title="Strengths"
          icon={<Sparkles className="size-3.5 text-emerald-400" />}
          accent="bg-emerald-500/12"
          items={strengths}
        />
        <HighlightColumn
          title="Where to grow"
          icon={<TrendingUp className="size-3.5 text-amber-400" />}
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
    <Reveal delay={320}>
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

  return (
    <div className="flex flex-col gap-14">
      <Header data={data} interviewId={interviewId} />
      <ScorePanel report={report} />
      {dimensions.length > 0 && <Dimensions dimensions={dimensions} />}
      {topics.length > 0 && <Topics topics={topics} />}
      <Highlights strengths={strengths} growthAreas={growthAreas} />
      <StudyPlan items={studyPlan} />

      <Reveal delay={380}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <Link
            to="/dashboard/interviews"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-subtle transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to interviews
          </Link>
          <DownloadTranscriptButton interviewId={interviewId} variant="ghost" />
        </div>
      </Reveal>
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
    <Reveal className="flex flex-col items-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary">
        {icon}
      </div>
      <span className="ln-eyebrow mt-6">Interview Report</span>
      <h1 className="ln-display-md mt-3 text-foreground">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-subtle">
        {description}
      </p>
      {children}
    </Reveal>
  );
}

function AnalyzingState({ timedOut }: { timedOut: boolean }) {
  return (
    <CenteredState
      icon={<Loader2 className="size-6 animate-spin text-ink-subtle" />}
      title={timedOut ? "Still analysing your interview" : "Analysing your interview"}
      description={
        timedOut
          ? "This is taking a little longer than usual. Your report will be ready in your past interviews shortly — no need to wait here."
          : "We're reading your transcript and putting together a detailed report. This usually takes a minute or two. You can safely leave this page — your report will be waiting for you in Past Interviews."
      }
    >
      <div className="mt-7 flex flex-col items-center gap-4">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-foreground/10">
          <div className="ln-indeterminate h-full w-1/3 rounded-full bg-primary/70" />
        </div>
        <Link
          to="/dashboard/interviews"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Go to Past Interviews
          <ArrowUpRight className="size-4" />
        </Link>
        <p className="text-xs text-ink-tertiary">
          This page updates automatically when your report is ready.
        </p>
      </div>
    </CenteredState>
  );
}

export default function Result() {
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get("interviewId");

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
        if (payload?.ready) return;
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
      <Shell>
        <CenteredState
          icon={<BarChart3 className="size-6 text-ink-subtle" />}
          title="Your report is on its way"
          description="Once you finish an interview, your detailed report and breakdown will appear here."
        />
      </Shell>
    );
  }

  if (failed) {
    return (
      <Shell>
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
      </Shell>
    );
  }

  if (data?.ready && data.result?.report) {
    return (
      <Shell>
        <Scorecard data={data} interviewId={interviewId} />
      </Shell>
    );
  }

  return (
    <Shell>
      <AnalyzingState timedOut={timedOut} />
    </Shell>
  );
}
