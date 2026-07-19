import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MapPin } from "lucide-react";
import { BrandMark } from "~/components/app/Brand";
import { Blueprint, useBreakpoint, useSceneActive, useSceneTick } from "./illustrations";

const VW = 1120;
const VH = 640;
const CORE = { x: 360, y: 312 };

const ORBITS = [
  { rx: 190, ry: 165 },
  { rx: 270, ry: 230 },
  { rx: 345, ry: 290 },
];

const FIELD_R = 152;

const FLIP_X = 470;

type Pt = { x: number; y: number };
type Curve = [Pt, Pt, Pt, Pt];

function curveD([p0, p1, p2, p3]: Curve) {
  return `M${p0.x} ${p0.y} C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;
}

type LiveSource = {
  id: string;
  mark: string;
  name: string;
  sub: string;
  at: Pt;
  curve: Curve;
  delay: number;
};

const LIVE_SOURCES: LiveSource[] = [
  {
    id: "remotive",
    mark: "R",
    name: "Remotive",
    sub: "Remote roles",
    at: { x: 115, y: 215 },
    curve: [{ x: 115, y: 215 }, { x: 180, y: 175 }, { x: 255, y: 230 }, CORE],
    delay: 0,
  },
  {
    id: "arbeitnow",
    mark: "Ar",
    name: "Arbeitnow",
    sub: "Engineering-filtered",
    at: { x: 153, y: 460 },
    curve: [{ x: 153, y: 460 }, { x: 215, y: 455 }, { x: 285, y: 395 }, CORE],
    delay: 1.2,
  },
  {
    id: "adzuna",
    mark: "Az",
    name: "Adzuna",
    sub: "Salary data",
    at: { x: 567, y: 460 },
    curve: [{ x: 567, y: 460 }, { x: 520, y: 445 }, { x: 430, y: 390 }, CORE],
    delay: 2.4,
  },
];

const GHOST_SOURCES = [
  { id: "indeed", mark: "In", name: "Indeed", at: { x: 425, y: 157 } },
  { id: "lever", mark: "Lv", name: "Lever", at: { x: 327, y: 474 } },
  { id: "naukri", mark: "Nk", name: "Naukri", at: { x: 94, y: 352 } },
  { id: "linkedin", mark: "Li", name: "LinkedIn Jobs", at: { x: 534, y: 136 } },
  { id: "wellfound", mark: "Wf", name: "Wellfound", at: { x: 621, y: 372 } },
  { id: "remoteok", mark: "RO", name: "RemoteOK", at: { x: 77, y: 146 } },
  { id: "unstop", mark: "Un", name: "Unstop", at: { x: 96, y: 498 } },
  { id: "greenhouse", mark: "Gh", name: "Greenhouse", at: { x: 478, y: 584 } },
  { id: "ashby", mark: "As", name: "Ashby", at: { x: 643, y: 146 } },
  { id: "yc", mark: "YC", name: "YC Jobs", at: { x: 643, y: 478 } },
] as const;

type Packet = {
  source: string;
  title: string;
  company: string;
  location: string;
  chips: string[];
};

const PACKETS: Record<string, Packet> = {
  remotive: {
    source: "remotive",
    title: "Senior Backend Engineer",
    company: "Vercel",
    location: "Remote",
    chips: ["Remote", "Full-time"],
  },
  arbeitnow: {
    source: "arbeitnow",
    title: "Frontend Engineer",
    company: "Linear",
    location: "Remote",
    chips: ["Remote", "Contract"],
  },
  adzuna: {
    source: "adzuna",
    title: "Platform Engineer",
    company: "Ramp",
    location: "New York, NY",
    chips: ["On-site", "₹18–22L"],
  },
};

const ACTIVITY = [
  { id: "polling", label: "Polling", angle: -75 },
  { id: "normalizing", label: "Normalizing", angle: -25 },
  { id: "upserting", label: "Upserting", angle: 25 },
  { id: "live", label: "Live", angle: 75 },
] as const;

const ACTIVITY_R = 112;

const activityAt = (angle: number) => ({
  x: CORE.x + ACTIVITY_R * Math.cos((angle * Math.PI) / 180),
  y: CORE.y + ACTIVITY_R * Math.sin((angle * Math.PI) / 180),
});

type FeedJob = {
  id: string;
  mark: string;
  company: string;
  title: string;
  location: string;
  jobType: string;
  source: string;
  sourceName: string;
};

const FEED_POOL: FeedJob[] = [
  { id: "vercel", mark: "V", company: "Vercel", title: "Senior Backend Engineer", location: "Remote", jobType: "Full-time", source: "remotive", sourceName: "Remotive" },
  { id: "ramp", mark: "R", company: "Ramp", title: "Platform Engineer", location: "New York, NY", jobType: "Full-time", source: "adzuna", sourceName: "Adzuna" },
  { id: "linear", mark: "L", company: "Linear", title: "Frontend Engineer", location: "Remote", jobType: "Contract", source: "arbeitnow", sourceName: "Arbeitnow" },
  { id: "supabase", mark: "S", company: "Supabase", title: "Infrastructure Engineer", location: "Remote", jobType: "Full-time", source: "remotive", sourceName: "Remotive" },
  { id: "stripe", mark: "St", company: "Stripe", title: "Backend Engineer, Payments", location: "Bangalore", jobType: "Full-time", source: "adzuna", sourceName: "Adzuna" },
];

const FEED_ROWS = 4;
const FEED_ADVANCE_MS = 4000;

const COUNTERS = [
  { value: "3", label: "sources connected" },
  { value: "30m", label: "sync interval" },
  { value: "1", label: "normalized schema" },
  { value: "0", label: "duplicate rows" },
];

const STARS = (() => {
  let seed = 20260718;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: 46 }, () => ({
    x: rnd() * VW,
    y: rnd() * VH,
    r: 0.5 + rnd() * 1.1,
    o: 0.2 + rnd() * 0.55,
  }));
})();

const CONSTELLATIONS = [
  "M77 146 L115 215 L94 352 L153 460",
  "M534 136 L643 146 L621 372 L643 478",
];

function useStageScale(ref: React.RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / VW);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return scale;
}

function SourceBadge({
  mark,
  name,
  sub,
  live,
  emitDelay,
  dimmed,
  flip,
}: {
  mark: string;
  name: string;
  sub?: string;
  live: boolean;
  emitDelay?: number;
  dimmed?: boolean;
  flip?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 transition-opacity duration-500 ${
        flip ? "flex-row-reverse" : ""
      } ${dimmed ? "opacity-20" : live ? "opacity-100" : "opacity-30"}`}
    >
      <span
        className={`relative flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${
          live
            ? "bg-surface-3 text-foreground"
            : "border border-dashed border-hairline-strong text-ink-tertiary"
        }`}
      >
        {live && (
          <span
            aria-hidden
            className="jd-motion absolute inset-0 rounded-lg opacity-0"
            style={{
              background: "color-mix(in oklab, var(--primary) 34%, transparent)",
              animationName: "jd-emit",
              animationDelay: `${emitDelay ?? 0}s`,
            }}
          />
        )}
        <span className="relative">{mark}</span>
      </span>
      <div className={`min-w-0 whitespace-nowrap ${flip ? "text-right" : ""}`}>
        <div className={`flex items-center gap-1.5 ${flip ? "flex-row-reverse" : ""}`}>
          <span className={`text-[12px] font-medium ${live ? "text-foreground" : "text-ink-tertiary"}`}>
            {name}
          </span>
          {live && <span className="size-1.5 rounded-full bg-brand/70" />}
        </div>
        {sub && <p className="text-[10.5px] text-ink-subtle">{sub}</p>}
      </div>
    </div>
  );
}

function PacketCard({
  packet,
  path,
  delay,
  twin = false,
  dimmed,
}: {
  packet: Packet;
  path: string;
  delay: number;
  twin?: boolean;
  dimmed: boolean;
}) {
  return (
    <div
      className="jd-motion jd-motion-gpu pointer-events-none absolute left-0 top-0"
      style={{
        offsetPath: `path("${path}")`,
        offsetRotate: "0deg",
        offsetDistance: twin ? "52%" : "72%",
        opacity: twin ? 0 : 1,
        animationName: twin ? "jd-twin" : "jd-packet",
        animationDelay: `${delay}s`,
      }}
    >
      <div
        className={`w-[164px] rounded-lg border border-hairline bg-surface-2 px-2.5 py-2 shadow-lg shadow-black/20 transition-opacity duration-500 ${
          dimmed ? "opacity-15" : "opacity-100"
        }`}
      >
        <div className="truncate text-[10.5px] font-medium leading-tight text-foreground">
          {packet.title}
        </div>
        <div className="mt-0.5 truncate text-[9.5px] text-ink-subtle">
          {packet.company} · {packet.location}
        </div>
        {!twin && (
          <div
            className="jd-motion mt-1.5 flex flex-wrap gap-1"
            style={{ animationName: "jd-chips", animationDelay: `${delay}s` }}
          >
            {packet.chips.map((chip) => (
              <span
                key={chip}
                className="ln-mono rounded bg-surface-4 px-1.5 py-px text-[8.5px] text-ink-tertiary"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedRow({
  job,
  dimmed,
  onHover,
}: {
  job: FeedJob;
  dimmed: boolean;
  onHover: (source: string | null) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: dimmed ? 0.25 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => onHover(job.source)}
      onMouseLeave={() => onHover(null)}
      className="flex items-center gap-2.5 border-b border-hairline py-2.5 last:border-0"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-[10px] font-semibold text-background">
        {job.mark}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium text-foreground">{job.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10.5px] text-ink-subtle">
          <span>{job.company}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-2.5" /> {job.location}
          </span>
          <span>{job.jobType}</span>
        </div>
      </div>
      <span className="ln-mono shrink-0 rounded border border-hairline bg-surface-2 px-1.5 py-0.5 text-[9.5px] text-ink-tertiary">
        via {job.sourceName}
      </span>
    </motion.div>
  );
}

function UnifiedFeed({
  jobs,
  hovered,
  onHover,
}: {
  jobs: FeedJob[];
  hovered: string | null;
  onHover: (source: string | null) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-hairline bg-surface-1 p-4 shadow-2xl shadow-black/30 sm:p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-foreground">Your feed</span>
        <span className="ln-mono rounded-full border border-hairline px-2 py-0.5 text-[9.5px] text-ink-tertiary">
          3 sources · 1 list
        </span>
      </div>
      <div className="flex flex-col">
        <AnimatePresence initial={false} mode="popLayout">
          {jobs.map((job) => (
            <FeedRow
              key={job.id}
              job={job}
              dimmed={hovered !== null && hovered !== job.source}
              onHover={onHover}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OrbitScene({
  reduce,
  hovered,
  setHovered,
  idle,
}: {
  reduce: boolean | null;
  hovered: string | null;
  setHovered: (s: string | null) => void;
  idle?: boolean;
}) {
  const dim = (source: string) => hovered !== null && hovered !== source;
  const stageRef = useRef<HTMLDivElement>(null);
  const scale = useStageScale(stageRef);

  return (
    <div
      ref={stageRef}
      data-idle={idle ? "true" : undefined}
      className="jd-scene relative w-full overflow-hidden"
      style={{ aspectRatio: `${VW} / ${VH}` }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: VW,
          height: VH,
          transform: `scale(${scale})`,
        }}
      >
        <svg
          aria-hidden
          width={VW}
          height={VH}
          viewBox={`0 0 ${VW} ${VH}`}
          className="absolute inset-0"
        >
          <defs>
            <radialGradient id="jd-field" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="var(--primary)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.07" />
            </radialGradient>
          </defs>

          <g opacity="0.5">
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--foreground)" opacity={s.o * 0.14} />
            ))}
            {CONSTELLATIONS.map((d) => (
              <path key={d} d={d} fill="none" stroke="var(--foreground)" strokeWidth="0.6" opacity="0.05" />
            ))}
          </g>

          {ORBITS.map((o, i) => (
            <ellipse
              key={i}
              cx={CORE.x}
              cy={CORE.y}
              rx={o.rx}
              ry={o.ry}
              fill="none"
              stroke="var(--hairline-strong)"
              strokeWidth="1"
              opacity={0.5 - i * 0.12}
              strokeDasharray={i === 2 ? "3 7" : undefined}
            />
          ))}

          <circle cx={CORE.x} cy={CORE.y} r={FIELD_R} fill="url(#jd-field)" />
          <circle
            cx={CORE.x}
            cy={CORE.y}
            r={FIELD_R}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1"
            strokeDasharray="2 8"
            opacity="0.35"
          />

          {LIVE_SOURCES.map((s) => (
            <path
              key={s.id}
              d={curveD(s.curve)}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.1"
              opacity={dim(s.id) ? 0.06 : 0.3}
              className="transition-opacity duration-500"
            />
          ))}

          <circle cx={CORE.x} cy={CORE.y} r="110" fill="none" stroke="var(--hairline-strong)" strokeWidth="1" strokeDasharray="2 6" opacity="0.7" />
          <circle cx={CORE.x} cy={CORE.y} r="84" fill="none" stroke="var(--hairline-strong)" strokeWidth="1" opacity="0.8" />
        </svg>

        {[0, 1.2].map((d) => (
          <span
            key={d}
            aria-hidden
            className="jd-motion absolute rounded-full border opacity-0"
            style={{
              left: CORE.x - 84,
              top: CORE.y - 84,
              width: 168,
              height: 168,
              borderColor: "var(--primary)",
              animationName: "jd-pulse",
              animationDuration: "2.4s",
              animationTimingFunction: "cubic-bezier(0.2, 0.6, 0.35, 1)",
              animationDelay: `${d}s`,
            }}
          />
        ))}

        {LIVE_SOURCES.flatMap((s) =>
          [0, -0.87, -1.73].map((d) => (
            <span
              key={`${s.id}${d}`}
              aria-hidden
              className="jd-motion jd-motion-gpu absolute left-0 top-0 size-[3.5px] rounded-full opacity-0"
              style={{
                background: "var(--primary)",
                offsetPath: `path("${curveD(s.curve)}")`,
                offsetRotate: "0deg",
                animationName: "jd-particle",
                animationDuration: "2.6s",
                animationDelay: `${d}s`,
                opacity: dim(s.id) ? 0.1 : undefined,
              }}
            />
          )),
        )}

        <div
          className="absolute flex flex-col items-center justify-center gap-1 rounded-full border border-hairline-strong bg-surface-2 text-center"
          style={{ left: CORE.x - 62, top: CORE.y - 62, width: 124, height: 124 }}
        >
          <BrandMark className="size-[18px] text-foreground" />
          <span className="text-[11.5px] font-semibold tracking-tight text-foreground">Hireflow</span>
          <span className="ln-mono max-w-[92px] text-[8px] uppercase leading-tight tracking-[0.08em] text-ink-tertiary">
            Unified job workspace
          </span>
        </div>

        {ACTIVITY.map((a, i) => {
          const p = activityAt(a.angle);
          const resting = reduce && a.id === "live";
          return (
            <div key={a.id}>
              <span
                aria-hidden
                className="jd-motion absolute size-[5px] rounded-full"
                style={{
                  left: p.x - 2.5,
                  top: p.y - 2.5,
                  background: resting ? "var(--primary)" : "var(--ink-tertiary)",
                  opacity: 0.35,
                  animationName: "jd-activity",
                  animationDelay: `${i * 2}s`,
                }}
              />
              <span
                className="jd-motion ln-mono absolute whitespace-nowrap text-[9.5px] text-ink-tertiary"
                style={{
                  left: p.x + 10,
                  top: p.y - 7,
                  opacity: resting ? 1 : 0,
                  animationName: "jd-activity-label",
                  animationDelay: `${i * 2}s`,
                }}
              >
                {a.label}
              </span>
            </div>
          );
        })}

        {LIVE_SOURCES.map((s) => (
          <div
            key={s.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: s.at.x, top: s.at.y }}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <SourceBadge
              mark={s.mark}
              name={s.name}
              sub={s.sub}
              live
              emitDelay={s.delay}
              dimmed={dim(s.id)}
              flip={s.at.x > FLIP_X}
            />
          </div>
        ))}

        {GHOST_SOURCES.map((g) => (
          <div
            key={g.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: g.at.x, top: g.at.y }}
          >
            <SourceBadge
              mark={g.mark}
              name={g.name}
              live={false}
              dimmed={hovered !== null}
              flip={g.at.x > FLIP_X}
            />
          </div>
        ))}

        {LIVE_SOURCES.map((s) => (
          <PacketCard
            key={s.id}
            packet={PACKETS[s.id]}
            path={curveD(s.curve)}
            delay={s.delay}
            dimmed={dim(s.id)}
          />
        ))}

        <PacketCard
          packet={PACKETS.remotive}
          path={curveD(LIVE_SOURCES[0].curve)}
          delay={0}
          twin
          dimmed={dim("remotive")}
        />

        <div
          className="jd-motion pointer-events-none absolute rounded-md border border-hairline bg-surface-2 px-2 py-1 leading-relaxed"
          style={{
            left: 99,
            top: 252,
            opacity: 1,
            animationName: "jd-merge-label",
          }}
        >
          <span className="ln-mono block text-[9.5px] text-ink-tertiary">same listing, re-sent</span>
          <span className="ln-mono block text-[9.5px] text-foreground">upsert · never duplicated</span>
        </div>
      </div>
    </div>
  );
}

function StackedScene({ idle }: { idle?: boolean }) {
  return (
    <div data-idle={idle ? "true" : undefined} className="jd-scene flex flex-col items-center gap-6">
      <div className="relative flex size-[124px] flex-col items-center justify-center gap-1 rounded-full border border-hairline-strong bg-surface-2 text-center">
        <span
          aria-hidden
          className="jd-motion absolute inset-0 rounded-full border opacity-0"
          style={{
            borderColor: "var(--primary)",
            animationName: "jd-pulse",
            animationDuration: "2.4s",
            animationTimingFunction: "cubic-bezier(0.2, 0.6, 0.35, 1)",
          }}
        />
        <BrandMark className="relative size-[18px] text-foreground" />
        <span className="relative text-[11.5px] font-semibold tracking-tight text-foreground">
          Hireflow
        </span>
        <span className="ln-mono relative max-w-[92px] text-[8px] uppercase leading-tight tracking-[0.08em] text-ink-tertiary">
          Unified job workspace
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {LIVE_SOURCES.map((s) => (
          <SourceBadge key={s.id} mark={s.mark} name={s.name} sub={s.sub} live emitDelay={s.delay} />
        ))}
      </div>

      <p className="ln-mono text-center text-[10px] text-ink-tertiary/70">
        + pluggable adapter — more sources drop in
      </p>
    </div>
  );
}

export default function JobDiscoveryShowcase() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [feedTick, setFeedTick] = useState(0);
  const wide = useBreakpoint("(min-width: 1024px)");
  const active = useSceneActive(sectionRef);

  useSceneTick(sectionRef, FEED_ADVANCE_MS, () => setFeedTick((t) => t + 1), {
    enabled: !reduce,
  });

  const feedJobs = Array.from({ length: FEED_ROWS }, (_, i) => {
    const idx = (((feedTick - i) % FEED_POOL.length) + FEED_POOL.length) % FEED_POOL.length;
    return FEED_POOL[idx];
  });

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-152 opacity-70"
        style={{
          background: [
            "radial-gradient(52% 42% at 43% 36%, var(--glow-brand), color-mix(in oklab, var(--glow-brand) 40%, transparent) 45%, transparent 80%)",
            "radial-gradient(34% 30% at 67% 30%, color-mix(in oklab, var(--glow-brand) 55%, transparent), transparent 78%)",
          ].join(", "),
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="ln-eyebrow">Job discovery, unified</span>
          <h2 className="ln-display-lg text-foreground">
            Jobs live on a dozen boards. Watch them come to you.
          </h2>
          <p className="text-lg leading-relaxed text-ink-muted">
            Hireflow polls every connected source on a 30-minute cycle, maps each listing into one
            schema, and updates in place instead of piling up duplicates — so the feed you check is
            the only one you need to.
          </p>
        </div>

        <div ref={sectionRef} className="relative mt-14">
          <Blueprint maskPosition="34% 48%" />

          {wide ? (
            <div className="relative">
              <OrbitScene reduce={reduce} hovered={hovered} setHovered={setHovered} idle={!active} />
              <div className="absolute right-0 top-1/2 w-[35%] -translate-y-1/2">
                <UnifiedFeed jobs={feedJobs} hovered={hovered} onHover={setHovered} />
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col gap-8">
              <StackedScene idle={!active} />
              <UnifiedFeed jobs={feedJobs} hovered={hovered} onHover={setHovered} />
            </div>
          )}

          <div className="relative mt-12 flex flex-wrap items-baseline justify-center gap-x-10 gap-y-4 border-t border-hairline pt-6 lg:mt-8">
            {COUNTERS.map((c) => (
              <div key={c.label} className="flex items-baseline gap-2">
                <span className="ln-mono text-[15px] font-medium text-foreground">{c.value}</span>
                <span className="text-[11.5px] text-ink-tertiary">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
