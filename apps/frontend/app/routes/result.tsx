import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import axios from "axios";
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react";
import type { Route } from "./+types/result";
import TopNav from "~/components/app/TopNav";
import { Badge } from "~/components/ui/badge";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Result — QuickHire" }];
}

type TopicScore = { name: string; score: number; comment: string };

type Report = {
  overall: number;
  summary: string;
  topics: TopicScore[];
  strengths: string[];
  gaps: string[];
  studyNext: string[];
};

type ResultData = {
  status: "SCHEDULED" | "ONGOING" | "COMPLETED";
  type: "REAL" | "PRACTICE";
  skill: string | null;
  jobRole: string;
  experience: string;
  ready: boolean;
  result: { score: number; report: Report | null } | null;
};

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 45; // ~3 minutes

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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="mx-auto flex max-w-3xl flex-col px-5 py-16 sm:px-8">
        {children}
      </main>
    </div>
  );
}

function CenteredState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary">
        {icon}
      </div>
      <span className="ln-eyebrow mt-6">Report</span>
      <h1 className="ln-display-md mt-3 text-foreground">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-subtle">
        {description}
      </p>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2 text-sm leading-relaxed text-ink-subtle"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Scorecard({ data }: { data: ResultData }) {
  const report = data.result?.report;
  const overall = report?.overall ?? data.result?.score ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ln-eyebrow">Scorecard</span>
          <Badge variant={data.type === "PRACTICE" ? "secondary" : "outline"}>
            {data.type === "PRACTICE" ? "Practice" : "Interview"}
          </Badge>
        </div>
        <h1 className="ln-display-md text-foreground">{data.jobRole}</h1>
        <p className="text-sm capitalize text-ink-subtle">
          {data.experience} level
        </p>
      </div>

      <div className="flex items-center gap-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col items-center">
          <span
            className={cn(
              "ln-mono text-5xl font-semibold tabular-nums",
              scoreTone(overall),
            )}
          >
            {Math.round(overall)}
          </span>
          <span className="mt-1 text-xs text-ink-tertiary">out of 100</span>
        </div>
        {report?.summary && (
          <p className="flex-1 text-sm leading-relaxed text-ink-subtle">
            {report.summary}
          </p>
        )}
      </div>

      {report?.topics && report.topics.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground">
            Topic breakdown
          </h3>
          <div className="mt-4 flex flex-col gap-4">
            {report.topics.map((topic, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
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
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full", barTone(topic.score))}
                    style={{
                      width: `${Math.max(0, Math.min(100, topic.score))}%`,
                    }}
                  />
                </div>
                {topic.comment && (
                  <p className="text-xs leading-relaxed text-ink-tertiary">
                    {topic.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {report && (
        <div className="grid gap-4 sm:grid-cols-2">
          <List title="Strengths" items={report.strengths} />
          <List title="Areas to improve" items={report.gaps} />
        </div>
      )}

      {report?.studyNext && report.studyNext.length > 0 && (
        <List title="What to study next" items={report.studyNext} />
      )}

      <Link
        to="/dashboard/interviews"
        className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <ArrowLeft className="size-4" />
        Back to interviews
      </Link>
    </div>
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
          title="Your scorecard is on its way"
          description="Once you finish an interview, your objective scorecard and breakdown will appear here."
        />
      </Shell>
    );
  }

  if (failed) {
    return (
      <Shell>
        <CenteredState
          icon={<BarChart3 className="size-6 text-ink-subtle" />}
          title="Couldn't load your result"
          description="Something went wrong fetching your scorecard. Head back and try again from your past interviews."
        />
      </Shell>
    );
  }

  if (data?.ready && data.result) {
    return (
      <Shell>
        <Scorecard data={data} />
      </Shell>
    );
  }

  return (
    <Shell>
      <CenteredState
        icon={<Loader2 className="size-6 animate-spin text-ink-subtle" />}
        title={timedOut ? "Still working on it" : "Grading your interview"}
        description={
          timedOut
            ? "Your scorecard is taking longer than usual. Check back on this interview from your dashboard in a little while."
            : "We're analyzing your transcript and putting together your scorecard. This usually takes under a minute."
        }
      />
    </Shell>
  );
}
