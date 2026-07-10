import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";

const PROGRESS_STEPS = [
  "Uploading your resume",
  "Parsing your resume",
  "Scanning GitHub & links",
  "Summarizing your experience",
  "Assembling your profile",
] as const;

const LAST_STEP = PROGRESS_STEPS.length - 1;
const STEP_DURATION = 1600;

function Bar({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton-shimmer rounded-md bg-muted", className)} />
  );
}

function ProgressStep({
  label,
  state,
}: {
  label: string;
  state: "done" | "active" | "pending";
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-500",
          state === "done" && "border-foreground bg-foreground text-background",
          state === "active" && "border-foreground/40 text-foreground",
          state === "pending" && "border-border bg-muted/60 text-transparent"
        )}
      >
        {state === "done" ? (
          <Check className="size-3" strokeWidth={3} />
        ) : state === "active" ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        )}
      </span>
      <span
        className={cn(
          "text-[13px] transition-colors duration-500",
          state === "done" && "text-foreground/60",
          state === "active" && "font-medium text-foreground",
          state === "pending" && "text-muted-foreground/50"
        )}
      >
        {label}
      </span>
    </li>
  );
}

export default function PreviewSkeleton({
  error,
  onBack,
}: {
  error: boolean;
  onBack: () => void;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (error || current >= LAST_STEP) return;
    const id = setTimeout(() => setCurrent((c) => Math.min(c + 1, LAST_STEP)), STEP_DURATION);
    return () => clearTimeout(id);
  }, [error, current]);

  if (error) {
    return (
      <div role="alert">
        <div className="mb-6">
          <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Step 03 — Review
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[27px]">
            We hit a snag
          </h1>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Couldn't prepare your profile</p>
            <p className="mx-auto max-w-sm text-[13px] text-muted-foreground">
              Something went wrong while reading your resume and GitHub. Head back
              and try again.
            </p>
          </div>
          <Button type="button" variant="outline" className="mt-1 gap-2" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back to session
          </Button>
        </div>
      </div>
    );
  }

  const pct = Math.round(((current + 0.5) / PROGRESS_STEPS.length) * 100);

  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6">
        <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Step 03 — Review
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[27px]">
          Building your profile…
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We're reading your resume and GitHub to tailor the interview. This
          takes a moment.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-4 pt-4 pb-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Preparing your session
            </span>
            <span className="text-[11px] tabular-nums tracking-[0.04em] text-muted-foreground">
              {pct}%
            </span>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <ol className="space-y-3.5 px-4 py-4">
          {PROGRESS_STEPS.map((label, i) => (
            <ProgressStep
              key={label}
              label={label}
              state={i < current ? "done" : i === current ? "active" : "pending"}
            />
          ))}
        </ol>
      </div>

      <div className="mt-3.5 overflow-hidden rounded-2xl border">
        <div className="flex items-center justify-between border-b px-4 py-3.5">
          <Bar className="h-3 w-10" />
          <Bar className="h-3.5 w-40" />
        </div>
        <div className="flex">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "flex flex-1 items-center justify-between px-4 py-3.5",
                i < 2 && "border-r"
              )}
            >
              <Bar className="h-3 w-12" />
              <Bar className="h-3.5 w-10" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <Bar className="h-3 w-28" />
          <Bar className="h-3 w-40" />
        </div>
        <div className="rounded-2xl border p-4">
          <div className="flex items-start gap-3.5">
            <Bar className="size-[46px] shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2.5 pt-1">
              <Bar className="h-4 w-44" />
              <Bar className="h-3.5 w-56" />
              <div className="flex gap-3.5 pt-1">
                <Bar className="h-3.5 w-32" />
                <Bar className="h-3.5 w-32" />
              </div>
            </div>
            <Bar className="h-8 w-16 shrink-0 rounded-md" />
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2 border-t pt-3.5">
            <Bar className="h-7 w-24 rounded-full" />
            <Bar className="h-7 w-32 rounded-full" />
            <Bar className="h-7 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2.5">
        <Bar className="h-13 w-full rounded-md" />
        <Bar className="h-3 w-48" />
      </div>
    </div>
  );
}
