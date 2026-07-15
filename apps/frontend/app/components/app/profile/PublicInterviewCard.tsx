import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Globe, Lock, Loader2, PlayCircle, Share2 } from "lucide-react";
import { cn } from "~/lib/utils";
import type { Experience, InterviewKind, RecordingStatus } from "./types";

const SKILL_LABEL: Record<string, string> = {
  react: "React",
  nodejs: "Node.js",
  "system-design": "System Design",
  "sql-databases": "SQL & Databases",
  javascript: "JavaScript",
  python: "Python",
  dsa: "DSA",
};

const LEVEL_LABEL: Record<Experience, string> = {
  beginner: "Beginner",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff",
};

function skillLabel(skill: string | null, type: InterviewKind): string {
  if (skill) return SKILL_LABEL[skill] ?? skill;
  return type === "REAL" ? "Behavioral" : "General";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(ms: number | null): string | null {
  if (!ms || ms <= 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Deterministic per-interview bar heights, echoing the waveform seed pattern
// from RecordingPlayer.tsx so a recording "reads as a recording" even as a
// static square thumbnail rather than a real video frame.
function useThumbBars(seed: string, count = 28): number[] {
  return useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    const bars: number[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const envelope = Math.sin(t * Math.PI);
      const wobble = Math.sin((h % 97) + t * 26) * 0.5 + Math.sin((h % 53) + t * 9) * 0.3;
      bars.push(Math.max(0.14, Math.min(1, 0.3 + envelope * 0.45 + Math.abs(wobble) * 0.3)));
    }
    return bars;
  }, [seed, count]);
}

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(150deg, oklch(0.4 0.1 ${hue}), oklch(0.24 0.09 ${(hue + 40) % 360}))`;
}

export type InterviewCardData = {
  id: string;
  jobRole: string;
  skill: string | null;
  experience: Experience;
  type: InterviewKind;
  createdAt: string;
  recordingStatus: RecordingStatus;
  recordingDurationMs: number | null;
  isPublic?: boolean;
};

function shareUrl(username: string, interviewId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/u/${username}/i/${interviewId}`;
}

async function handleShare(username: string, interviewId: string, title: string) {
  const url = shareUrl(username, interviewId);
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // user cancelled the native sheet — fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  } catch {
    toast.error("Couldn't copy the link");
  }
}

export function PublicInterviewCard({
  interview,
  username,
  isOwner = false,
  onToggleVisibility,
}: {
  interview: InterviewCardData;
  username: string;
  isOwner?: boolean;
  onToggleVisibility?: (id: string, next: boolean) => Promise<void>;
}) {
  const [toggling, setToggling] = useState(false);
  const bars = useThumbBars(interview.id);
  const gradient = useMemo(() => gradientFor(interview.id), [interview.id]);
  const duration = formatDuration(interview.recordingDurationMs);
  const processing = interview.recordingStatus === "PROCESSING";
  const ready = interview.recordingStatus === "READY";
  const isPublic = interview.isPublic ?? true;

  const destination = isOwner
    ? `/dashboard/interviews/${interview.id}/result`
    : `/u/${username}/i/${interview.id}`;

  const toggle = async () => {
    if (!onToggleVisibility || toggling) return;
    setToggling(true);
    try {
      await onToggleVisibility(interview.id, !isPublic);
      toast.success(!isPublic ? "Interview is now public" : "Interview is now private");
    } catch {
      toast.error("Couldn't update visibility");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
      <Link to={destination} className="absolute inset-0" aria-label={interview.jobRole}>
        <div className="absolute inset-0" style={{ background: gradient }} />
        <div className="absolute inset-x-0 bottom-[38%] top-0 flex items-end justify-center gap-[3px] px-6 pb-3 opacity-70">
          {bars.map((h, i) => (
            <span
              key={i}
              className="w-full rounded-full bg-white/70"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover:scale-105",
              !ready && "bg-white/60 text-black/60",
            )}
          >
            {processing ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <PlayCircle className="size-6" fill="currentColor" />
            )}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3.5">
          <p className="truncate text-sm font-semibold text-white">{interview.jobRole}</p>
          <p className="truncate text-[11px] text-white/75">
            {skillLabel(interview.skill, interview.type)} · {LEVEL_LABEL[interview.experience]} ·{" "}
            {formatDate(interview.createdAt)}
          </p>
        </div>
        {duration && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
            {duration}
          </span>
        )}
      </Link>

      <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5">
        {isOwner && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm",
              isPublic ? "bg-primary/80 text-primary-foreground" : "bg-black/55 text-white",
            )}
          >
            {isPublic ? <Globe className="size-3" /> : <Lock className="size-3" />}
            {isPublic ? "Public" : "Private"}
          </span>
        )}
      </div>

      <div className="pointer-events-none absolute right-2.5 bottom-2.5 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {(isPublic || isOwner) && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleShare(username, interview.id, interview.jobRole);
            }}
            title="Share"
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Share2 className="size-3.5" />
          </button>
        )}
        {isOwner && onToggleVisibility && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle();
            }}
            disabled={toggling}
            title={isPublic ? "Make private" : "Make public"}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-60"
          >
            {toggling ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : isPublic ? (
              <Lock className="size-3.5" />
            ) : (
              <Globe className="size-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function PublicInterviewCardSkeleton() {
  return <div className="skeleton-shimmer aspect-square rounded-2xl bg-muted" />;
}
