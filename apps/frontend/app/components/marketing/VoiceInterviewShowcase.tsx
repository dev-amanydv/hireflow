import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import ProductSection from "./ProductSection";
import { Waveform, useSceneActive, useSceneTick } from "./illustrations";

/**
 * Voice-interview feature. A live "call" card whose active waveform alternates
 * between the interviewer speaking and the candidate answering, over a real
 * turn-by-turn transcript — teaching the adaptive, one-question-at-a-time loop.
 */

const TURNS = [
  { who: "ai", text: "You built payments-svc — how did you keep it idempotent under retries?" },
  { who: "you", text: "Each request carried an idempotency key; the ledger deduped on it before writing." },
  { who: "ai", text: "And when two keys raced on the same row?" },
] as const;

function VoiceMockup() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [speaker, setSpeaker] = useState<"ai" | "you">("ai");

  const active = useSceneActive(ref);
  useSceneTick(ref, 2600, () => setSpeaker((s) => (s === "ai" ? "you" : "ai")), {
    enabled: !reduce,
  });

  const aiActive = speaker === "ai";

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden"
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* call header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="relative flex size-2.5 items-center justify-center">
          <span className={`absolute inline-flex size-2.5 rounded-full bg-brand ${reduce ? "" : "ln-stage-pulse"}`} />
          <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
        </span>
        <span className="text-[13px] text-ink-subtle">Live interview · Backend Engineer</span>
        <span className="ln-mono ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] text-ink-muted">
          voice · ~320ms
        </span>
      </div>

      {/* current speaker + waveform */}
      <div className="flex items-center gap-4 px-4 py-5">
        <div className="flex w-24 shrink-0 flex-col gap-0.5">
          <span className="ln-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
            {aiActive ? "Speaking" : "Listening"}
          </span>
          <span className="text-[14px] font-medium text-foreground">
            {aiActive ? "Hireflow" : "You"}
          </span>
        </div>
        <div className={aiActive ? "flex-1 text-brand" : "flex-1 text-ink-subtle"}>
          <Waveform bars={36} active running={active} className="bg-current" reduce={reduce} />
        </div>
      </div>

      {/* transcript */}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
        <span className="ln-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
          Transcript
        </span>
        {TURNS.map((t, i) => (
          <div key={i} className="flex gap-3">
            <span
              className={`ln-mono w-16 shrink-0 text-[11px] ${
                t.who === "ai" ? "text-brand" : "text-ink-tertiary"
              }`}
            >
              {t.who === "ai" ? "Hireflow" : "You"}
            </span>
            <p className="text-[13px] leading-relaxed text-ink-muted">{t.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function VoiceInterviewShowcase() {
  return (
    <ProductSection
      label="1.0  Interview"
      title="An interview that listens, then digs in"
      description="A realtime voice interviewer asks one question at a time, grounded in your actual resume and GitHub. It hears your answer, follows up where you go deep, and never reads from a script."
    >
      <VoiceMockup />
    </ProductSection>
  );
}
