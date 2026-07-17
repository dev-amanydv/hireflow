import { FileUp, ShieldCheck, Sparkles, Target } from "lucide-react";
import { cn } from "~/lib/utils";

const STEPS = [
  {
    icon: FileUp,
    title: "Drop your PDF",
    detail: "Parsed in about 20 seconds — text, sections and linked work.",
  },
  {
    icon: Target,
    title: "Choose a target",
    detail: "A general review, or score against a specific role and job post.",
  },
  {
    icon: Sparkles,
    title: "Get your score",
    detail: "A weighted breakdown with evidence-backed rewrites, not a black box.",
  },
];

export default function ResumeHero({ latestScore }: { latestScore: number | null }) {
  return (
    <section className="ln-rise relative isolate overflow-hidden rounded-2xl border border-border bg-card">
      
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-40 -z-10 size-[30rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 45%, transparent), transparent 70%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-48 right-1/4 -z-10 size-96 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--chart-2) 30%, transparent), transparent 70%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4] dark:opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 70% 90% at 85% 0%, black, transparent 75%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-card via-card/70 to-transparent"
      />

      <div className="absolute right-4 top-4 hidden items-center gap-2.5 rounded-lg border border-border bg-card/80 px-3 py-2 shadow-sm backdrop-blur-sm lg:flex">
        <span className="flex size-7 items-center justify-center rounded-md bg-muted text-foreground">
          <ShieldCheck className="size-4" />
        </span>
        <span className="leading-tight">
          {latestScore != null ? (
            <>
              <span className="ln-mono block text-xs font-semibold tabular-nums text-foreground">
                {Math.round(latestScore)} / 100
              </span>
              <span className="block text-[11px] text-ink-tertiary">Latest ATS score</span>
            </>
          ) : (
            <>
              <span className="block text-xs font-semibold text-foreground">Beat the bots</span>
              <span className="block text-[11px] text-ink-tertiary">before you apply</span>
            </>
          )}
        </span>
      </div>

      <div className="relative flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3">
          <h1 className="max-w-md text-balance text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
            Most resumes are rejected before a human{" "}
            <span className="text-primary">ever reads them.</span>
          </h1>
          <p className="max-w-lg text-xs leading-relaxed text-ink-subtle sm:text-sm">
            Upload yours below and see exactly where it loses points — scored the way an
            applicant tracking system reads it.
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className={cn(
                "relative flex items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-3 backdrop-blur-sm",
                "sm:flex-col sm:gap-2.5",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="ln-mono flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-ink-subtle">
                  {i + 1}
                </span>
                <step.icon className="size-4 shrink-0 text-primary sm:hidden" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <step.icon className="hidden size-4 shrink-0 text-primary sm:block" />
                  <span className="text-sm font-medium text-foreground">{step.title}</span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-subtle">
                  {step.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
