import { useState } from "react";
import {
  AlertTriangle,
  Check as CheckIcon,
  ChevronDown,
  CircleAlert,
  Info,
  Minus,
  X,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type {
  AnalysisReport,
  CategoryScore,
  Check,
  Finding,
  Severity,
} from "./types";

function scoreTone(score: number): { text: string; ring: string; bar: string } {
  if (score >= 80) return { text: "text-emerald-600", ring: "text-emerald-500", bar: "bg-emerald-500" };
  if (score >= 60) return { text: "text-amber-600", ring: "text-amber-500", bar: "bg-amber-500" };
  return { text: "text-red-600", ring: "text-red-500", bar: "bg-red-500" };
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const tone = scoreTone(score);
  const offset = c - (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className="relative flex size-32 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="text-muted" stroke="currentColor" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={tone.ring}
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("ln-mono text-3xl font-semibold tabular-nums", tone.text)}>{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-ink-tertiary">of 100</span>
      </div>
    </div>
  );
}

function CheckStatusIcon({ status }: { status: Check["status"] }) {
  if (status === "pass") return <CheckIcon className="size-4 shrink-0 text-emerald-500" />;
  if (status === "warn") return <Minus className="size-4 shrink-0 text-amber-500" />;
  return <X className="size-4 shrink-0 text-red-500" />;
}

function CategoryRow({ cat }: { cat: CategoryScore }) {
  const [open, setOpen] = useState(false);
  const tone = scoreTone(cat.score);
  const hasChecks = cat.checks.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => hasChecks && setOpen((v) => !v)}
        className={cn("flex w-full items-center gap-4 px-4 py-3 text-left", hasChecks && "cursor-pointer")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">{cat.label}</span>
            <span className="text-[11px] text-ink-tertiary">{Math.round(cat.weight * 100)}% weight</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-[width] duration-500", tone.bar)} style={{ width: `${cat.score}%` }} />
          </div>
          {cat.summary && <p className="mt-2 text-xs leading-relaxed text-ink-subtle">{cat.summary}</p>}
        </div>
        <span className={cn("ln-mono w-10 shrink-0 text-right text-lg font-semibold tabular-nums", tone.text)}>{cat.score}</span>
        {hasChecks && (
          <ChevronDown className={cn("size-4 shrink-0 text-ink-tertiary transition-transform", open && "rotate-180")} />
        )}
      </button>

      {open && hasChecks && (
        <div className="border-t border-border px-4 py-3">
          <ul className="flex flex-col gap-2.5">
            {cat.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-2.5">
                <CheckStatusIcon status={c.status} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{c.label}</p>
                  <p className="text-xs leading-relaxed text-ink-subtle">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const SEVERITY_META: Record<Severity, { label: string; badge: "destructive" | "secondary" | "outline"; icon: typeof CircleAlert }> = {
  critical: { label: "Critical", badge: "destructive", icon: CircleAlert },
  important: { label: "Important", badge: "secondary", icon: AlertTriangle },
  minor: { label: "Minor", badge: "outline", icon: Info },
};

function FindingCard({ finding }: { finding: Finding }) {
  const meta = SEVERITY_META[finding.severity];
  const Icon = meta.icon;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-ink-tertiary" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{finding.title}</span>
            <Badge variant={meta.badge}>{meta.label}</Badge>
            <span className="text-[11px] text-ink-tertiary">{finding.category}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-subtle">{finding.suggestion}</p>

          {finding.evidence && !finding.before && (
            <p className="mt-2 border-l-2 border-border pl-3 text-xs italic text-ink-tertiary">“{finding.evidence}”</p>
          )}

          {finding.before && finding.after && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-600/80">Before</p>
                <p className="text-xs leading-relaxed text-ink-subtle">{finding.before}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600/80">After</p>
                <p className="text-xs leading-relaxed text-foreground">{finding.after}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportView({ report }: { report: AnalysisReport }) {
  const tone = scoreTone(report.overallScore);
  const kw = report.keyword;

  return (
    <div className="flex flex-col gap-6">
      <div className="ln-lift flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:gap-8">
        <ScoreRing score={report.overallScore} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <span className="ln-eyebrow">ATS score</span>
          <h2 className={cn("ln-display-md mt-1", tone.text)}>
            {report.overallScore >= 80 ? "Strong" : report.overallScore >= 60 ? "Needs work" : "At risk"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-subtle">
            {report.target.role ? (
              <>
                Scored against{" "}
                <span className="font-medium text-foreground">{report.target.role}</span>
                {report.target.experience ? ` · ${report.target.experience}` : ""}
                {report.target.hasJd ? " · matched to a job description" : ""}.{" "}
              </>
            ) : (
              <>
                A <span className="font-medium text-foreground">general review</span> — judged on
                formatting, structure and impact rather than against a specific job.{" "}
              </>
            )}
            This score is a transparent weighted blend of deterministic ATS checks and an AI
            content review — expand any category to see exactly why.
          </p>
          <p className="mt-2 text-[11px] text-ink-tertiary">
            Engine: {report.engine.deterministic} + {report.engine.judge}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="ln-eyebrow">Category breakdown</span>
        <div className="flex flex-col gap-2">
          {report.categories.map((c) => (
            <CategoryRow key={c.category} cat={c} />
          ))}
        </div>
      </div>

      {kw && (
        <div className="flex flex-col gap-3">
          <span className="ln-eyebrow">Keyword & skills match · {kw.coverage}% covered</span>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium text-emerald-600">Matched ({kw.matched.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {kw.matched.length ? (
                  kw.matched.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)
                ) : (
                  <span className="text-xs text-ink-tertiary">None matched.</span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium text-red-600">Missing ({kw.missing.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {kw.missing.length ? (
                  kw.missing.map((k) => <Badge key={k} variant="outline">{k}</Badge>)
                ) : (
                  <span className="text-xs text-ink-tertiary">Nothing critical missing.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="ln-eyebrow">How to improve · {report.findings.length} suggestions</span>
        <div className="flex flex-col gap-2.5">
          {report.findings.length ? (
            report.findings.map((f, i) => <FindingCard key={i} finding={f} />)
          ) : (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-ink-subtle">
              No issues found — this resume is in great shape.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
