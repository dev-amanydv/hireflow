import { motion, useReducedMotion } from "motion/react";

const STEPS = [
  {
    n: "01",
    title: "Upload your resume",
    body: "One PDF. We extract your experience and pull your public GitHub through the API — the interview is grounded in what you actually shipped.",
    glyph: (
      <>
        <rect x="-7" y="-9" width="14" height="18" rx="2" />
        <path d="M-3.5 -4h7M-3.5 0h7M-3.5 4h4" strokeWidth="1.2" />
      </>
    ),
  },
  {
    n: "02",
    title: "Talk through an adaptive interview",
    body: "A realtime voice interviewer asks about what you built, one question at a time, and follows up wherever you go deep.",
    glyph: (
      <path
        d="M-8 -1v2M-4 -5v10M0 -8v16M4 -5v10M8 -2v4"
        strokeLinecap="round"
      />
    ),
  },
  {
    n: "03",
    title: "Get an evidence-backed score",
    body: "Minutes later: an overall band for your target seniority, four dimension scores, and a study plan — every number quoted from the transcript.",
    glyph: (
      <>
        <circle cx="0" cy="0" r="8" />
        <path d="M-3.5 0l2.5 2.5l5 -5.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

export default function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="flex max-w-2xl flex-col gap-3">
        <span className="ln-eyebrow">How it works</span>
        <h2 className="ln-display-md text-foreground">
          From resume to report in one sitting
        </h2>
        <p className="text-lg leading-relaxed text-ink-muted">
          No scheduling, no question bank, no waiting on a human panel. Three
          steps, start to finish.
        </p>
      </div>

      <div className="relative mt-14">
        <svg
          aria-hidden
          className="absolute inset-x-0 top-[22px] hidden h-2 w-full md:block"
          viewBox="0 0 100 2"
          preserveAspectRatio="none"
        >
          <line x1="0" y1="1" x2="100" y2="1" className="text-hairline-strong" stroke="currentColor" strokeWidth="0.5" />
          <motion.line
            x1="0"
            y1="1"
            x2="100"
            y2="1"
            className="text-brand"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="1"
            initial={{ pathLength: reduce ? 1 : 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={reduce ? { duration: 0 } : { duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            opacity={0.6}
          />
        </svg>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              className="relative flex flex-col gap-4"
              initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex size-11 items-center justify-center rounded-full border border-hairline-strong bg-card text-brand">
                <svg viewBox="-12 -12 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  {s.glyph}
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <span className="ln-mono text-[12px] text-ink-tertiary">{s.n}</span>
                <h3 className="text-[17px] font-semibold text-foreground">{s.title}</h3>
                <p className="max-w-xs text-[14px] leading-relaxed text-ink-muted">
                  {s.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
