import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import { activeStageLabel, type Stage } from "./stages";

function StageGlyph({ state }: { state: Stage["state"] }) {
  if (state === "done") {
    return (
      <span className="relative z-10 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="relative z-10 flex size-4 items-center justify-center rounded-full border border-primary bg-card">
        <span className="ln-stage-pulse size-1.5 rounded-full bg-primary" />
      </span>
    );
  }
  return (
    <span className="relative z-10 flex size-4 items-center justify-center rounded-full border border-border bg-card">
      <span className="size-1.5 rounded-full bg-border" />
    </span>
  );
}

export default function AnalysisStages({ stages }: { stages: Stage[] }) {
  const active = activeStageLabel(stages);

  return (
    <div className="border-t border-border bg-muted/30 px-5 py-4">
      <ol className="relative flex flex-col gap-2.5">
        {stages.map((stage, i) => (
          <li key={stage.id} className="relative flex items-start gap-2.5">
            {i < stages.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[7px] top-4 h-[calc(100%+0.625rem-1rem)] w-px",
                  stage.state === "done" ? "bg-primary/40" : "bg-border",
                )}
              />
            )}
            <StageGlyph state={stage.state} />
            <span
              className={cn(
                "text-xs transition-colors",
                stage.state === "pending" && "text-ink-tertiary",
                stage.state === "active" && "font-medium text-foreground",
                stage.state === "done" && "text-ink-subtle",
              )}
            >
              {stage.label}
            </span>
          </li>
        ))}
      </ol>

      <p aria-live="polite" className="sr-only">
        {active ? `${active}. Analysis in progress.` : "Analysis complete."}
      </p>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-tertiary">
        Takes a minute or two.{" "}
        <span className="text-ink-subtle">You can close this page</span> — the analysis keeps
        running and the finished report lands in your history.
      </p>
    </div>
  );
}
