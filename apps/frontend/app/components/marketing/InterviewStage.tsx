import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  FileText,
  LayoutGrid,
  Mic,
  MessageSquareText,
  PhoneOff,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Blueprint, Caret, Reserve, useSceneActive, useSceneTick, useStream } from "./illustrations";

const ACC = "var(--primary)";
const EASE = [0.22, 1, 0.36, 1] as const;

/* ---- interview window ------------------------------------------------ */
/* Mirrors the real product's InterviewRoom: a live/timer top bar, a left
   icon rail, a centered audio-reactive dot grid with a status line, a plain
   alignment-based transcript, and a pill-shaped control bar. */

function TitleBar() {
  return (
    <div className="relative flex items-center border-b border-hairline px-4 py-2.5 sm:px-5">
      <div className="flex items-center gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className="size-3 rounded-full"
            style={{
              background: "#3a3a3c",
              boxShadow: "inset 0 0 0 0.5px #4a4a4c",
            }}
          />
        ))}
      </div>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[12px] font-medium text-ink-tertiary">
        Interview Room
      </span>
    </div>
  );
}

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

      <span className="hidden text-[12.5px] text-ink-subtle sm:inline">Hireflow · Interviewer</span>
    </div>
  );
}

const RAIL_ITEMS = [
  { icon: LayoutGrid, active: false },
  { icon: Mic, active: true },
  { icon: FileText, active: false },
  { icon: MessageSquareText, active: false },
] as const;

function IconRail() {
  return (
    <div className="hidden flex-col items-center gap-1 border-r border-hairline py-4 lg:flex">
      {RAIL_ITEMS.map(({ icon: Icon, active }, i) => (
        <span
          key={i}
          className={`grid size-9 place-items-center rounded-md ${
            active ? "bg-surface-4 text-foreground" : "text-ink-tertiary"
          }`}
        >
          <Icon className="size-4" />
        </span>
      ))}
    </div>
  );
}

const STATUS_STEPS = [
  { label: "Listening", sub: "Answer out loud whenever you're ready.", mode: "listening" as const },
  { label: "Thinking", sub: "Reviewing what you just said…", mode: "thinking" as const },
  { label: "Speaking", sub: "Asking a follow-up question…", mode: "speaking" as const },
];

function useStatusCycle(ref: React.RefObject<Element | null>, reduce: boolean | null) {
  const [i, setI] = useState(0);
  useSceneTick(ref, 3400, () => setI((v) => (v + 1) % STATUS_STEPS.length), {
    enabled: !reduce,
  });
  return STATUS_STEPS[i];
}

/* A soft, center-bright cluster of dots standing in for the real product's
   audio-reactive visualizer grid — brighter and quicker while "speaking",
   calmer while "listening". Falls back to a static falloff under reduced motion. */
const DOT_COLS = 8;
const DOT_ROWS = 8;

function DotGrid({ reduce, mode }: { reduce: boolean | null; mode: "listening" | "thinking" | "speaking" }) {
  // The 64 dots never change with `mode` — only the two custom properties on the
  // container do, and CSS re-resolves those live against the running animations.
  // Memoising them keeps React out of the 3.4s status cycle entirely.
  const dots = useMemo(() => {
    const cx = (DOT_COLS - 1) / 2;
    const cy = (DOT_ROWS - 1) / 2;
    const maxDist = Math.hypot(cx, cy);

    return Array.from({ length: DOT_ROWS * DOT_COLS }).map((_, i) => {
      const x = i % DOT_COLS;
      const y = Math.floor(i / DOT_COLS);
      const dist = Math.hypot(x - cx, y - cy) / maxDist;
      const base = Math.max(0.05, Math.pow(1 - dist, 1.6));

      return (
        <span
          key={i}
          className="hf-dot size-1.5 rounded-full bg-current lg:size-2"
          style={
            {
              "--dot-base": base,
              "--dot-offset": `${(i % 5) * 0.12}s`,
              "--dot-delay": `${(i % 7) * 0.09}s`,
            } as React.CSSProperties
          }
        />
      );
    });
  }, []);

  const speed = mode === "speaking" ? 0.6 : mode === "thinking" ? 0.95 : 1.35;
  const amp = mode === "speaking" ? 1 : mode === "thinking" ? 0.78 : 0.56;

  return (
    <div
      className="grid gap-1.5 lg:gap-2"
      style={
        {
          gridTemplateColumns: `repeat(${DOT_COLS}, minmax(0,1fr))`,
          "--dot-amp": reduce ? 1 : amp,
          "--dot-speed": reduce ? 1 : speed,
        } as React.CSSProperties
      }
    >
      {dots}
    </div>
  );
}

function Stage({ reduce }: { reduce: boolean | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const status = useStatusCycle(ref, reduce);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center gap-7 p-6 sm:p-8 lg:p-12 xl:p-14"
    >
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

/* Owns the per-character stream so the ~45 updates/sec touch two adjacent text
   nodes instead of re-rendering the whole transcript (3 motion.div + Reserve). */
function StreamingLine({ text, active, reduce }: { text: string; active: boolean; reduce: boolean | null }) {
  const { out, done } = useStream(text, { speed: 22, startDelay: 900, loop: true, pause: 4200, active }, reduce);
  return (
    <>
      {out}
      {!done && <Caret />}
    </>
  );
}

function Transcript({ reduce }: { reduce: boolean | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useSceneActive(ref);

  return (
    <div ref={ref} className="hidden flex-col border-l border-hairline p-4 sm:flex sm:p-5">
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
                  <StreamingLine text={m.text} active={active} reduce={reduce} />
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
      className="relative z-10 overflow-hidden rounded-[20px]"
      style={{
        background: "#000000",
        border: "1px solid color-mix(in oklab, white 10%, transparent)",
        boxShadow:
          "0 40px 100px -32px color-mix(in oklab, var(--primary) 20%, transparent), 0 28px 70px -28px color-mix(in oklab, var(--foreground) 40%, transparent)",
      }}
    >
      <TitleBar />
      <TopBar reduce={reduce} />
      <div className="grid grid-cols-1 sm:min-h-[420px] sm:grid-cols-[1fr_minmax(0,240px)] lg:grid-cols-[64px_1fr_minmax(0,300px)] xl:grid-cols-[64px_1fr_minmax(0,340px)]">
        <IconRail />
        <Stage reduce={reduce} />
        <Transcript reduce={reduce} />
      </div>
      <Controls />
    </div>
  );
}

export default function InterviewStage() {
  const reduce = useReducedMotion();

  return (
    <div className="relative" style={{ "--acc": ACC } as React.CSSProperties}>
      <Blueprint />
      {/* A mask here would pull the whole window — 64 animating dots, the
          streaming transcript, the blurred glow — into an offscreen buffer that
          re-composites on every dot tick. The landing root paints a solid
          --background, so an overlaid gradient is visually equivalent and costs
          one static rect. */}
      <div className="relative lg:max-h-[640px] lg:overflow-hidden">
        <InterviewWindow reduce={reduce} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[20%]"
          style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
        />
      </div>
    </div>
  );
}
