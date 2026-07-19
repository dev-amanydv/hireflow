import { Link } from "react-router";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import EmptyState from "../EmptyState";
import { cn } from "~/lib/utils";
import { bandMeta } from "./scoring";
import { GENERAL_TARGET_LABEL, type AnalysisListItem } from "./types";

function relativeDate(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const mins = Math.round((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  if (mins < 60 * 24 * 7) return `${Math.round(mins / (60 * 24))}d ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatusPill({ status }: { status: string }) {
  if (status === "COMPLETE") return null;
  if (status === "FAILED") {
    return (
      <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
      <Loader2 className="size-2.5 animate-spin" />
      In progress
    </span>
  );
}

function HistoryRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="skeleton-shimmer size-10 shrink-0 rounded-lg bg-muted" />
      <div className="min-w-0 flex-1">
        <div className="skeleton-shimmer h-3.5 w-40 rounded bg-muted" />
        <div className="skeleton-shimmer mt-2 h-3 w-24 rounded bg-muted" />
      </div>
      <div className="skeleton-shimmer h-6 w-8 rounded bg-muted" />
    </div>
  );
}

export default function AnalysisHistory({
  items,
  loading,
}: {
  items: AnalysisListItem[];
  loading: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="ln-eyebrow">Past analyses</h2>
        {!loading && items.length > 0 && (
          <span className="text-xs text-ink-tertiary">
            {items.length} {items.length === 1 ? "analysis" : "analyses"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          <HistoryRowSkeleton />
          <HistoryRowSkeleton />
          <HistoryRowSkeleton />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No analyses yet"
          description="Your past reports will collect here, so you can watch your score climb as you iterate."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/dashboard/resume/${item.id}`}
              className="ln-lift group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-ink-subtle transition-colors group-hover:text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-subtle">
                  <span className="truncate">{item.targetRole ?? GENERAL_TARGET_LABEL}</span>
                  <span className="text-ink-tertiary">·</span>
                  <span className="text-ink-tertiary">{relativeDate(item.createdAt)}</span>
                  <StatusPill status={item.status} />
                </div>
              </div>
              <span
                className={cn(
                  "ln-mono text-xl font-semibold tabular-nums",
                  bandMeta(item.overallScore).text,
                )}
              >
                {item.overallScore != null ? Math.round(item.overallScore) : "—"}
              </span>
              <ArrowRight className="size-4 shrink-0 text-ink-tertiary transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
