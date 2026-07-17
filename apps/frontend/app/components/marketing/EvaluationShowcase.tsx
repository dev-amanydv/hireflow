import { motion, useReducedMotion } from "motion/react";
import ProductSection from "./ProductSection";
import { CountUpScore, RadarChart } from "./illustrations";

/**
 * Evaluation feature. The four fixed competency dimensions plotted on a radar,
 * an overall score, and a seniority-relative band — reinforcing that scoring is
 * evidence-grounded and calibrated to the level you targeted, not absolute.
 */

const DIMENSIONS = [
  { label: "Technical Depth", value: 82 },
  { label: "Problem-Solving", value: 88 },
  { label: "Communication", value: 74 },
  { label: "Practical Application", value: 80 },
];

const STRENGTHS = ["Idempotency & retry design", "Clear articulation of tradeoffs"];
const GROWTH = ["Quantify impact in answers", "Go deeper on failure modes"];

function EvaluationMockup() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center"
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* radar */}
      <div className="grid place-items-center">
        <RadarChart
          values={DIMENSIONS.map((d) => d.value)}
          labels={["Tech", "Problem", "Comms", "Applied"]}
          size={230}
        />
      </div>

      {/* score + band + evidence */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <CountUpScore value={84} label="overall" />
          <div className="flex flex-col gap-1.5">
            <span className="w-fit rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[12.5px] font-medium text-brand">
              Strong for Senior
            </span>
            <span className="text-[12px] text-ink-subtle">
              Banded against the level you targeted.
            </span>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="ln-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
              Strengths
            </span>
            {STRENGTHS.map((s) => (
              <div key={s} className="flex items-start gap-2 text-[12.5px] text-ink-muted">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-score-strong" />
                {s}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="ln-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
              Grow next
            </span>
            {GROWTH.map((g) => (
              <div key={g} className="flex items-start gap-2 text-[12.5px] text-ink-muted">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-sev-important" />
                {g}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function EvaluationShowcase() {
  return (
    <ProductSection
      label="3.0  Evaluation"
      title="A score you can act on, backed by evidence"
      description="Every interview is graded across four fixed dimensions, each drawn from quoted moments in your transcript. The overall band is relative to your target seniority — with strengths, growth areas, and a study plan attached."
    >
      <EvaluationMockup />
    </ProductSection>
  );
}
