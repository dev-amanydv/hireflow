import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

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
 * Voice waveform — rounded bars whose heights breathe on a staggered loop.
 * `active` toggles the speaking (tall, lively) vs idle (short, calm) state.
 * Div-based so it drops into any UI card. Static, varied bars under reduced motion.
 */
export function Waveform({
  bars = 28,
  active = true,
  className = "bg-brand",
  reduce: reduceProp,
}: {
  bars?: number;
  active?: boolean;
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
        return (
          <motion.span
            key={i}
            className={`w-[3px] rounded-full ${className}`}
            style={{ height: "100%", originY: 0.5 }}
            animate={{ scaleY: [0.16, a, 0.32, a * 0.7, 0.16] }}
            transition={{
              duration: 1.1 + (i % 5) * 0.14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.035,
            }}
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
