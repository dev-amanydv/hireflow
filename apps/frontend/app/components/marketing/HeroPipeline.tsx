import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PacketFlow, Waveform } from "./illustrations";

/**
 * The hero's interactive product pipeline. Seven stages that mirror the real
 * flow — resume in, scored report out — connected by an animated rail with
 * packets flowing through it. Auto-advances; hovering the rail pauses it, and
 * every stage is clickable to reveal what that step actually does. Under
 * reduced motion the rail is static and packets are hidden; clicking still works.
 */

type Stage = {
  id: string;
  label: string;
  title: string;
  blurb: string;
};

const STAGES: Stage[] = [
  {
    id: "resume",
    label: "Resume",
    title: "You upload one PDF",
    blurb:
      "Drop in a resume. Text and links are extracted — no forms to fill, no profile to rebuild by hand.",
  },
  {
    id: "parse",
    label: "Parse",
    title: "We read your code, not just your resume",
    blurb:
      "Links are resolved and your public GitHub is pulled through the API — top repositories, languages, and READMEs.",
  },
  {
    id: "profile",
    label: "Profile",
    title: "A structured candidate profile",
    blurb:
      "Skills, projects, and experience are distilled into an editable summary you can correct before you begin.",
  },
  {
    id: "interview",
    label: "Interview",
    title: "An adaptive voice interview",
    blurb:
      "A realtime voice interviewer asks one question at a time, grounded in what you've shipped, and follows up for depth.",
  },
  {
    id: "transcript",
    label: "Transcript",
    title: "Every turn, transcribed live",
    blurb:
      "Speech is transcribed as you talk and saved turn by turn — the full transcript becomes the evidence for scoring.",
  },
  {
    id: "evaluation",
    label: "Evaluate",
    title: "Scored across four dimensions",
    blurb:
      "Technical depth, problem-solving, communication, and practical application — each graded from quoted evidence.",
  },
  {
    id: "report",
    label: "Report",
    title: "A report calibrated to your level",
    blurb:
      "An overall band relative to the seniority you targeted, plus strengths, growth areas, and a study plan.",
  },
];

// Rail geometry, in the SVG's own user units.
const VB_W = 920;
const VB_H = 128;
const RAIL_Y = 46;
const X0 = 64;
const X1 = 856;
const STEP = (X1 - X0) / (STAGES.length - 1);
const xs = STAGES.map((_, i) => X0 + i * STEP);

function Glyph({ id }: { id: string }) {
  // All glyphs are centred on (0,0), ~16px across, 1.5px strokes.
  switch (id) {
    case "resume":
      return (
        <>
          <rect x="-6" y="-8" width="12" height="16" rx="1.6" />
          <path d="M-3 -4h6M-3 0h6M-3 4h3" strokeWidth="1.2" />
        </>
      );
    case "parse":
      return (
        <>
          <path d="M-2 -7c-3 0 -3 2.5 -3 7c0 4.5 0 7 3 7" />
          <path d="M2 -7c3 0 3 2.5 3 7c0 4.5 0 7 -3 7" />
        </>
      );
    case "profile":
      return (
        <>
          <circle cx="0" cy="-3" r="2.6" />
          <path d="M-5 7a5 5 0 0 1 10 0" />
        </>
      );
    case "interview":
      return (
        <path
          d="M-7 -1v2M-3.5 -4v8M0 -7v14M3.5 -4v8M7 -2v4"
          strokeLinecap="round"
        />
      );
    case "transcript":
      return <path d="M-6 -5h12M-6 -1h9M-6 3h11" strokeLinecap="round" />;
    case "evaluation":
      return (
        <>
          <circle cx="0" cy="0" r="6.5" />
          <circle cx="0" cy="0" r="2.5" />
        </>
      );
    case "report":
      return (
        <>
          <circle cx="0" cy="0" r="6.5" />
          <path d="M-3 0l2 2l4 -4.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    default:
      return null;
  }
}

/* ---- per-stage detail panels ---------------------------------------- */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="ln-mono rounded-md border border-hairline bg-surface-2 px-2 py-1 text-[11px] text-ink-muted">
      {children}
    </span>
  );
}

function StageDetail({ id }: { id: string }) {
  switch (id) {
    case "resume":
      return (
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5 rounded-md border border-hairline bg-surface-2 p-3">
            <span className="h-1.5 w-16 rounded-full bg-ink-tertiary/50" />
            <span className="h-1.5 w-24 rounded-full bg-ink-tertiary/30" />
            <span className="h-1.5 w-20 rounded-full bg-ink-tertiary/30" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip>resume.pdf</Chip>
            <Chip>1 page</Chip>
          </div>
        </div>
      );
    case "parse":
      return (
        <div className="flex flex-wrap gap-1.5">
          <Chip>github.com/you</Chip>
          <Chip>12 repos</Chip>
          <Chip>TypeScript</Chip>
          <Chip>Go</Chip>
          <Chip>README ✓</Chip>
        </div>
      );
    case "profile":
      return (
        <div className="flex flex-col gap-1.5 text-[12.5px]">
          {[
            ["Role", "Backend Engineer · 6 yrs"],
            ["Skills", "Node.js · Postgres · Kafka"],
            ["Projects", "payments-svc, edge-cache"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="ln-mono w-14 shrink-0 text-ink-tertiary">{k}</span>
              <span className="text-ink-muted">{v}</span>
            </div>
          ))}
        </div>
      );
    case "interview":
      return (
        <div className="flex flex-col gap-2.5">
          <div className="text-brand">
            <Waveform bars={30} active className="bg-current" />
          </div>
          <p className="max-w-sm text-[12.5px] leading-relaxed text-ink-muted">
            “Walk me through how you kept <span className="ln-mono text-foreground">payments-svc</span> idempotent under retries.”
          </p>
        </div>
      );
    case "transcript":
      return (
        <div className="flex flex-col gap-2 text-[12.5px]">
          <div className="flex gap-2">
            <span className="ln-mono w-16 shrink-0 text-brand">AI</span>
            <span className="text-ink-muted">Why a queue over a cron here?</span>
          </div>
          <div className="flex gap-2">
            <span className="ln-mono w-16 shrink-0 text-ink-tertiary">You</span>
            <span className="text-ink-muted">
              Cron double-fires on redeploys, so I…
            </span>
          </div>
        </div>
      );
    case "evaluation":
      return (
        <div className="flex flex-col gap-2">
          {[
            ["Technical depth", 82],
            ["Problem-solving", 88],
            ["Communication", 74],
          ].map(([label, v]) => (
            <div key={label as string} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-[12px] text-ink-muted">{label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-score-track">
                <div
                  className="h-full rounded-full bg-score-strong"
                  style={{ width: `${v}%` }}
                />
              </div>
              <span className="ln-mono w-6 text-right text-[11px] text-foreground">{v}</span>
            </div>
          ))}
        </div>
      );
    case "report":
      return (
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[30px] font-semibold leading-none tracking-tight text-foreground">
              84
            </span>
            <span className="ln-mono text-[9px] uppercase tracking-wider text-ink-tertiary">
              overall
            </span>
          </div>
          <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[12px] font-medium text-brand">
            Strong for Senior
          </span>
        </div>
      );
    default:
      return null;
  }
}

export default function HeroPipeline() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setActive((a) => (a + 1) % STAGES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [reduce, paused]);

  const activeX = xs[active];
  const stage = STAGES[active];

  return (
    <div
      className="rounded-2xl sm:px-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Rail */}
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full min-w-[640px]"
          role="group"
          aria-label="Interview pipeline"
        >
          {/* track */}
          <line
            x1={X0}
            y1={RAIL_Y}
            x2={X1}
            y2={RAIL_Y}
            className="text-hairline-strong"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {/* progress up to the active stage */}
          <motion.line
            x1={X0}
            y1={RAIL_Y}
            x2={activeX}
            y2={RAIL_Y}
            className="text-brand"
            stroke="currentColor"
            strokeWidth="1.5"
            initial={false}
            animate={{ x2: activeX }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            opacity={0.7}
          />

          {/* flowing packets */}
          <PacketFlow path={`M${X0},${RAIL_Y} H${X1}`} dur={3.4} delay={0} reduce={reduce} />
          <PacketFlow path={`M${X0},${RAIL_Y} H${X1}`} dur={3.4} delay={1.1} r={2.4} className="text-brand/60" reduce={reduce} />
          <PacketFlow path={`M${X0},${RAIL_Y} H${X1}`} dur={3.4} delay={2.2} reduce={reduce} />

          {/* sliding active halo */}
          <motion.g
            initial={false}
            animate={{ x: activeX }}
            transition={reduce ? { duration: 0 } : { type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <circle cx="0" cy={RAIL_Y} r="27" className="fill-brand/10" />
            <circle
              cx="0"
              cy={RAIL_Y}
              r="20"
              className="text-brand"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </motion.g>

          {/* nodes */}
          {STAGES.map((s, i) => {
            const isActive = i === active;
            return (
              <g
                key={s.id}
                role="button"
                tabIndex={0}
                aria-label={s.title}
                aria-pressed={isActive}
                className="cursor-pointer outline-none"
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(i);
                  }
                }}
              >
                {/* generous invisible hit area */}
                <rect
                  x={xs[i] - 26}
                  y={RAIL_Y - 26}
                  width="52"
                  height="80"
                  fill="transparent"
                />
                <circle
                  cx={xs[i]}
                  cy={RAIL_Y}
                  r="19"
                  className="fill-card text-hairline-strong"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <g
                  transform={`translate(${xs[i]},${RAIL_Y})`}
                  className={isActive ? "text-brand" : "text-ink-tertiary"}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                >
                  <Glyph id={s.id} />
                </g>
                <text
                  x={xs[i]}
                  y={RAIL_Y + 40}
                  textAnchor="middle"
                  fontSize="12.5"
                  className={
                    isActive
                      ? "fill-foreground font-medium"
                      : "fill-ink-tertiary"
                  }
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <div className="mt-4 grid gap-4 border-t border-hairline pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage.id}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="ln-mono text-[11px] text-ink-tertiary">
                {String(active + 1).padStart(2, "0")} / {String(STAGES.length).padStart(2, "0")}
              </span>
              <span className="text-[15px] font-semibold text-foreground">
                {stage.title}
              </span>
            </div>
            <p className="max-w-lg text-[13.5px] leading-relaxed text-ink-muted">
              {stage.blurb}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="min-h-[68px] sm:w-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage.id}
              initial={reduce ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-lg border border-hairline bg-surface-1 p-3"
            >
              <StageDetail id={stage.id} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
