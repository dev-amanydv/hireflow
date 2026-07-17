import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import ProductSection from "./ProductSection";
import { CountUpScore } from "./illustrations";

/**
 * Resume analyzer. Instead of one opaque grade, this teaches the actual scoring
 * model: a weighted blend of deterministic ATS rules and an AI content judge,
 * every category weighted and visible, feeding one transparent score.
 */

// Weights mirror the real composite in the backend (ats/composite.ts).
const CATEGORIES = [
  { label: "Parseability", weight: 0.2, score: 96, engine: "rules" },
  { label: "Contact", weight: 0.1, score: 100, engine: "rules" },
  { label: "Structure", weight: 0.1, score: 90, engine: "rules" },
  { label: "Impact & writing", weight: 0.2, score: 78, engine: "rules" },
  { label: "Keyword match", weight: 0.25, score: 79, engine: "AI" },
  { label: "Content review", weight: 0.15, score: 82, engine: "AI" },
];

const PIPELINE = ["Parse", "Rules", "Keywords", "AI judge", "Score"];

function scoreColor(score: number) {
  if (score >= 85) return "var(--score-strong)";
  if (score >= 70) return "var(--score-mixed)";
  return "var(--score-weak)";
}

function AnalyzerMockup() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* mini pipeline */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PIPELINE.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            <span className="ln-mono rounded-md border border-hairline bg-surface-2 px-2 py-1 text-[11px] text-ink-muted">
              {step}
            </span>
            {i < PIPELINE.length - 1 && (
              <ChevronRight className="size-3.5 text-ink-tertiary" />
            )}
          </span>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        {/* weighted categories */}
        <div className="flex flex-col gap-3 sm:order-1">
          {CATEGORIES.map((c, i) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-[12.5px] text-ink-muted">
                {c.label}
              </span>
              <span
                className={`ln-mono rounded px-1.5 py-0.5 text-[10px] ${
                  c.engine === "AI"
                    ? "bg-brand/10 text-brand"
                    : "bg-surface-2 text-ink-tertiary"
                }`}
                title={`${(c.weight * 100).toFixed(0)}% of the score`}
              >
                {c.weight.toFixed(2)}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-score-track">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: scoreColor(c.score) }}
                  initial={{ width: reduce ? `${c.score}%` : "0%" }}
                  whileInView={{ width: `${c.score}%` }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }
                  }
                />
              </div>
              <span className="ln-mono w-7 text-right text-[11px] text-foreground">
                {c.score}
              </span>
            </div>
          ))}
        </div>

        {/* overall */}
        <div className="flex flex-row items-center gap-4 border-t border-border pt-5 sm:order-2 sm:flex-col sm:gap-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <CountUpScore value={84} label="ATS score" />
          <div className="flex flex-col gap-2 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="ln-mono text-ink-tertiary">keywords</span>
              <span className="text-foreground">11 / 14 matched</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="ln-mono text-ink-tertiary">engine</span>
              <span className="text-ink-muted">rules + AI judge</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResumeAnalyzerShowcase() {
  return (
    <ProductSection
      align="right"
      label="2.0  Resume"
      title="Know exactly why you scored the way you did"
      description="Every number traces back to a check you can read. Hireflow blends deterministic ATS rules with an AI content review — each category weighted and shown — so there's no black-box grade and no vague encouragement."
    >
      <AnalyzerMockup />
    </ProductSection>
  );
}
