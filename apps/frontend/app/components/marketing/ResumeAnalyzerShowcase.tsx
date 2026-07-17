import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import ProductSection from "./ProductSection";
import { DrawCheck } from "./illustrations";

const CHECKS = [
  { label: "Quantified impact", note: "3 of 4 bullets include a metric" },
  { label: "Keyword match: Backend", note: "11 of 14 target keywords present" },
  { label: "Action verbs", note: "No passive-voice bullets found" },
  { label: "Length: 1 page", note: "Within range for 6 years of experience" },
];

const SCORE = 84;
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreRing() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const dashOffset = useTransform(
    count,
    (v) => CIRCUMFERENCE * (1 - v / 100),
  );
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      count.set(SCORE);
      setDisplay(SCORE);
      return;
    }
    const controls = animate(count, SCORE, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1] as const,
    });
    const unsub = count.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, reduce, count]);

  return (
    <div ref={ref} className="relative grid size-28 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="var(--score-track)"
          strokeWidth="7"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="var(--score-strong)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[26px] font-semibold tracking-tight text-foreground">
          {display}
        </span>
        <span className="ln-mono text-[9px] uppercase tracking-wider text-ink-tertiary">
          ATS score
        </span>
      </div>
    </div>
  );
}

function AnalyzerMockup() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="ln-lift flex flex-col gap-6 overflow-hidden rounded-xl border border-hairline-strong bg-card p-6 sm:flex-row sm:items-start"
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <ScoreRing />
      <div className="flex flex-1 flex-col gap-3.5 border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
        {CHECKS.map((check, i) => (
          <div key={check.label} className="flex items-start gap-2.5">
            <DrawCheck index={i} />
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-foreground">
                {check.label}
              </div>
              <div className="text-[12px] text-ink-subtle">{check.note}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ResumeAnalyzerShowcase() {
  return (
    <ProductSection
      align="right"
      label="4.0  Resume"
      title="Know exactly why you scored the way you did"
      description="Every number traces back to a check you can read. QuickHire blends deterministic ATS rules with an AI content review, and shows its work — no black-box grade, no vague encouragement."
    >
      <AnalyzerMockup />
    </ProductSection>
  );
}
