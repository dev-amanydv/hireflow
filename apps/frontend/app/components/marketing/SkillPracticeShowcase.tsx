import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Atom,
  Binary,
  Braces,
  Database,
  Hexagon,
  type LucideIcon,
} from "lucide-react";
import ProductSection from "./ProductSection";

type Skill = {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: string;
  prompt: string;
};

const SKILLS: Skill[] = [
  {
    id: "react",
    label: "React",
    icon: Atom,
    accent: "oklch(0.72 0.13 220)",
    prompt: "Why would you reach for useReducer over useState here?",
  },
  {
    id: "nodejs",
    label: "Node.js",
    icon: Hexagon,
    accent: "oklch(0.68 0.15 145)",
    prompt: "Walk me through how you'd back-pressure this stream.",
  },
  {
    id: "system-design",
    label: "System design",
    icon: Database,
    accent: "oklch(0.6 0.17 265)",
    prompt: "How would you shard this table as write volume grows 50x?",
  },
  {
    id: "javascript",
    label: "JavaScript",
    icon: Braces,
    accent: "oklch(0.55 0.18 255)",
    prompt: "What happens to `this` if you pass that method as a callback?",
  },
  {
    id: "dsa",
    label: "Data structures",
    icon: Binary,
    accent: "oklch(0.6 0.11 185)",
    prompt: "Can you get this below O(n log n)? Talk me through it.",
  },
];

const CYCLE_MS = 4200;

function SkillGridMockup() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setActive((i) => (i + 1) % SKILLS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [reduce]);

  const skill = SKILLS[active];

  return (
    <motion.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {SKILLS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              style={{ ["--accent" as string]: s.accent }}
              className={`flex flex-col items-center gap-2 rounded-lg border px-2 py-3 text-center transition-colors duration-200 ${
                isActive
                  ? "border-[color-mix(in_oklab,var(--accent)_55%,var(--border))] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]"
                  : "border-border bg-secondary hover:border-[color-mix(in_oklab,var(--accent)_35%,var(--border))]"
              }`}
            >
              <Icon
                className="size-4"
                style={{ color: isActive ? s.accent : "var(--ink-subtle)" }}
              />
              <span className="text-[11px] leading-tight text-ink-muted">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[64px] border-t border-border pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={skill.id}
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-1.5"
          >
            <span className="ln-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
              Hireflow · {skill.label}
            </span>
            <p className="text-[13.5px] leading-relaxed text-foreground">
              {skill.prompt}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function SkillPracticeShowcase() {
  return (
    <ProductSection
      align="right"
      label="4.0  Practice"
      title="Practice the skills that matter"
      description="Pick a skill — React, Node.js, system design, and more — and Hireflow runs a focused mock interview on just that topic. No resume required."
    >
      <SkillGridMockup />
    </ProductSection>
  );
}
