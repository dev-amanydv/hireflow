import { Link } from "react-router";
import { ArrowRight, FileText, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useCountUp } from "./useCountUp";
import type { ProfileResume } from "./types";

export function ResumeInsightCard({ resume }: { resume: ProfileResume }) {
  const score = useCountUp(resume?.overallScore ?? null);

  return (
    <div className="ln-lift ln-rise flex h-full flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="ln-eyebrow">Resume</span>
          <h3 className="mt-1 text-sm font-semibold text-foreground">
            {resume ? "Current resume" : "No resume analyzed yet"}
          </h3>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-4" />
        </span>
      </div>

      {resume ? (
        <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40">
              <span className="ln-mono text-lg font-semibold tabular-nums text-foreground">
                {resume.overallScore != null ? Math.round(score) : "—"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{resume.name}</p>
              <p className="mt-0.5 text-xs text-ink-tertiary">ATS score</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 self-start">
            <Link to="/dashboard/resume">
              Update Resume
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
          <p className="text-xs leading-relaxed text-ink-subtle">
            Upload your resume to get a transparent ATS score and concrete
            improvements before you apply.
          </p>
          <Button asChild size="sm" className="gap-1.5 self-start">
            <Link to="/dashboard/resume">
              <Upload className="size-3.5" />
              Analyze Resume
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export function ResumeInsightCardSkeleton() {
  return (
    <div className="ln-lift flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="skeleton-shimmer h-9 w-9 rounded-lg bg-muted" />
      <div className="skeleton-shimmer h-4 w-32 rounded bg-muted" />
      <div className="skeleton-shimmer h-14 w-14 rounded-full bg-muted" />
    </div>
  );
}
