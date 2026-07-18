import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

/**
 * Reveals `text` a token at a time (char-by-char or word-by-word) on a timer —
 * the shared typewriter effect behind every streaming transcript line. Set
 * `loop` to restart after `pause` once the text finishes.
 */
export function useStream(
  text: string,
  opts: {
    byWord?: boolean;
    speed?: number;
    startDelay?: number;
    loop?: boolean;
    pause?: number;
    /** When false the stream holds where it is — stops it running in a hidden tab. */
    active?: boolean;
  } = {},
  reduce?: boolean | null,
) {
  const { byWord = false, speed = 30, startDelay = 350, loop = false, pause = 2800, active = true } = opts;
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
    if (!active) return;
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
  }, [tokens, speed, startDelay, loop, pause, byWord, reduce, active]);

  return { out: tokens.slice(0, n).join(""), started: n > 0, done: n >= tokens.length };
}

/**
 * Interval that only runs while the element is actually on screen and the tab
 * is visible. Every showcase section on the landing page animates on a loop;
 * without this gate they all keep ticking React state while scrolled far out
 * of view, and the page feels laggy everywhere at once.
 *
 * Prefer CSS/compositor animation for continuous spatial motion — reach for
 * this only for discrete state that has to live in React (which step is lit,
 * which row is next).
 */
/* One `visibilitychange` subscription for the whole page rather than one per
   animated section — every scene hook below reads from this single store. */
function subscribeTabVisible(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}
const getTabVisible = () => !document.hidden;
const getTabVisibleServer = () => true;

function useTabVisible() {
  return useSyncExternalStore(subscribeTabVisible, getTabVisible, getTabVisibleServer);
}

/**
 * True only while `ref` is near the viewport *and* the tab is foregrounded — the
 * shared "should this scene be animating at all?" signal. Continuous CSS/SMIL
 * motion should be paused or unmounted when this is false; React-driven scenes
 * should stop ticking.
 */
export function useSceneActive(ref: React.RefObject<Element | null>) {
  const inView = useInView(ref, { margin: "160px" });
  const tabVisible = useTabVisible();
  return inView && tabVisible;
}

export function useSceneTick(
  ref: React.RefObject<Element | null>,
  ms: number,
  onTick: () => void,
  { paused = false, enabled = true }: { paused?: boolean; enabled?: boolean } = {},
) {
  const active = useSceneActive(ref);
  const cb = useRef(onTick);
  cb.current = onTick;

  const running = enabled && !paused && active;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => cb.current(), ms);
    return () => clearInterval(id);
  }, [running, ms]);

  return running;
}

/**
 * Steps through a loop by *scene boundary* rather than by fixed tick. Given the
 * timestamps at which something visible actually changes, it fires one state
 * update per boundary instead of one per tick — a scene whose 8s loop has seven
 * distinct states costs seven renders, not eighty.
 *
 * Returns the exact `phases[step]` timestamp so callers can keep deriving state
 * from an elapsed-milliseconds value exactly as they would with a fine tick.
 */
export function useScenePhase(
  ref: React.RefObject<Element | null>,
  {
    phases,
    loopMs,
    paused = false,
    enabled = true,
  }: { phases: readonly number[]; loopMs: number; paused?: boolean; enabled?: boolean },
) {
  const active = useSceneActive(ref);
  const [step, setStep] = useState(0);
  const [loop, setLoop] = useState(0);
  // Mirrors `step` so the scheduler can advance without the effect closing over
  // it — otherwise the timer chain tears down and restarts on every boundary.
  const stepRef = useRef(0);
  const running = enabled && !paused && active;

  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const current = stepRef.current;
      const next = current + 1;
      // Past the last boundary the remaining wait is whatever is left of the loop.
      const at = next >= phases.length ? loopMs : phases[next];
      timer = setTimeout(
        () => {
          if (next >= phases.length) {
            stepRef.current = 0;
            setStep(0);
            setLoop((c) => c + 1);
          } else {
            stepRef.current = next;
            setStep(next);
          }
          schedule();
        },
        Math.max(0, at - phases[current]),
      );
    };

    schedule();
    return () => clearTimeout(timer);
  }, [running, phases, loopMs]);

  return { elapsed: phases[step] ?? 0, loop };
}

/**
 * SSR-safe media query. Server and first client render both assume the desktop
 * branch, so layouts that would otherwise render *both* breakpoints and hide one
 * can mount only the branch they need.
 */
export function useBreakpoint(query: string) {
  const subscribe = useMemo(
    () => (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => true,
  );
}

/** Blinking typing caret, sized to sit against the current line of text. */
export function Caret() {
  return <span className="hf-caret ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-current align-middle" />;
}

/**
 * Reserves the final (longest) text's box size via an invisible copy, then
 * overlays the animating content absolutely — prevents layout jumping as a
 * streamed line grows to its full length.
 */
export function Reserve({
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

/**
 * Extremely subtle dotted "blueprint" background, radially masked toward one
 * focal point — the faint technical-schematic backdrop behind product mockups.
 */
export function Blueprint({ maskPosition = "62% 42%" }: { maskPosition?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--foreground) 13%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: `radial-gradient(75% 75% at ${maskPosition}, black, transparent)`,
          WebkitMaskImage: `radial-gradient(75% 75% at ${maskPosition}, black, transparent)`,
        }}
      />
    </div>
  );
}

/**
 * Resume doc node connected by a hand-drawn dashed path to a cascade of
 * question-bubble nodes — visualizes "resume in, tailored questions out".
 * Draws itself in once, the first time it scrolls into view.
 */
export function FigResumeToInterview() {
  const reduce = useReducedMotion();

  const bubbles = [
    { y: 46, w: 74 },
    { y: 92, w: 92 },
    { y: 138, w: 60 },
  ];

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 0.6,
      transition: reduce
        ? { duration: 0 }
        : { duration: 0.6, delay: 0.25 + i * 0.15, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  const nodeVariants = {
    hidden: { opacity: 0, scale: 0.92, x: -4 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      x: 0,
      transition: reduce
        ? { duration: 0 }
        : { duration: 0.4, delay: 0.5 + i * 0.15, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  return (
    <motion.svg
      viewBox="0 0 240 200"
      fill="none"
      className="h-44 w-full text-hairline-strong"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      <g stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
        {/* Resume document node */}
        <motion.g
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: reduce ? { duration: 0 } : { duration: 0.35, ease: "easeOut" },
            },
          }}
        >
          <rect x="18" y="30" width="56" height="140" rx="4" className="text-ink-tertiary" />
          <path d="M30 50h32M30 62h32M30 74h20" opacity="0.55" />
          <path d="M30 96h32M30 108h24" opacity="0.4" />
          <path d="M30 130h32M30 142h16" opacity="0.4" />
        </motion.g>

        {/* Dashed connector paths, drawn once on view */}
        {bubbles.map((b, i) => (
          <motion.path
            key={`path-${i}`}
            d={`M76 100 C 110 100, 110 ${b.y}, 148 ${b.y}`}
            strokeDasharray="3 4"
            custom={i}
            variants={pathVariants}
          />
        ))}

        {/* Question bubble nodes */}
        {bubbles.map((b, i) => (
          <motion.g key={`bubble-${i}`} custom={i} variants={nodeVariants}>
            <rect
              x="150"
              y={b.y - 12}
              width={b.w}
              height="24"
              rx="12"
              className={i === 0 ? "text-ink-tertiary" : undefined}
              opacity={i === 0 ? 0.9 : 0.55}
            />
            <path
              d={`M${162} ${b.y}h${b.w - 24}`}
              opacity={i === 0 ? 0.7 : 0.4}
            />
          </motion.g>
        ))}
      </g>
    </motion.svg>
  );
}

/**
 * A checkmark that draws itself in with a single stroke — used for the
 * resume-analyzer checklist rows. Animates once, staggered by `index`.
 */
export function DrawCheck({ index = 0 }: { index?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 16 16"
      fill="none"
      className="size-4 shrink-0 text-primary"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
    >
      <motion.path
        d="M3 8.5l3 3 7-7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: reduce
              ? { duration: 0 }
              : { duration: 0.35, delay: index * 0.08, ease: "easeOut" },
          },
        }}
      />
    </motion.svg>
  );
}

/**
 * A single "packet" that travels along an SVG path on a seamless loop, using
 * native SMIL <animateMotion> — pure vector, no JS on the frame loop. Must be
 * rendered inside an <svg>. Colour comes from `className` via currentColor so
 * it themes. Returns null under reduced motion (the static connector already
 * carries the meaning).
 */
export function PacketFlow({
  path,
  dur = 3,
  delay = 0,
  r = 3,
  className = "text-brand",
  reduce,
}: {
  path: string;
  dur?: number;
  delay?: number;
  r?: number;
  className?: string;
  reduce?: boolean | null;
}) {
  if (reduce) return null;
  return (
    <circle r={r} className={className} fill="currentColor">
      <animateMotion
        path={path}
        dur={`${dur}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        calcMode="linear"
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.12;0.85;1"
        dur={`${dur}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

/**
 * The soft halo that rides just ahead of a packet — a fiber's comet head. A
 * blurred disc is approximately a radial gradient, and as a paint server it
 * costs no filter-region re-raster as the circle moves (an `feGaussianBlur`
 * would re-rasterize every frame).
 *
 * `id` must be unique per instance on the page — the `<radialGradient>` is
 * defined inline and ids are document-global.
 */
export function PacketComet({
  id,
  path,
  dur = 2.4,
  delay = 0,
  r = 7,
  className = "text-brand",
  reduce,
}: {
  id: string;
  path: string;
  dur?: number;
  delay?: number;
  r?: number;
  className?: string;
  reduce?: boolean | null;
}) {
  if (reduce) return null;
  const grad = `hf-comet-${id}`;
  return (
    <g className={className}>
      <defs>
        <radialGradient id={grad}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={r} fill={`url(#${grad})`}>
        <animateMotion
          path={path}
          dur={`${dur}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          calcMode="linear"
        />
      </circle>
    </g>
  );
}

/**
 * Multi-lane fiber-optic style link between two scene panels — horizontal on
 * `lg:` layouts, vertical below. `id` must be unique per instance on the page —
 * it namespaces the comet's gradient id against every other Connector's.
 */
export const Connector = memo(function Connector({
  id,
  reduce,
  active = true,
}: {
  id: string;
  reduce: boolean | null;
  /** False renders only the static lanes — no SMIL timelines at all. */
  active?: boolean;
}) {
  const horizontal = useBreakpoint("(min-width: 1024px)");

  const lanes = horizontal
    ? {
        a: "M0,20 C25,20 25,14 50,14 C75,14 75,20 100,20",
        b: "M0,20 C25,20 25,26 50,26 C75,26 75,20 100,20",
        c: "M0,20 C25,20 25,18 50,18 C75,18 75,20 100,20",
      }
    : {
        a: "M20,0 C20,25 14,25 14,50 C14,75 20,75 20,100",
        b: "M20,0 C20,25 26,25 26,50 C26,75 20,75 20,100",
        c: "M20,0 C20,25 18,25 18,50 C18,75 20,75 20,100",
      };
  const moving = !reduce && active;

  return (
    <div
      className={
        horizontal
          ? "hidden shrink-0 items-center justify-center lg:flex lg:w-14 xl:w-20"
          : "flex h-12 items-center justify-center lg:hidden"
      }
    >
      <svg
        viewBox={horizontal ? "0 0 100 40" : "0 0 40 100"}
        className={horizontal ? "h-10 w-full" : "h-full w-10"}
        fill="none"
      >
        <path d={lanes.b} className="text-hairline" stroke="currentColor" strokeWidth="1" strokeDasharray="2 5" opacity={0.4} />
        <path d={lanes.c} className="text-hairline" stroke="currentColor" strokeWidth="1" strokeDasharray="1 3" opacity={0.3} />
        <path d={lanes.a} className="text-hairline" stroke="currentColor" strokeWidth="1.25" opacity={0.6} />
        {moving && (
          <>
            <PacketComet id={`connector-${id}`} path={lanes.a} dur={2.4} r={7} reduce={reduce} />
            <PacketFlow path={lanes.a} dur={2.4} r={2.4} className="text-brand" reduce={reduce} />
            <PacketFlow path={lanes.a} dur={3.6} delay={1.1} r={3.2} className="text-brand/70" reduce={reduce} />
            <PacketFlow path={lanes.b} dur={3} delay={0.6} r={1.6} className="text-brand/45" reduce={reduce} />
          </>
        )}
      </svg>
    </div>
  );
});

/**
 * Surface-ladder panel container used by every three-scene showcase row —
 * `variant="raised"` bumps it a level up the surface stack (used for the
 * hero/largest scene in the middle).
 */
export function Panel({
  variant = "panel",
  className = "",
  children,
}: {
  variant?: "panel" | "raised";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-hairline p-5 sm:p-6 ${
        variant === "raised" ? "bg-surface-2" : "bg-surface-1"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Voice waveform — rounded bars whose heights breathe on a staggered loop.
 * `active` toggles the speaking (tall, lively) vs idle (short, calm) state.
 * Div-based so it drops into any UI card. Static, varied bars under reduced motion.
 */
export function Waveform({
  bars = 28,
  active = true,
  running = true,
  className = "bg-brand",
  reduce: reduceProp,
}: {
  bars?: number;
  active?: boolean;
  /** False pauses the bars in place (offscreen / hidden tab) without unmounting. */
  running?: boolean;
  className?: string;
  reduce?: boolean | null;
}) {
  const reduceHook = useReducedMotion();
  const reduce = reduceProp ?? reduceHook;
  // Deterministic per-bar amplitude so SSR and client agree.
  const amp = (i: number) => 0.4 + (Math.sin(i * 1.3) * 0.5 + 0.5) * 0.6;

  return (
    <div className="flex h-10 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const a = amp(i);
        if (reduce || !active) {
          return (
            <span
              key={i}
              className={`w-[3px] rounded-full ${className}`}
              style={{ height: "100%", transform: `scaleY(${active ? a : 0.18})`, opacity: active ? 0.85 : 0.45 }}
            />
          );
        }
        // The static transform doubles as the reduced-motion resting pose, so the
        // `animation: none` rule in app.css resolves to a sensible frame.
        return (
          <span
            key={i}
            className={`hf-wave-bar w-[3px] rounded-full ${className}`}
            style={
              {
                height: "100%",
                transform: `scaleY(${a})`,
                "--wa": a,
                "--wd": `${1.1 + (i % 5) * 0.14}s`,
                "--wdelay": `${i * 0.035}s`,
                animationPlayState: running ? "running" : "paused",
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/**
 * Count-up progress ring. Animates a stroke-dash sweep and a rolling number the
 * first time it scrolls into view. Reused by the evaluation and resume-analyzer
 * sections so the "score" motif is identical everywhere.
 */
export function CountUpScore({
  value,
  label,
  px = 112,
  radius = 44,
  stroke = 7,
  colorVar = "var(--score-strong)",
}: {
  value: number;
  label: string;
  px?: number;
  radius?: number;
  stroke?: number;
  colorVar?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const circ = 2 * Math.PI * radius;
  const count = useMotionValue(0);
  const dashOffset = useTransform(count, (v) => circ * (1 - v / 100));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      count.set(value);
      setDisplay(value);
      return;
    }
    const controls = animate(count, value, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1] as const,
    });
    const unsub = count.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, reduce, count, value]);

  return (
    <div
      ref={ref}
      className="relative grid shrink-0 place-items-center"
      style={{ width: px, height: px }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--score-track)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={colorVar}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[26px] font-semibold tracking-tight text-foreground">
          {display}
        </span>
        <span className="ln-mono text-[9px] uppercase tracking-wider text-ink-tertiary">
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Four-axis radar over the product's fixed competency dimensions. Grid + axes
 * are static hairlines; the data polygon grows from its centre on view.
 */
export function RadarChart({
  values,
  labels,
  size = 220,
  colorVar = "var(--chart-1)",
}: {
  values: number[];
  labels: string[];
  size?: number;
  colorVar?: string;
}) {
  const reduce = useReducedMotion();
  const C = 100;
  const maxR = 72;
  const angle = (i: number) => ((-90 + i * 90) * Math.PI) / 180;
  const pt = (i: number, r: number): [number, number] => [
    C + r * Math.cos(angle(i)),
    C + r * Math.sin(angle(i)),
  ];
  const rings = [0.25, 0.5, 0.75, 1];
  const idx = [0, 1, 2, 3];
  const dataPts = values.map((v, i) => pt(i, (Math.max(0, Math.min(100, v)) / 100) * maxR));
  const dataStr = dataPts.map((p) => p.join(",")).join(" ");

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className="max-w-full">
      <g className="text-hairline-strong" stroke="currentColor" strokeWidth="1" fill="none">
        {rings.map((f, ri) => (
          <polygon
            key={ri}
            points={idx.map((i) => pt(i, maxR * f).join(",")).join(" ")}
            opacity={0.3}
          />
        ))}
        {idx.map((i) => {
          const [x, y] = pt(i, maxR);
          return <line key={i} x1={C} y1={C} x2={x} y2={y} opacity={0.3} />;
        })}
      </g>
      <motion.polygon
        points={dataStr}
        fill={colorVar}
        stroke={colorVar}
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{ transformBox: "fill-box", transformOrigin: "center", fillOpacity: 0.18 }}
        initial={reduce ? { scale: 1, opacity: 1 } : { scale: 0.2, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
      />
      {dataPts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={colorVar} />
      ))}
      {labels.map((l, i) => {
        const [x, y] = pt(i, maxR + 16);
        return (
          <text
            key={i}
            x={x}
            y={y}
            className="ln-mono fill-ink-tertiary"
            fontSize="8"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {l}
          </text>
        );
      })}
    </svg>
  );
}
