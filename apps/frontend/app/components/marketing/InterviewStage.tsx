import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleDot,
  FileText,
  LayoutGrid,
  Mic,
  MessageSquareText,
  PhoneOff,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PacketFlow } from "./illustrations";

const ACC = "#5867C1";
const EASE = [0.22, 1, 0.36, 1] as const;


function useStream(
  text: string,
  opts: { byWord?: boolean; speed?: number; startDelay?: number; loop?: boolean; pause?: number } = {},
  reduce?: boolean | null,
) {
  const { byWord = false, speed = 30, startDelay = 350, loop = false, pause = 2800 } = opts;
  const [n, setN] = useState(0);
  const tokens = useMemo(
    () => (byWord ? text.match(/\S+\s*/g) ?? [text] : Array.from(text)),
    [text, byWord],
  );

  useEffect(() => {
    if (reduce) {
      setN(tokens.length);
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const gap = byWord ? speed * 3.4 : speed;
    setN(0);
    const step = () => {
      i += 1;
      setN(i);
      if (i < tokens.length) {
        timer = setTimeout(step, gap);
      } else if (loop) {
        timer = setTimeout(() => {
          i = 0;
          setN(0);
          timer = setTimeout(step, gap);
        }, pause);
      }
    };
    timer = setTimeout(step, startDelay);
    return () => clearTimeout(timer);
  }, [tokens, speed, startDelay, loop, pause, byWord, reduce]);

  return { out: tokens.slice(0, n).join(""), started: n > 0, done: n >= tokens.length };
}

function Caret() {
  return <span className="hf-caret ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-current align-middle" />;
}


function Reserve({
  final,
  textClassName,
  className,
  style,
  children,
}: {
  final: React.ReactNode;
  textClassName?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative ${className ?? ""}`} style={style}>
      <div aria-hidden className={`invisible ${textClassName ?? ""}`}>
        {final}
      </div>
      <div className={`absolute inset-0 ${textClassName ?? ""}`}>{children}</div>
    </div>
  );
}

/* ---- interview window ------------------------------------------------ */
/* Mirrors the real product's InterviewRoom: a live/timer + visualizer-switch
   top bar, a centered audio-reactive dot grid with a status line, a plain
   alignment-based transcript, and a pill-shaped control bar. */

function TopBar({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2.5">
        <span className="relative flex size-2.5 items-center justify-center">
          <span
            className={`absolute inline-flex size-full rounded-full ${reduce ? "" : "ln-stage-pulse"}`}
            style={{ background: "color-mix(in oklab, var(--success) 60%, transparent)" }}
          />
          <span className="relative inline-flex size-1.5 rounded-full" style={{ background: "var(--success)" }} />
        </span>
        <span className="text-[13px] font-medium text-foreground">Live</span>
        <span className="ln-mono text-[12px] text-ink-subtle">· 00:38</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-[12.5px] text-ink-subtle sm:inline">Hireflow · Interviewer</span>
        <div className="flex items-center gap-0.5 rounded-md border border-hairline bg-surface-2 p-0.5">
          <span className="grid size-7 place-items-center rounded-[5px] bg-surface-4 text-foreground">
            <LayoutGrid className="size-3.5" />
          </span>
          <span className="grid size-7 place-items-center rounded-[5px] text-ink-tertiary">
            <CircleDot className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

const STATUS_STEPS = [
  { label: "Listening", sub: "Answer out loud whenever you're ready.", mode: "listening" as const },
  { label: "Thinking", sub: "Reviewing what you just said…", mode: "thinking" as const },
  { label: "Speaking", sub: "Asking a follow-up question…", mode: "speaking" as const },
];

function useStatusCycle(reduce: boolean | null) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % STATUS_STEPS.length), 3400);
    return () => clearInterval(id);
  }, [reduce]);
  return STATUS_STEPS[i];
}

/* A soft, center-bright cluster of dots standing in for the real product's
   audio-reactive visualizer grid — brighter and quicker while "speaking",
   calmer while "listening". Falls back to a static falloff under reduced motion. */
function DotGrid({ reduce, mode }: { reduce: boolean | null; mode: "listening" | "thinking" | "speaking" }) {
  const cols = 8;
  const rows = 8;
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxDist = Math.hypot(cx, cy);
  const speed = mode === "speaking" ? 0.6 : mode === "thinking" ? 0.95 : 1.35;
  const amp = mode === "speaking" ? 1 : mode === "thinking" ? 0.78 : 0.56;

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {Array.from({ length: rows * cols }).map((_, i) => {
        const x = i % cols;
        const y = Math.floor(i / cols);
        const dist = Math.hypot(x - cx, y - cy) / maxDist;
        const base = Math.max(0.05, Math.pow(1 - dist, 1.6));

        if (reduce) {
          return <span key={i} className="size-1.5 rounded-full bg-current" style={{ opacity: base * 0.7 }} />;
        }
        const peak = Math.min(1, base * amp * 1.15);
        return (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-current"
            animate={{ opacity: [base * 0.3, peak, base * 0.3] }}
            transition={{
              duration: speed + (i % 5) * 0.12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 7) * 0.09,
            }}
          />
        );
      })}
    </div>
  );
}

function Stage({ reduce }: { reduce: boolean | null }) {
  const status = useStatusCycle(reduce);

  return (
    <div className="flex flex-col items-center justify-center gap-7 p-6 sm:p-8">
      <div className="relative grid place-items-center">
        <div
          aria-hidden
          className="pointer-events-none absolute size-44 rounded-full opacity-50 blur-3xl"
          style={{
            background: "radial-gradient(circle, color-mix(in oklab, var(--acc) 55%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="relative" style={{ color: "var(--acc)" }}>
          <DotGrid reduce={reduce} mode={status.mode} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <motion.p
          key={status.label}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="text-[15px] font-semibold text-foreground"
        >
          {status.label}
        </motion.p>
        <motion.p
          key={status.sub}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="text-[12.5px] text-ink-subtle"
        >
          {status.sub}
        </motion.p>
      </div>
    </div>
  );
}

const MESSAGES = [
  { who: "ai", text: "Hi, welcome to Hireflow. This is a React practice interview. Ready when you are?" },
  { who: "you", text: "Okay, I'm ready." },
  { who: "ai", text: "Tell me how you first got started learning React and what resources or projects you used to practice." },
] as const;

function Transcript({ reduce }: { reduce: boolean | null }) {
  const newest = useStream(MESSAGES[MESSAGES.length - 1].text, { speed: 22, startDelay: 900, loop: true, pause: 4200 }, reduce);

  return (
    <div className="flex flex-col border-t border-hairline p-4 sm:border-l sm:border-t-0 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="ln-eyebrow">Transcript</span>
        <span className="ln-mono text-[11px] text-ink-tertiary">{MESSAGES.length}</span>
      </div>
      <div className="flex flex-col gap-5">
        {MESSAGES.map((m, i) => {
          const isNewest = i === MESSAGES.length - 1;
          const isAI = m.who === "ai";
          const align = isAI ? "text-left" : "text-right";
          return (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, delay: 0.15 + i * 0.14, ease: EASE }}
              className={align}
            >
              {isNewest ? (
                <Reserve final={m.text} textClassName={`text-[12.5px] leading-relaxed text-foreground ${align}`}>
                  {newest.out}
                  {!newest.done && <Caret />}
                </Reserve>
              ) : (
                <p className="text-[12.5px] leading-relaxed text-foreground">{m.text}</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Controls() {
  return (
    <div className="flex items-center justify-center gap-2.5 border-t border-hairline px-4 py-4 sm:px-5">
      <div className="flex items-center overflow-hidden rounded-full border border-hairline bg-surface-2">
        <span className="grid h-8 w-9 place-items-center text-ink-muted">
          <Mic className="size-3.5" />
        </span>
        <span className="h-4 w-px bg-hairline" />
        <span className="grid h-8 w-7 place-items-center text-ink-tertiary">
          <ChevronDown className="size-3.5" />
        </span>
      </div>
      <span className="grid size-8 place-items-center rounded-full border border-hairline bg-surface-2 text-ink-muted">
        <MessageSquareText className="size-3.5" />
      </span>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-destructive"
      >
        <PhoneOff className="size-3.5" />
        End call
      </button>
    </div>
  );
}

function InterviewWindow({ reduce }: { reduce: boolean | null }) {
  return (
    <div
      className="relative z-10 overflow-hidden rounded-[28px] border border-hairline"
      style={{
        background: "#000000",
        boxShadow: "0 28px 70px -28px color-mix(in oklab, var(--foreground) 40%, transparent)",
      }}
    >
      <TopBar reduce={reduce} />
      <div className="grid grid-cols-1 sm:min-h-[368px] sm:grid-cols-[1fr_minmax(0,216px)]">
        <Stage reduce={reduce} />
        <Transcript reduce={reduce} />
      </div>
      <Controls />
    </div>
  );
}

/* ---- floating cards -------------------------------------------------- */

const SKILLS = [
  { label: "React", pct: 96 },
  { label: "Next.js", pct: 92 },
  { label: "Node", pct: 90 },
  { label: "TypeScript", pct: 94 },
  { label: "PostgreSQL", pct: 84 },
];

function ResumeCard({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="absolute left-2 top-full z-20 mt-[-18px] hidden w-52 transition-transform duration-300 hover:-translate-y-1.5 lg:block xl:left-6">
      <div
        className="rounded-2xl border border-hairline bg-card p-4"
        style={{ boxShadow: "0 20px 50px -24px color-mix(in oklab, var(--foreground) 45%, transparent)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <FileText className="size-3.5 text-ink-tertiary" />
          <span className="text-[12px] font-semibold text-foreground">Resume analysis</span>
        </div>
        <div className="flex flex-col gap-2">
          {SKILLS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <Check className="size-3 shrink-0" style={{ color: "var(--success)" }} />
              <span className="w-16 shrink-0 text-[11px] text-ink-muted">{s.label}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-score-track">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--acc)" }}
                  initial={{ width: reduce ? `${s.pct}%` : 0 }}
                  whileInView={{ width: `${s.pct}%` }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={reduce ? { duration: 0 } : { duration: 0.7, delay: 0.2 + i * 0.1, ease: EASE }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STEPS = ["Resume", "LLM", "Summarise resume", "Context ready"];

function ContextCard({ reduce }: { reduce: boolean | null }) {
  const H = 132;
  const rows = STEPS.length;
  const cy = (i: number) => (H / rows) * i + H / rows / 2;

  return (
    <div className="absolute right-2 top-full z-20 mt-[-18px] hidden w-56 transition-transform duration-300 hover:-translate-y-1.5 lg:block xl:right-6">
      <div
        className="rounded-2xl border border-hairline bg-card p-4"
        style={{ boxShadow: "0 20px 50px -24px color-mix(in oklab, var(--foreground) 45%, transparent)" }}
      >
        <span className="ln-mono text-[9px] uppercase tracking-wider text-ink-tertiary">Context builder</span>
        <div className="mt-3 flex gap-3">
          <svg width="20" height={H} viewBox={`0 0 20 ${H}`} className="shrink-0" aria-hidden>
            <line x1="10" y1={cy(0)} x2="10" y2={cy(rows - 1)} className="text-hairline-strong" stroke="currentColor" strokeWidth="1.5" />
            <PacketFlow path={`M10,${cy(0)} V${cy(rows - 1)}`} dur={2.6} delay={0} r={2.6} className="text-[color:var(--acc)]" reduce={reduce} />
            <PacketFlow path={`M10,${cy(0)} V${cy(rows - 1)}`} dur={2.6} delay={1.3} r={2.6} className="text-[color:var(--acc)]" reduce={reduce} />
            {STEPS.map((_, i) => (
              <circle
                key={i}
                cx="10"
                cy={cy(i)}
                r="4"
                className="fill-card"
                style={{ stroke: "var(--acc)", strokeWidth: 1.5 }}
              />
            ))}
          </svg>
          <div className="flex flex-1 flex-col justify-between" style={{ height: H }}>
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-1 items-center">
                <span className={`text-[12px] ${i === rows - 1 ? "font-medium" : "text-ink-muted"}`} style={i === rows - 1 ? { color: "var(--acc)" } : undefined}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Blueprint() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--foreground) 13%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(75% 75% at 62% 42%, black, transparent)",
          WebkitMaskImage: "radial-gradient(75% 75% at 62% 42%, black, transparent)",
        }}
      />
    </div>
  );
}

export default function InterviewStage() {
  const reduce = useReducedMotion();

  return (
    <div className="relative" style={{ "--acc": ACC } as React.CSSProperties}>
      <Blueprint />
      <InterviewWindow reduce={reduce} />
    </div>
  );
}
