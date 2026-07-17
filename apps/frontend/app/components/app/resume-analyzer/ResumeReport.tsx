import { useCallback, useEffect, useState } from "react";
import { Link, useRouteLoaderData } from "react-router";
import axios from "axios";
import { ArrowLeft, ArrowRight, FileText, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import EmptyState from "../EmptyState";
import ReportView from "./ReportView";
import { BACKEND_URL } from "~/lib/config";
import type { loader as rootLoader } from "~/root";
import { GENERAL_TARGET_LABEL, isSettled, type AnalysisRow } from "./types";

const POLL_MS = 3000;

function ScoringState({ name, targetRole }: { name?: string; targetRole: string | null }) {
  return (
    <div className="ln-lift ln-rise flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-20 text-center">
      <span className="relative flex size-12 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <span className="relative flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </span>
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">Running the analysis</p>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-subtle">
          Scoring {name ? <span className="text-foreground">{name}</span> : "your resume"} against{" "}
          {targetRole ?? GENERAL_TARGET_LABEL.toLowerCase()} with deterministic ATS checks plus an
          AI content review. This usually takes a minute or two — it keeps running even if you
          leave, and the result lands in your history.
        </p>
      </div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="ln-indeterminate h-full w-1/3 rounded-full bg-primary" />
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="ln-lift flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:gap-8">
        <div className="skeleton-shimmer size-32 shrink-0 rounded-full bg-muted" />
        <div className="w-full flex-1">
          <div className="skeleton-shimmer h-3 w-20 rounded bg-muted" />
          <div className="skeleton-shimmer mt-3 h-7 w-40 rounded bg-muted" />
          <div className="skeleton-shimmer mt-3 h-3 w-full rounded bg-muted" />
          <div className="skeleton-shimmer mt-2 h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function ResumeReport({ id }: { id: string }) {
  const signedIn = Boolean(useRouteLoaderData<typeof rootLoader>("root")?.user);
  const [row, setRow] = useState<AnalysisRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchRow = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/resume/${id}`, { withCredentials: true });
      const data: AnalysisRow | undefined = res.data?.data?.analysis;
      if (!data) {
        setNotFound(true);
        return;
      }
      setRow(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setRow(null);
    fetchRow();
  }, [fetchRow]);

  useEffect(() => {
    if (!row || isSettled(row.status)) return;
    const t = setInterval(fetchRow, POLL_MS);
    return () => clearInterval(t);
  }, [row, fetchRow]);

  const settled = row ? isSettled(row.status) : false;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/dashboard/resume"
          className="inline-flex items-center gap-1.5 text-sm text-ink-subtle transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {signedIn ? "All analyses" : "Back to analyzer"}
        </Link>
        <Button asChild variant="outline">
          <Link to="/dashboard/resume">
            Analyze another <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <ReportSkeleton />
      ) : notFound || !row ? (
        <EmptyState
          icon={FileText}
          title="Analysis not found"
          description="This report doesn't exist, or it belongs to another account."
          action={
            <Button asChild variant="outline">
              <Link to="/dashboard/resume">Back to analyses</Link>
            </Button>
          }
        />
      ) : row.status === "FAILED" ? (
        <EmptyState
          icon={FileText}
          title="This analysis failed"
          description={row.error ?? "We couldn't finish reading this resume. Try uploading it again."}
          action={
            <Button asChild>
              <Link to="/dashboard/resume">Try another resume</Link>
            </Button>
          }
        />
      ) : !settled ? (
        <ScoringState name={row.name} targetRole={row.targetRole} />
      ) : row.report ? (
        <ReportView report={row.report} />
      ) : (
        <EmptyState
          icon={FileText}
          title="Report unavailable"
          description="This analysis completed but didn't produce a report. Try running it again."
          action={
            <Button asChild variant="outline">
              <Link to="/dashboard/resume">Analyze again</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
