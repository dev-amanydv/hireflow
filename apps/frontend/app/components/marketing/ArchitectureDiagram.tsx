import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { PacketFlow } from "./illustrations";

/**
 * Animated system diagram of the real stack. Packets flow along every edge on a
 * loop; hovering (or focusing) a service highlights its connections and prints
 * its role in the inspector line below. Reduced motion drops the packets and
 * leaves a clean static topology.
 */

type NodeDef = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  role: string;
};

// viewBox 1000 x 520
const NODES: NodeDef[] = [
  { id: "browser", x: 44, y: 218, w: 170, h: 72, title: "Browser", sub: "React Router SSR", role: "Renders the candidate flow and streams the interview UI." },
  { id: "api", x: 300, y: 218, w: 170, h: 72, title: "Express API", sub: "REST · /api/v1", role: "Validates requests, mints LiveKit tokens, and coordinates every service." },
  { id: "db", x: 556, y: 74, w: 176, h: 64, title: "PostgreSQL", sub: "Prisma ORM", role: "Stores users, interviews, transcripts, and results." },
  { id: "workers", x: 556, y: 218, w: 176, h: 72, title: "BullMQ Workers", sub: "parse · GitHub · score", role: "Background jobs: parse the resume, fetch GitHub, run scoring." },
  { id: "livekit", x: 556, y: 372, w: 176, h: 64, title: "LiveKit Room", sub: "WebRTC voice", role: "Carries realtime audio between the candidate and the agent." },
  { id: "storage", x: 792, y: 74, w: 170, h: 64, title: "R2 / S3", sub: "recordings", role: "Holds interview audio, served back via presigned URLs." },
  { id: "azure", x: 792, y: 218, w: 170, h: 72, title: "Azure OpenAI", sub: "STT · LLM · TTS", role: "Transcribes speech, drives the interviewer, and grades answers." },
  { id: "agent", x: 792, y: 372, w: 170, h: 64, title: "Voice Agent", sub: "Python · Agents SDK", role: "The interviewer: listens, asks the next question, and speaks back." },
];

type EdgeDef = { id: string; from: string; to: string; d: string; both?: boolean };

const EDGES: EdgeDef[] = [
  { id: "e-browser-api", from: "browser", to: "api", d: "M214,254 H300" },
  { id: "e-api-db", from: "api", to: "db", d: "M470,236 C516,236 516,106 556,106" },
  { id: "e-api-workers", from: "api", to: "workers", d: "M470,254 H556" },
  { id: "e-api-livekit", from: "api", to: "livekit", d: "M470,272 C516,272 516,404 556,404" },
  { id: "e-workers-azure", from: "workers", to: "azure", d: "M732,254 H792" },
  { id: "e-workers-storage", from: "workers", to: "storage", d: "M690,218 C742,196 772,158 826,138" },
  { id: "e-livekit-agent", from: "livekit", to: "agent", d: "M732,404 H792", both: true },
  { id: "e-agent-azure", from: "agent", to: "azure", d: "M877,372 V290" },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

export default function ArchitectureDiagram() {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  const isEdgeActive = (e: EdgeDef) => hovered === e.from || hovered === e.to;
  const active = hovered ? NODE_BY_ID[hovered] : null;

  return (
    <section id="architecture" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="flex max-w-2xl flex-col gap-3">
        <span className="ln-eyebrow">Architecture</span>
        <h2 className="ln-display-md text-foreground">
          One request, traced through the whole system
        </h2>
        <p className="text-lg leading-relaxed text-ink-muted">
          A voice interview touches realtime media, background workers, and a
          model provider — all behind a single API. Hover any service to trace
          what it talks to.
        </p>
      </div>

      <div className="mt-12">
        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <svg
            viewBox="0 0 1000 520"
            className="h-auto w-full min-w-[760px]"
            role="group"
            aria-label="System architecture diagram"
          >
            {/* edges */}
            {EDGES.map((e) => {
              const on = isEdgeActive(e);
              return (
                <g key={e.id}>
                  <path
                    d={e.d}
                    fill="none"
                    className={on ? "text-brand" : "text-hairline-strong"}
                    stroke="currentColor"
                    strokeWidth={on ? 1.75 : 1.5}
                    opacity={hovered && !on ? 0.35 : 1}
                  />
                  <PacketFlow
                    path={e.d}
                    dur={2.6}
                    delay={0.4}
                    r={on ? 3.2 : 2.4}
                    className={on ? "text-brand" : "text-brand/50"}
                    reduce={reduce}
                  />
                  {e.both && (
                    <PacketFlow
                      path={reverse(e.d)}
                      dur={2.6}
                      delay={1.5}
                      r={on ? 3.2 : 2.4}
                      className={on ? "text-brand" : "text-brand/50"}
                      reduce={reduce}
                    />
                  )}
                </g>
              );
            })}

            {/* nodes */}
            {NODES.map((n) => {
              const on = hovered === n.id;
              const cx = n.x + n.w / 2;
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
                  opacity={hovered && !on ? 0.55 : 1}
                >
                  {on && (
                    <rect
                      x={n.x - 4}
                      y={n.y - 4}
                      width={n.w + 8}
                      height={n.h + 8}
                      rx="16"
                      className="fill-brand/10"
                    />
                  )}
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    rx="13"
                    className={on ? "fill-card text-brand" : "fill-card text-hairline-strong"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
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

        {/* inspector line */}
        <div className="mt-4 flex items-center gap-2.5 border-t border-hairline pt-4 text-[13px]">
          <span
            className={`size-2 shrink-0 rounded-full ${active ? "bg-brand" : "bg-ink-tertiary/50"}`}
          />
          {active ? (
            <p className="text-ink-muted">
              <span className="font-medium text-foreground">{active.title}</span>{" "}
              — {active.role}
            </p>
          ) : (
            <p className="text-ink-subtle">
              Hover a service to trace its connections.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Reverse a simple edge path so a second packet can travel the other way.
 * Only handles the straight `M x,y H x2` / `V y2` forms used by bidirectional
 * edges here; falls back to the original path otherwise.
 */
function reverse(d: string): string {
  const h = d.match(/^M([\d.]+),([\d.]+) H([\d.]+)$/);
  if (h) return `M${h[3]},${h[2]} H${h[1]}`;
  const v = d.match(/^M([\d.]+),([\d.]+) V([\d.]+)$/);
  if (v) return `M${v[1]},${v[3]} V${v[2]}`;
  return d;
}
