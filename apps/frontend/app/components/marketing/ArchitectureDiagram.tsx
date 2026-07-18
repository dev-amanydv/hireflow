import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Blueprint, PacketComet, PacketFlow, useScenePhase, useSceneActive } from "./illustrations";

/**
 * Animated system diagram of the real stack, split into a control plane (top)
 * and a media plane (bottom). A narration loop walks one interview through the
 * system; hovering a service overrides the narration and traces its edges.
 *
 * The load-bearing detail: Express mints a token whose `roomConfig` *declares*
 * the LiveKit room and the agent to dispatch — it never calls LiveKit. The room
 * is auto-created when the browser joins, and media flows browser ↔ LiveKit
 * directly. That edge is drawn dashed and deliberately carries no packets; the
 * absence of flow on it is the point.
 */

type Plane = "control" | "media" | "span";

type NodeDef = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  role: string;
  plane: Plane;
};

// viewBox 1000 x 560
const NODES: NodeDef[] = [
  { id: "browser", x: 36, y: 246, w: 164, h: 72, plane: "span", title: "Browser", sub: "React Router SSR", role: "Renders the candidate flow, then holds the media link to LiveKit itself." },
  { id: "api", x: 320, y: 114, w: 176, h: 72, plane: "control", title: "Express API", sub: "REST · /api/v1", role: "Validates requests and mints the interview token — then steps out of the media path." },
  { id: "db", x: 592, y: 28, w: 176, h: 60, plane: "control", title: "PostgreSQL", sub: "Prisma ORM", role: "Stores users, interviews, transcripts, and results." },
  { id: "workers", x: 592, y: 114, w: 176, h: 72, plane: "control", title: "BullMQ Workers", sub: "parse · GitHub · score", role: "Background jobs: parse the resume, fetch GitHub, score the interview." },
  { id: "storage", x: 828, y: 28, w: 160, h: 60, plane: "control", title: "R2 / S3", sub: "recordings", role: "Holds interview audio, served back via presigned URLs." },
  { id: "azure", x: 828, y: 114, w: 160, h: 72, plane: "control", title: "Azure OpenAI", sub: "STT · LLM · TTS", role: "Transcribes speech, drives the interviewer, and grades answers." },
  { id: "livekit", x: 452, y: 400, w: 192, h: 76, plane: "media", title: "LiveKit Room", sub: "auto-created on join", role: "Carries realtime audio. Created the moment the browser joins — nobody provisions it." },
  { id: "agent", x: 760, y: 400, w: 192, h: 76, plane: "media", title: "Voice Agent", sub: "Python · Agents SDK", role: "The interviewer: listens, asks the next question, speaks back, and records the room." },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

/**
 * Edge kind drives weight, colour and — the part that carries meaning — how much
 * traffic runs along it. `declare` is the odd one out: it is a statement, not a
 * channel, so it gets no packets at all.
 */
type EdgeKind = "control" | "media" | "declare" | "async";

type EdgeDef = {
  id: string;
  from: string;
  to: string;
  d: string;
  /** Explicit reverse path for bidirectional edges (every edge here is a cubic). */
  dBack?: string;
  kind: EdgeKind;
  label?: string[];
  labelAt?: [number, number];
};

const EDGES: EdgeDef[] = [
  { id: "token-req", from: "browser", to: "api", kind: "control", d: "M200,266 C252,266 268,150 320,150", label: ["POST /get-token"], labelAt: [256, 200] },
  { id: "token-res", from: "api", to: "browser", kind: "control", d: "M320,172 C268,172 252,296 200,296", label: ["JWT · roomConfig"], labelAt: [264, 244] },
  { id: "declare", from: "api", to: "livekit", kind: "declare", d: "M360,186 C360,300 420,330 500,400", label: ["room + agent dispatch", "declared in the token"], labelAt: [400, 310] },
  { id: "media", from: "browser", to: "livekit", kind: "media", d: "M118,318 C118,404 260,438 452,438", dBack: "M452,438 C260,438 118,404 118,318", label: ["WebRTC · direct"], labelAt: [213, 410] },
  { id: "room-agent", from: "livekit", to: "agent", kind: "media", d: "M644,438 C680,438 724,438 760,438", dBack: "M760,438 C724,438 680,438 644,438" },
  { id: "agent-azure", from: "agent", to: "azure", kind: "control", d: "M872,400 C872,340 908,300 908,186" },
  { id: "azure-agent", from: "azure", to: "agent", kind: "control", d: "M944,186 C944,300 920,340 920,400" },
  { id: "agent-api", from: "agent", to: "api", kind: "async", d: "M790,400 C700,340 560,320 470,186", label: ["transcript · x-internal-secret"], labelAt: [630, 321] },
  { id: "api-db", from: "api", to: "db", kind: "control", d: "M496,140 C540,140 552,58 592,58" },
  { id: "api-workers", from: "api", to: "workers", kind: "control", d: "M496,160 C536,160 552,150 592,150" },
  { id: "workers-azure", from: "workers", to: "azure", kind: "control", d: "M768,150 C790,150 806,150 828,150" },
  { id: "workers-storage", from: "workers", to: "storage", kind: "control", d: "M740,114 C776,92 800,70 828,66" },
];

/** Particle timing per edge kind. `null` means the edge never carries traffic. */
type Flow = { dur: number; delay: number; r: number };
const FLOW: Record<EdgeKind, Flow[] | null> = {
  media: [
    { dur: 1.9, delay: 0, r: 2.6 },
    { dur: 2.7, delay: 0.9, r: 1.7 },
  ],
  control: [{ dur: 3.2, delay: 0.3, r: 2.2 }],
  async: [{ dur: 4.4, delay: 1.2, r: 2 }],
  declare: null,
};

/**
 * Every packet's arrival is deterministic — a particle with `begin=delay` and
 * `dur=D` lands on the target at `delay + D`, then every `D` after. So the node
 * pulses are plain SMIL keyed off the same numbers, with nothing on the JS frame
 * loop and no need to observe the packets.
 */
const PULSES: { nodeId: string; dur: number; begin: number }[] = EDGES.flatMap((e) => {
  const flows = FLOW[e.kind];
  if (!flows) return [];
  const forward = flows.map((f) => ({ nodeId: e.to, dur: f.dur, begin: f.delay + f.dur }));
  if (!e.dBack) return forward;
  // The return lane runs offset so the two ends don't pulse in lockstep.
  return forward.concat(
    flows.map((f) => ({ nodeId: e.from, dur: f.dur, begin: f.delay + f.dur * 1.5 })),
  );
});

type Step = { edges: string[]; text: string };

/** The narration: one interview, in the order it actually happens. */
const STEPS: Step[] = [
  { edges: ["token-req"], text: "The browser asks the API for a room token." },
  { edges: ["token-res", "declare"], text: "The API returns a JWT that declares the room and the agent to dispatch — it never calls LiveKit." },
  { edges: ["media"], text: "The browser connects straight to LiveKit with that token. The room is created by the join itself." },
  { edges: ["room-agent"], text: "LiveKit dispatches the voice agent named in the token, into the same room." },
  { edges: ["agent-azure", "azure-agent"], text: "The agent streams audio to Azure OpenAI — speech in, the next question out." },
  { edges: ["agent-api", "api-db"], text: "Each turn is written back over the internal API and stored in Postgres." },
  { edges: ["api-workers", "workers-azure", "workers-storage"], text: "Workers parse the resume, score the interview, and park the recording in R2." },
];

const PHASES: readonly number[] = [0, 2000, 4600, 7000, 9200, 11400, 13600];
const LOOP_MS = 16000;

export default function ArchitectureDiagram() {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // SMIL runs off the document clock, so these timelines keep animating (and
  // dirtying the SVG) even when the diagram is nowhere near the viewport.
  const inView = useSceneActive(svgRef);
  const moving = !reduce && inView;

  const { elapsed } = useScenePhase(svgRef, {
    phases: PHASES,
    loopMs: LOOP_MS,
    enabled: moving,
    paused: hovered !== null,
  });
  const step = moving && !hovered ? Math.max(0, PHASES.indexOf(elapsed)) : -1;
  const narrating = step >= 0;
  const liveEdges = narrating ? STEPS[step].edges : null;

  // Every edge stays legible at all times — the narration and hover states
  // *emphasise*, they never hide. Hence a high floor rather than a fade-out.
  const edgeOpacity = (e: EdgeDef) => {
    if (hovered) return hovered === e.from || hovered === e.to ? 1 : 0.55;
    if (liveEdges) return liveEdges.includes(e.id) ? 1 : 0.7;
    return 1;
  };

  // Nodes touched by the current beat, so the narration lights boxes too.
  const liveNodes = new Set(
    liveEdges
      ? EDGES.filter((e) => liveEdges.includes(e.id)).flatMap((e) => [e.from, e.to])
      : [],
  );

  const nodeState = (id: string) => {
    if (hovered) return hovered === id ? "on" : "off";
    if (liveEdges) return liveNodes.has(id) ? "on" : "dim";
    return "dim";
  };

  const active = hovered ? NODE_BY_ID[hovered] : null;

  return (
    <section id="architecture" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="flex max-w-2xl flex-col gap-3">
        <span className="ln-eyebrow">Architecture</span>
        <h2 className="ln-display-md text-foreground">
          One interview, traced through the whole system
        </h2>
        <p className="text-lg leading-relaxed text-ink-muted">
          Express mints a token that declares the room and the agent, then steps
          aside — the browser holds the media link to LiveKit itself. Hover any
          service to trace what it talks to.
        </p>
      </div>

      <div className="mt-12">
        <div
          className="relative overflow-hidden rounded-[24px]"
          style={{
            background: "#08090A",
            boxShadow: "inset 0 1px 0 0 rgb(255 255 255 / 0.045)",
          }}
        >
          {/* Surface texture + a soft brand halo pooled under the media plane. */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <Blueprint maskPosition="50% 78%" />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 42% at 52% 82%, var(--glow-brand), transparent 70%)",
            }}
          />

          <div className="relative overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <svg
              ref={svgRef}
              viewBox="0 0 1000 560"
              className="h-auto w-full min-w-[760px]"
              role="group"
              aria-label="System architecture diagram: control plane and media plane"
            >
              {/* plane markers */}
              <g className="ln-mono fill-ink-muted" fontSize="9.5" opacity={0.75} letterSpacing="0.14em">
                <text x="36" y="24">CONTROL PLANE</text>
                <text x="36" y="536">MEDIA PLANE</text>
              </g>
              <line
                x1="36"
                y1="352"
                x2="112"
                y2="352"
                className="text-hairline-strong"
                stroke="currentColor"
                strokeWidth="1"
                opacity={0.8}
              />

              {/* edges */}
              {EDGES.map((e) => {
                const flows = FLOW[e.kind];
                const isMedia = e.kind === "media";
                const lanes = e.dBack ? [e.d, e.dBack] : [e.d];
                return (
                  <g key={e.id} opacity={edgeOpacity(e)} style={{ transition: "opacity 600ms ease" }}>
                    {/* fiber cladding — only real channels get the glass halo */}
                    {isMedia && (
                      <path d={e.d} fill="none" className="text-brand" stroke="currentColor" strokeWidth="7" opacity={0.16} />
                    )}
                    <path
                      d={e.d}
                      fill="none"
                      className={isMedia ? "text-brand" : "text-ink-tertiary"}
                      stroke="currentColor"
                      strokeWidth={isMedia ? 1.6 : 1.25}
                      strokeDasharray={e.kind === "declare" ? "3 6" : undefined}
                      opacity={isMedia ? 0.9 : e.kind === "declare" ? 0.8 : 0.85}
                    />
                    {moving &&
                      flows &&
                      lanes.flatMap((lane, li) =>
                        flows.map((f, fi) => (
                          <g key={`${li}-${fi}`}>
                            {isMedia && fi === 0 && (
                              <PacketComet
                                id={`${e.id}-${li}`}
                                path={lane}
                                dur={f.dur}
                                delay={f.delay + li * 0.45}
                                r={7}
                                reduce={reduce}
                              />
                            )}
                            <PacketFlow
                              path={lane}
                              dur={f.dur}
                              delay={f.delay + li * 0.45}
                              r={f.r}
                              className={
                                isMedia ? "text-brand" : e.kind === "async" ? "text-brand/40" : "text-brand/60"
                              }
                              reduce={reduce}
                            />
                          </g>
                        )),
                      )}
                  </g>
                );
              })}

              {/* edge labels — chipped so they can sit straight on the path */}
              {EDGES.filter((e) => e.label && e.labelAt).map((e) => (
                <EdgeLabel
                  key={`${e.id}-label`}
                  lines={e.label!}
                  at={e.labelAt!}
                  opacity={edgeOpacity(e)}
                />
              ))}

              {/* nodes */}
              {NODES.map((n) => {
                const state = nodeState(n.id);
                const cx = n.x + n.w / 2;
                const r = 14;
                return (
                  <g
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${n.title}: ${n.role}`}
                    className="cursor-pointer outline-none"
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(n.id)}
                    onBlur={() => setHovered(null)}
                    opacity={state === "off" ? 0.72 : 1}
                    style={{ transition: "opacity 600ms ease" }}
                  >
                    {/* arrival pulses, one per inbound packet lane */}
                    {moving &&
                      PULSES.filter((p) => p.nodeId === n.id).map((p, i) => (
                        <rect
                          key={i}
                          x={n.x - 7}
                          y={n.y - 7}
                          width={n.w + 14}
                          height={n.h + 14}
                          rx={r + 6}
                          className="fill-brand"
                          opacity="0"
                        >
                          <animate
                            attributeName="opacity"
                            values="0;0.42;0"
                            keyTimes="0;0.05;0.36"
                            dur={`${p.dur}s`}
                            begin={`${p.begin}s`}
                            repeatCount="indefinite"
                          />
                        </rect>
                      ))}

                    {state === "on" && (
                      <rect
                        x={n.x - 5}
                        y={n.y - 5}
                        width={n.w + 10}
                        height={n.h + 10}
                        rx={r + 5}
                        className="fill-brand/10"
                      />
                    )}

                    {/* Elevation, not outlines: the surface step does the separating. */}
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.w}
                      height={n.h}
                      rx={r}
                      className={n.plane === "control" ? "fill-surface-2" : "fill-surface-3"}
                    />
                    {/* SVG stand-in for the `inset 0 1px 0 white/6%` top highlight
                        that `.ln-lift` uses in dark mode. */}
                    <path
                      d={`M${n.x + 1},${n.y + r} A${r},${r} 0 0 1 ${n.x + r},${n.y} H${n.x + n.w - r} A${r},${r} 0 0 1 ${n.x + n.w - 1},${n.y + r}`}
                      fill="none"
                      stroke="#fff"
                      strokeWidth="1"
                      opacity={0.06}
                    />
                    {state === "on" && (
                      <rect
                        x={n.x}
                        y={n.y}
                        width={n.w}
                        height={n.h}
                        rx={r}
                        fill="none"
                        className="text-brand"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        opacity={0.75}
                      />
                    )}

                    <text
                      x={cx}
                      y={n.y + n.h / 2 - 5}
                      textAnchor="middle"
                      fontSize="15"
                      className="fill-foreground"
                      style={{ fontWeight: 600 }}
                    >
                      {n.title}
                    </text>
                    <text
                      x={cx}
                      y={n.y + n.h / 2 + 14}
                      textAnchor="middle"
                      fontSize="11"
                      className="ln-mono fill-ink-tertiary"
                    >
                      {n.sub}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* inspector line — narrates the loop, or the hovered service */}
        <div className="mt-4 flex items-start gap-2.5 border-t border-hairline pt-4 text-[13px]">
          <span
            className={`mt-1.5 size-2 shrink-0 rounded-full ${
              active || narrating ? "bg-brand" : "bg-ink-tertiary/50"
            }`}
          />
          {active ? (
            <p className="text-ink-muted">
              <span className="font-medium text-foreground">{active.title}</span> — {active.role}
            </p>
          ) : narrating ? (
            <p className="text-ink-muted">
              <span className="ln-mono text-ink-tertiary">
                {String(step + 1).padStart(2, "0")}/{String(STEPS.length).padStart(2, "0")}
              </span>{" "}
              {STEPS[step].text}
            </p>
          ) : (
            <p className="text-ink-subtle">Hover a service to trace its connections.</p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Edge annotation with a canvas-coloured chip behind it, so the label can sit
 * directly on the path it describes instead of being nudged into free space.
 */
function EdgeLabel({
  lines,
  at,
  opacity,
}: {
  lines: string[];
  at: [number, number];
  opacity: number;
}) {
  const [x, y] = at;
  const charW = 5.7;
  const w = Math.max(...lines.map((l) => l.length)) * charW + 16;
  const lineH = 14;
  const h = lines.length * lineH + 8;
  const top = y - h / 2;
  return (
    <g opacity={opacity} style={{ transition: "opacity 600ms ease" }} pointerEvents="none">
      {/* Opaque chip: the label has to win against whatever edge runs under it. */}
      <rect x={x - w / 2} y={top} width={w} height={h} rx={5} fill="#08090A" />
      {lines.map((l, i) => (
        <text
          key={i}
          x={x}
          y={top + 13 + i * lineH}
          textAnchor="middle"
          fontSize="10"
          className="ln-mono fill-ink-muted"
        >
          {l}
        </text>
      ))}
    </g>
  );
}
