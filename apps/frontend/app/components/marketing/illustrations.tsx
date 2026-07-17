import { motion, useReducedMotion } from "motion/react";

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
