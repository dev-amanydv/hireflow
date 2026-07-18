import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Atom,
  Binary,
  Braces,
  Database,
  Hexagon,
  Table2,
  Terminal,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Blueprint,
  Caret,
  Connector,
  DrawCheck,
  Panel,
  Reserve,
  Waveform,
  useSceneActive,
  useSceneTick,
  useScenePhase,
  useStream,
} from "./illustrations";

/**
 * The "no résumé required" story: pick a skill, watch Hireflow's engine plan a
 * full interview from it, then the live interview begins — three connected
 * scenes that auto-play on one master clock (pausable on hover), mirroring
 * how every other looping section in this file behaves.
 */

type Skill = { id: string; label: string; icon: LucideIcon; varName: string };

const SKILLS: Skill[] = [
  { id: "react", label: "React", icon: Atom, varName: "--skill-react" },
  { id: "nodejs", label: "Node.js", icon: Hexagon, varName: "--skill-nodejs" },
  { id: "system-design", label: "System design", icon: Database, varName: "--skill-system-design" },
  { id: "sql-databases", label: "SQL & databases", icon: Table2, varName: "--skill-sql-databases" },
  { id: "javascript", label: "JavaScript", icon: Braces, varName: "--skill-javascript" },
  { id: "python", label: "Python", icon: Terminal, varName: "--skill-python" },
  { id: "dsa", label: "Data structures", icon: Binary, varName: "--skill-dsa" },
  { id: "behavioral", label: "Behavioral", icon: Users, varName: "--skill-behavioral" },
];

const ENGINE_NODES = [
  { id: "concept-graph", label: "Concept Graph", sub: "Mapping core concepts & relationships", eta: "0.4s", state: "mapping" },
  { id: "difficulty-engine", label: "Difficulty Engine", sub: "Calibrating question difficulty", eta: "0.3s", state: "calibrating" },
  { id: "question-generator", label: "Question Generator", sub: "Writing targeted interview questions", eta: "0.6s", state: "generating" },
  { id: "interview-planner", label: "Interview Planner", sub: "Sequencing the full interview", eta: "0.2s", state: "sequencing" },
] as const;

const CONCEPT_CHIPS = ["Hooks", "State", "Rendering", "Fiber", "Reconciliation", "Performance", "Compiler"];

const QUESTION_FRAGMENTS = [
  "Explain how the Fiber reconciler schedules work.",
  "When would you reach for useMemo over useCallback?",
  "Walk through a render you'd optimize.",
];

const DIFFICULTY_LEVELS = ["Junior", "Mid-Level", "Senior"] as const;
const ACTIVE_DIFFICULTY = "Mid-Level";

const LIVE_QUESTION = "Can you walk me through how the Fiber reconciler schedules work?";
const INTERVIEW_BASE_SECONDS = 7 * 60 + 38;
const QUESTION_BASE_NUMBER = 4;
const QUESTION_TOTAL = 15;

/* ---- master timeline --------------------------------------------------- */

const LOOP_MS = 8000;
const ENGINE_START_MS = 2000;
const ENGINE_STEP_MS = 800;
const QUESTION_GENERATOR_INDEX = ENGINE_NODES.findIndex((n) => n.id === "question-generator");
const QUESTIONS_START_MS = ENGINE_START_MS + QUESTION_GENERATOR_INDEX * ENGINE_STEP_MS;
const QUESTION_STEP_MS = 1400;

/**
 * The moments in the loop where something on screen actually changes: a node
 * lights up, or another generated question lands. Ticking at a fixed 100ms
 * instead re-rendered this whole section 80 times per loop to produce these
 * same seven states.
 */
const PHASES: readonly number[] = [
  ...new Set([
    0,
    ...ENGINE_NODES.map((_, i) => ENGINE_START_MS + i * ENGINE_STEP_MS),
    ...QUESTION_FRAGMENTS.map((_, i) => QUESTIONS_START_MS + i * QUESTION_STEP_MS),
  ]),
]
  .filter((t) => t < LOOP_MS)
  .sort((a, b) => a - b);

/* ---- scene 1: choose your skill ------------------------------------------ */

function SkillGrid({ activeSkill, reduce }: { activeSkill: number; reduce: boolean | null }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {SKILLS.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === activeSkill;
        return (
          <button
            key={s.id}
            type="button"
            style={{ ["--accent" as string]: `var(${s.varName})` }}
            className={`relative flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-center transition-[background-color,opacity] duration-500 ${
              isActive ? "bg-[color-mix(in_oklab,var(--accent)_11%,transparent)]" : "opacity-55 hover:opacity-85"
            }`}
          >
            {isActive && !reduce && (
              <>
                <span
                  aria-hidden
                  className="ln-stage-pulse absolute left-1/2 top-[18px] size-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ background: "color-mix(in oklab, var(--accent) 26%, transparent)" }}
                />
                <motion.span
                  key={activeSkill}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[18px] size-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ border: "1px solid var(--accent)" }}
                  initial={{ scale: 0.4, opacity: 0.55 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </>
            )}
            <Icon
              className="relative size-4"
              style={{ color: isActive ? "var(--accent)" : "var(--ink-subtle)" }}
            />
            <span className="relative text-[10.5px] leading-tight text-ink-muted">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Scene1({ activeSkill, reduce }: { activeSkill: number; reduce: boolean | null }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-foreground">Choose your skill</span>
        <Badge variant="outline" className="text-[10px]">
          No résumé required
        </Badge>
      </div>
      <SkillGrid activeSkill={activeSkill} reduce={reduce} />
    </div>
  );
}

/* ---- scene 2: interview generation engine --------------------------------- */

function QuestionRow({ text, reduce }: { text: string; reduce: boolean | null }) {
  const { out } = useStream(text, { byWord: true, speed: 40, startDelay: 0 }, reduce);
  return <p className="text-[11px] leading-snug text-ink-muted">{reduce ? text : out}</p>;
}

function EngineNode({
  node,
  index,
  isLast,
  engineActiveIndex,
  questionFragmentIndex,
  reduce,
}: {
  node: (typeof ENGINE_NODES)[number];
  index: number;
  isLast: boolean;
  engineActiveIndex: number;
  questionFragmentIndex: number;
  reduce: boolean | null;
}) {
  const lit = engineActiveIndex >= index;
  const current = engineActiveIndex === index;
  const segmentLit = engineActiveIndex > index;

  return (
    <div className="flex gap-3">
      <div className="flex w-4 shrink-0 flex-col items-center">
        <div className="flex size-4 shrink-0 items-center justify-center">
          {current ? (
            <span className="relative flex size-3 items-center justify-center">
              {!reduce && (
                <span
                  aria-hidden
                  className="ln-stage-pulse absolute inline-flex size-full rounded-full"
                  style={{ background: "color-mix(in oklab, var(--primary) 45%, transparent)" }}
                />
              )}
              <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
            </span>
          ) : lit ? (
            <DrawCheck />
          ) : (
            <span className="size-1.5 rounded-full border border-ink-tertiary/40" />
          )}
        </div>
        {!isLast && <span className={`mt-0.5 w-px flex-1 ${segmentLit ? "bg-brand/40" : "bg-hairline"}`} />}
      </div>

      <div className={`flex-1 pb-5 transition-opacity duration-500 ${lit ? "opacity-100" : "opacity-45"}`}>
        <span className={`text-[12.5px] font-medium ${lit ? "text-foreground" : "text-ink-tertiary"}`}>
          {node.label}
        </span>
        <p className="mt-0.5 text-[11px] text-ink-subtle">{node.sub}</p>

        <div className="mt-1.5 flex items-center gap-2">
          {/* scaleX rather than width: at 1px tall there is no visible cap
              distortion, and it keeps the fill off the layout path. */}
          <span className="h-px flex-1 overflow-hidden rounded-full bg-hairline">
            <span
              className={`block h-full w-full origin-left bg-brand transition-transform duration-700 ease-in-out ${
                lit ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </span>
          <span
            className={`ln-mono shrink-0 text-[10px] text-ink-tertiary transition-opacity duration-500 ${
              lit ? "opacity-100" : "opacity-0"
            }`}
          >
            ~{node.eta} · {node.state}
          </span>
        </div>

        {node.id === "concept-graph" && lit && (
          <div className="ln-fade mt-2 flex flex-wrap gap-1.5">
            {CONCEPT_CHIPS.map((chip, i) => (
              <span
                key={chip}
                className="ln-mono rounded-full bg-surface-3 px-2 py-0.5 text-[9.5px] text-ink-tertiary"
                style={{ animationDelay: `${i * 90}ms`, opacity: reduce ? 1 : 0 }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {node.id === "difficulty-engine" && lit && (
          <div className="ln-fade mt-2.5 flex flex-col gap-1 border-t border-hairline pt-2.5">
            {DIFFICULTY_LEVELS.map((level) => {
              const isActive = level === ACTIVE_DIFFICULTY;
              return (
                <div key={level} className="flex items-center gap-1.5">
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${
                      isActive ? "bg-brand" : "border border-ink-tertiary/50"
                    }`}
                  />
                  <span className={`text-[11px] ${isActive ? "font-medium text-foreground" : "text-ink-tertiary"}`}>
                    {level}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {node.id === "question-generator" && lit && (
          <div className="ln-fade mt-2.5 flex flex-col gap-1 border-t border-hairline pt-2.5">
            {QUESTION_FRAGMENTS.slice(0, Math.max(0, questionFragmentIndex)).map((q) => (
              <p key={q} className="text-[10.5px] leading-snug text-ink-tertiary/70">
                {q}
              </p>
            ))}
            {questionFragmentIndex >= 0 && questionFragmentIndex < QUESTION_FRAGMENTS.length && (
              <QuestionRow key={questionFragmentIndex} text={QUESTION_FRAGMENTS[questionFragmentIndex]} reduce={reduce} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Scene2({
  engineActiveIndex,
  questionFragmentIndex,
  reduce,
}: {
  engineActiveIndex: number;
  questionFragmentIndex: number;
  reduce: boolean | null;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <span className="text-[13px] font-medium text-foreground">Interview generation engine</span>
      <div className="flex flex-col">
        {ENGINE_NODES.map((node, i) => (
          <EngineNode
            key={node.id}
            node={node}
            index={i}
            isLast={i === ENGINE_NODES.length - 1}
            engineActiveIndex={engineActiveIndex}
            questionFragmentIndex={questionFragmentIndex}
            reduce={reduce}
          />
        ))}
      </div>
    </div>
  );
}

/* ---- scene 3: live interview begins --------------------------------------- */

/* The clock and latency readout are the only things in this scene that change
   continuously, so they own a 1Hz tick of their own rather than forcing the
   section's master timeline to run fast enough to drive them. */
function LiveMeters({
  sceneRef,
  questionNumber,
  reduce,
}: {
  sceneRef: React.RefObject<Element | null>;
  questionNumber: number;
  reduce: boolean | null;
}) {
  const [seconds, setSeconds] = useState(0);
  useSceneTick(sceneRef, 1000, () => setSeconds((s) => s + 1), { enabled: !reduce });

  const totalSeconds = INTERVIEW_BASE_SECONDS + seconds;
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  const latency = 180 + Math.round(Math.sin(seconds / 0.4) * 12);

  return (
    <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-hairline pt-3">
      <span className="ln-mono text-[11px] text-ink-tertiary">{reduce ? "07:42" : `${mm}:${ss}`}</span>
      <span className="size-1 rounded-full bg-ink-tertiary/50" />
      <span className="ln-mono text-[11px] text-ink-tertiary">
        Question {questionNumber}/{QUESTION_TOTAL}
      </span>
      <span className="size-1 rounded-full bg-ink-tertiary/50" />
      <span className="ln-mono text-[11px] text-ink-tertiary">{reduce ? "184ms" : `${latency}ms`}</span>
    </div>
  );
}

function Scene3({
  reduce,
  sceneRef,
  active,
  questionNumber,
}: {
  reduce: boolean | null;
  sceneRef: React.RefObject<Element | null>;
  active: boolean;
  questionNumber: number;
}) {
  const { out, done } = useStream(
    LIVE_QUESTION,
    { byWord: true, speed: 45, startDelay: 600, loop: true, pause: 3600, active },
    reduce,
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5 items-center justify-center">
            <span
              className={`absolute inline-flex size-full rounded-full ${reduce ? "" : "ln-stage-pulse"}`}
              style={{ background: "color-mix(in oklab, var(--success) 60%, transparent)" }}
            />
            <span className="relative inline-flex size-1.5 rounded-full" style={{ background: "var(--success)" }} />
          </span>
          <span className="text-[13px] font-medium text-foreground">Live interview begins</span>
        </div>
      </div>

      <Waveform bars={22} active running={active} reduce={reduce} className="bg-brand" />

      <Reserve final={LIVE_QUESTION} textClassName="text-[12.5px] leading-relaxed text-foreground">
        {out}
        {!done && <Caret />}
      </Reserve>

      <LiveMeters sceneRef={sceneRef} questionNumber={questionNumber} reduce={reduce} />
    </div>
  );
}

/* ---- section --------------------------------------------------------------- */

export default function SkillEngineShowcase() {
  const reduce = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const active = useSceneActive(sceneRef);
  const { elapsed, loop: loopCount } = useScenePhase(sceneRef, {
    phases: PHASES,
    loopMs: LOOP_MS,
    paused,
    enabled: !reduce,
  });

  const activeSkill = reduce ? 0 : loopCount % SKILLS.length;

  const engineActiveIndex = reduce
    ? ENGINE_NODES.length - 1
    : elapsed < ENGINE_START_MS
      ? -1
      : Math.min(ENGINE_NODES.length - 1, Math.floor((elapsed - ENGINE_START_MS) / ENGINE_STEP_MS));

  const questionElapsed = elapsed - QUESTIONS_START_MS;
  const questionFragmentIndex = reduce
    ? QUESTION_FRAGMENTS.length - 1
    : questionElapsed < 0
      ? -1
      : Math.min(QUESTION_FRAGMENTS.length - 1, Math.floor(questionElapsed / QUESTION_STEP_MS));

  const questionNumber = Math.min(
    QUESTION_TOTAL,
    QUESTION_BASE_NUMBER + (reduce ? QUESTION_FRAGMENTS.length : Math.max(0, questionFragmentIndex + 1)),
  );

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-105 opacity-70"
        style={{
          background: "radial-gradient(50% 80% at 50% 0%, var(--glow-brand), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="ln-eyebrow">Skill-based interviews</span>
          <h2 className="ln-display-lg text-foreground">No resume? No problem — just pick a skill</h2>
          <p className="text-lg leading-relaxed text-ink-muted">
            Hireflow builds a complete interview from a single skill — mapping the concepts,
            picking the difficulty, and writing every question — before your first answer.
          </p>
        </div>

        <div ref={sceneRef} className="relative mt-14">
          <Blueprint maskPosition="50% 30%" />
          <div
            className="relative flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-0"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <Panel className="lg:flex-[25]">
              <Scene1 activeSkill={activeSkill} reduce={reduce} />
            </Panel>
            <Connector id="a" reduce={reduce} active={active} />
            <Panel variant="raised" className="lg:flex-[40]">
              <Scene2
                engineActiveIndex={engineActiveIndex}
                questionFragmentIndex={questionFragmentIndex}
                reduce={reduce}
              />
            </Panel>
            <Connector id="b" reduce={reduce} active={active} />
            <Panel className="lg:flex-[35]">
              <Scene3
                reduce={reduce}
                sceneRef={sceneRef}
                active={active}
                questionNumber={questionNumber}
              />
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}
