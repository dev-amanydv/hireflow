import { useMemo, useState } from "react";
import { ArrowRight, Check as CheckIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import ReportHeader from "./ReportHeader";
import { SEVERITY_META, SEVERITY_ORDER } from "./scoring";
import type { AnalysisReport, Finding, KeywordMatch, Severity } from "./types";

function SeverityTag({ severity }: { severity: Severity }) {
  const meta = SEVERITY_META[severity];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium", meta.text)}>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-hairline-strong">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <SeverityTag severity={finding.severity} />
        <span className="text-ink-tertiary">·</span>
        <span className="text-[11px] text-ink-tertiary">{finding.category}</span>
      </div>

      <h3 className="mt-1.5 text-sm font-medium text-foreground">{finding.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-subtle">{finding.suggestion}</p>

      {finding.evidence && !finding.before && (
        <p className="mt-2.5 rounded-lg bg-muted/60 px-3 py-2 text-xs italic leading-relaxed text-ink-subtle">
          “{finding.evidence}”
        </p>
      )}

      {finding.before && finding.after && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
          <div className="rounded-lg border border-border bg-muted/50 p-2.5">
            <p className="mb-1 text-[10px] font-medium text-ink-tertiary">Before</p>
            <p className="text-xs leading-relaxed text-ink-subtle line-through decoration-ink-tertiary/40">
              {finding.before}
            </p>
          </div>
          <div className="hidden items-center justify-center sm:flex">
            <ArrowRight className="size-3.5 text-ink-tertiary" />
          </div>
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-2.5">
            <p className="mb-1 text-[10px] font-medium text-primary">After</p>
            <p className="text-xs leading-relaxed text-foreground">{finding.after}</p>
          </div>
        </div>
      )}
    </article>
  );
}

function FindingsSection({ findings }: { findings: Finding[] }) {
  const [filter, setFilter] = useState<Severity | "all">("all");

  const counts = useMemo(() => {
    const c = { critical: 0, important: 0, minor: 0 } as Record<Severity, number>;
    for (const f of findings) c[f.severity] += 1;
    return c;
  }, [findings]);

  const visible = filter === "all" ? findings : findings.filter((f) => f.severity === filter);
  const present = SEVERITY_ORDER.filter((s) => counts[s] > 0);

  if (!findings.length) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="ln-eyebrow">What to fix</h2>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckIcon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Nothing to fix</p>
            <p className="mt-0.5 text-xs text-ink-subtle">
              Every check passed. This resume is in good shape for the target you picked.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="ln-eyebrow">What to fix</h2>
        <div className="flex flex-wrap items-center gap-1">
          <FilterChip
            label="All"
            count={findings.length}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {present.map((s) => (
            <FilterChip
              key={s}
              label={SEVERITY_META[s].label}
              count={counts[s]}
              active={filter === s}
              dot={SEVERITY_META[s].dot}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map((f, i) => (
          <FindingCard key={`${f.title}-${i}`} finding={f} />
        ))}
      </div>
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  dot,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-ink-subtle hover:bg-muted hover:text-foreground",
      )}
    >
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full", dot, active && "opacity-70")} />}
      {label}
      <span className={cn("tabular-nums", active ? "opacity-60" : "text-ink-tertiary")}>{count}</span>
    </button>
  );
}

function KeywordSection({ kw }: { kw: KeywordMatch }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="ln-eyebrow">Keyword match</h2>
        <span className="text-[11px] tabular-nums text-ink-tertiary">
          {kw.coverage}% of expected skills covered
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-2 p-4">
          <p className="text-[11px] font-medium text-ink-subtle">
            Missing <span className="tabular-nums text-ink-tertiary">({kw.missing.length})</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {kw.missing.length ? (
              kw.missing.map((k) => (
                <span
                  key={k}
                  className="rounded-md border border-sev-important/30 bg-sev-important/[0.07] px-2 py-0.5 text-xs text-foreground"
                >
                  {k}
                </span>
              ))
            ) : (
              <span className="text-xs text-ink-tertiary">Nothing critical missing.</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-4">
          <p className="text-[11px] font-medium text-ink-subtle">
            Matched <span className="tabular-nums text-ink-tertiary">({kw.matched.length})</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {kw.matched.length ? (
              kw.matched.map((k) => (
                <span
                  key={k}
                  className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs text-ink-subtle"
                >
                  {k}
                </span>
              ))
            ) : (
              <span className="text-xs text-ink-tertiary">None matched.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ReportView({ report, name }: { report: AnalysisReport; name?: string }) {
  return (
    <div className="ln-fade flex flex-col gap-6">
      <ReportHeader
        name={name}
        targetRole={report.target.role}
        targetExperience={report.target.experience}
        hasJd={report.target.hasJd}
        score={report.overallScore}
        categories={report.categories}
        engine={report.engine}
      />
      <FindingsSection findings={report.findings} />
      {report.keyword && <KeywordSection kw={report.keyword} />}
    </div>
  );
}
