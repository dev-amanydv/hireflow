import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check as CheckIcon, Minus, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { bandMeta, SCORE_THRESHOLDS } from "./scoring";
import type { CategoryScore, Check } from "./types";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

function useCountUp(target: number | null, duration = 900): number | null {
  const [value, setValue] = useState<number | null>(target == null ? null : 0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (target == null) {
      setValue(null);
      return;
    }
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(target * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

function ScoreMeter({ score }: { score: number | null }) {
  const meta = bandMeta(score);
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));

  return (
    <div className="w-full">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-score-track">
        {score == null ? (
          <div className="ln-scan absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        ) : (
          <div
            className={cn("h-full rounded-full", meta.fill)}
            style={{ width: `${pct}%`, transition: "width 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        )}
        {[SCORE_THRESHOLDS.mixed, SCORE_THRESHOLDS.strong].map((t) => (
          <span
            key={t}
            aria-hidden
            className="absolute inset-y-0 w-px bg-card"
            style={{ left: `${t}%` }}
          />
        ))}
      </div>
      <div className="relative mt-1.5 h-3 text-[10px] tabular-nums text-ink-tertiary">
        {[SCORE_THRESHOLDS.mixed, SCORE_THRESHOLDS.strong].map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: `${t}%` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function CheckStatusIcon({ status }: { status: Check["status"] }) {
  if (status === "pass") return <CheckIcon className="size-3.5 shrink-0 text-score-strong" />;
  if (status === "warn") return <Minus className="size-3.5 shrink-0 text-sev-important" />;
  return <X className="size-3.5 shrink-0 text-sev-critical" />;
}

function CategoryCell({
  cat,
  open,
  onToggle,
}: {
  cat: CategoryScore;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = bandMeta(cat.score);
  const hasChecks = cat.checks.length > 0;

  return (
    <button
      type="button"
      onClick={hasChecks ? onToggle : undefined}
      aria-expanded={hasChecks ? open : undefined}
      disabled={!hasChecks}
      className={cn(
        "group flex flex-col gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors",
        hasChecks ? "cursor-pointer hover:bg-muted/60" : "cursor-default",
        open && "bg-muted/60",
      )}
    >
      <span className="flex items-baseline justify-between gap-1.5">
        <span className="truncate text-[11px] font-medium text-ink-subtle">{cat.label}</span>
        <span className={cn("ln-mono text-xs font-semibold tabular-nums", meta.text)}>
          {Math.round(cat.score)}
        </span>
      </span>
      <span className="block h-1 overflow-hidden rounded-full bg-score-track">
        <span
          className={cn("block h-full rounded-full", meta.fill)}
          style={{
            width: `${Math.max(0, Math.min(100, cat.score))}%`,
            transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </span>
      <span className="flex items-center gap-1 text-[10px] text-ink-tertiary">
        {Math.round(cat.weight * 100)}% weight
        {hasChecks && (
          <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
        )}
      </span>
    </button>
  );
}

export default function ReportHeader({
  name,
  targetRole,
  targetExperience,
  hasJd,
  score,
  categories,
  engine,
  children,
}: {
  name?: string;
  targetRole: string | null;
  targetExperience?: string | null;
  hasJd?: boolean;
  score: number | null;
  categories?: CategoryScore[];
  engine?: { deterministic: string; judge: string };
  children?: React.ReactNode;
}) {
  const [openCat, setOpenCat] = useState<string | null>(null);
  const shown = useCountUp(score);
  const meta = bandMeta(score);

  const target = targetRole
    ? [targetRole, targetExperience, hasJd ? "job description" : null].filter(Boolean).join(" · ")
    : "General review";

  return (
    <header className="ln-lift overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="truncate font-medium text-foreground">{name ?? "Your resume"}</span>
          <span className="text-ink-tertiary">·</span>
          <span className="truncate text-ink-subtle">{target}</span>
        </div>

        <div className="flex items-end gap-4">
          <span className="flex items-baseline gap-1">
            {score == null ? (
              <span className="skeleton-shimmer block h-9 w-14 rounded-md bg-muted" />
            ) : (
              <span
                className={cn("ln-mono text-4xl font-semibold tabular-nums", meta.text)}
                style={{ letterSpacing: "-0.03em" }}
              >
                {shown}
              </span>
            )}
            <span className="text-xs text-ink-tertiary">/100</span>
          </span>
          <span className="mb-1 min-w-0 flex-1">
            <span
              className={cn("block text-sm font-medium", score == null ? "text-ink-subtle" : meta.text)}
            >
              {score == null ? "Analyzing…" : meta.verdict}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-ink-tertiary">
              {engine
                ? `Weighted blend of ${engine.deterministic} + ${engine.judge}`
                : "Deterministic ATS checks + AI content review"}
            </span>
          </span>
        </div>

        <ScoreMeter score={score} />
      </div>

      {children}

      {categories?.length ? (
        <div className="border-t border-border">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <CategoryCell
                key={c.category}
                cat={c}
                open={openCat === c.category}
                onToggle={() => setOpenCat((v) => (v === c.category ? null : c.category))}
              />
            ))}
          </div>

          {categories.map((c) =>
            openCat === c.category && c.checks.length ? (
              <div key={c.category} className="ln-fade border-t border-border bg-muted/30 px-5 py-4">
                <p className="mb-3 text-xs font-medium text-foreground">
                  {c.label}
                  {c.summary && <span className="ml-2 font-normal text-ink-subtle">{c.summary}</span>}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {c.checks.map((check) => (
                    <li key={check.id} className="flex items-start gap-2.5">
                      <span className="mt-0.5">
                        <CheckStatusIcon status={check.status} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-foreground">
                          {check.label}
                          <span className="ml-1.5 font-normal text-ink-tertiary">
                            {check.points}/{check.maxPoints}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-subtle">
                          {check.detail}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </header>
  );
}
