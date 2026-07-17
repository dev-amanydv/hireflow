import { useCallback, useEffect, useState } from "react";
import { Link, useRouteLoaderData } from "react-router";
import axios from "axios";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { Button } from "~/components/ui/button";
import EmptyState from "../EmptyState";
import ReportView from "./ReportView";
import ReportHeader from "./ReportHeader";
import AnalysisStages from "./AnalysisStages";
import { useAnalysisStages } from "./stages";
import { BACKEND_URL } from "~/lib/config";
import type { loader as rootLoader } from "~/root";
import { isSettled, type AnalysisRow } from "./types";

const POLL_MS = 3000;

/** Mirrors the finding list's real rhythm: tag line, title, body, occasional before/after. */
function FindingsSkeleton() {
  const rows = [
    { body: 2, diff: true },
    { body: 1, diff: false },
    { body: 2, diff: false },
    { body: 1, diff: false },
  ];
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="ln-eyebrow">What to fix</h2>
        <div className="skeleton-shimmer h-5 w-28 rounded-full bg-muted" />
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="skeleton-shimmer h-3 w-24 rounded bg-muted" />
            <div className="skeleton-shimmer mt-2.5 h-3.5 w-2/5 rounded bg-muted" />
            <div className="skeleton-shimmer mt-2.5 h-2.5 w-full rounded bg-muted" />
            {row.body > 1 && <div className="skeleton-shimmer mt-1.5 h-2.5 w-4/5 rounded bg-muted" />}
            {row.diff && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="skeleton-shimmer h-14 rounded-lg bg-muted" />
                <div className="skeleton-shimmer h-14 rounded-lg bg-muted" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** First paint, before we know whether the row is running or already settled. */
function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="ln-lift overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 p-5">
          <div className="skeleton-shimmer h-3 w-52 rounded bg-muted" />
          <div className="flex items-end gap-4">
            <div className="skeleton-shimmer h-9 w-16 rounded bg-muted" />
            <div className="mb-1 flex-1">
              <div className="skeleton-shimmer h-3.5 w-24 rounded bg-muted" />
              <div className="skeleton-shimmer mt-1.5 h-2.5 w-56 rounded bg-muted" />
            </div>
          </div>
          <div className="skeleton-shimmer h-1.5 w-full rounded-full bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-border p-3 sm:grid-cols-3 lg:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-1.5 px-2 py-1.5">
              <div className="skeleton-shimmer h-2.5 w-full rounded bg-muted" />
              <div className="skeleton-shimmer h-1 w-full rounded-full bg-muted" />
              <div className="skeleton-shimmer h-2 w-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <FindingsSkeleton />
    </div>
  );
}

/** The analysis is running. The header is real — only the score and findings are pending. */
function ReportPending({ row }: { row: AnalysisRow }) {
  const stages = useAnalysisStages(row.status);
  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        name={row.name}
        targetRole={row.targetRole}
        targetExperience={row.targetExperience}
        score={null}
      >
        <AnalysisStages stages={stages} />
      </ReportHeader>
      <FindingsSkeleton />
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
    <div className="flex flex-col gap-6">
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
        <ReportPending row={row} />
      ) : row.report ? (
        <ReportView report={row.report} name={row.name} />
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
