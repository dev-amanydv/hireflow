import type { Severity } from "./types";

export type ScoreBand = "strong" | "mixed" | "weak";

export const SCORE_THRESHOLDS = { strong: 80, mixed: 60 } as const;

export function scoreBand(score: number): ScoreBand {
  if (score >= SCORE_THRESHOLDS.strong) return "strong";
  if (score >= SCORE_THRESHOLDS.mixed) return "mixed";
  return "weak";
}

export const BAND_META: Record<ScoreBand, { verdict: string; text: string; fill: string }> = {
  strong: { verdict: "Strong", text: "text-score-strong", fill: "bg-score-strong" },
  mixed: { verdict: "Needs work", text: "text-score-mixed", fill: "bg-score-mixed" },
  weak: { verdict: "At risk", text: "text-score-weak", fill: "bg-score-weak" },
};

export function bandMeta(score: number | null) {
  if (score == null) return { verdict: "—", text: "text-ink-tertiary", fill: "bg-muted" };
  return BAND_META[scoreBand(score)];
}

export const SEVERITY_META: Record<
  Severity,
  { label: string; text: string; dot: string; glyph: string; order: number }
> = {
  critical: {
    label: "Critical",
    text: "text-sev-critical",
    dot: "bg-sev-critical",
    glyph: "!",
    order: 0,
  },
  important: {
    label: "Important",
    text: "text-sev-important",
    dot: "bg-sev-important",
    glyph: "▲",
    order: 1,
  },
  minor: { label: "Minor", text: "text-sev-minor", dot: "bg-sev-minor", glyph: "•", order: 2 },
};

export const SEVERITY_ORDER: Severity[] = ["critical", "important", "minor"];
