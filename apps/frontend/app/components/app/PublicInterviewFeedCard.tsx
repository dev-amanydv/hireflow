import { useMemo } from "react";
import { Link } from "react-router";
import { PlayCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { RecordingStatus } from "./RecordingPlayer";

type Difficulty = "beginner" | "junior" | "mid" | "senior" | "staff";

const LEVEL_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff",
};

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatDuration(ms: number | null | undefined): string | null {
  if (!ms || ms <= 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useWaveformBars(seed: string, count = 24): number[] {
  return useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    const bars: number[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const envelope = Math.sin(t * Math.PI);
      const wobble =
        Math.sin((h % 97) + t * 26) * 0.5 + Math.sin((h % 53) + t * 9) * 0.3;
      bars.push(
        Math.max(0.14, Math.min(1, 0.3 + envelope * 0.45 + Math.abs(wobble) * 0.3)),
      );
    }
    return bars;
  }, [seed, count]);
}

export function accentGradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(150deg, oklch(0.4 0.1 ${hue}), oklch(0.24 0.09 ${(hue + 40) % 360}))`;
}

export type PublicInterviewFeedItem = {
  id: string;
  jobRole: string;
  skill: string | null;
  experience: Difficulty;
  type: "REAL" | "PRACTICE";
  createdAt: string;
  recordingStatus: RecordingStatus;
  recordingDurationMs: number | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export function PublicInterviewFeedCard({
  interview,
}: {
  interview: PublicInterviewFeedItem;
}) {
  const bars = useWaveformBars(interview.id);
  const gradient = useMemo(() => accentGradientFor(interview.id), [interview.id]);
  const duration = formatDuration(interview.recordingDurationMs);
  const name = interview.displayName || interview.username;

  return (
    <Link
      to={`/u/${interview.username}/i/${interview.id}`}
      className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="absolute inset-0" style={{ background: gradient }} />
      <div className="absolute inset-x-0 bottom-[38%] top-0 flex items-end justify-center gap-[3px] px-5 pb-3 opacity-70">
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-full rounded-full bg-white/70"
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover:scale-105">
          <PlayCircle className="size-6" fill="currentColor" />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/50 py-1 pl-1 pr-2.5 backdrop-blur-sm">
        <Avatar size="sm">
          {interview.avatarUrl && <AvatarImage src={interview.avatarUrl} alt="" />}
          <AvatarFallback className="text-[9px]">
            {name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[6rem] truncate text-[11px] font-medium text-white">
          {name}
        </span>
      </div>

      {duration && (
        <span className="absolute right-2.5 top-2.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
          {duration}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3.5">
        <p className="truncate text-sm font-semibold text-white">
          {interview.jobRole}
        </p>
        <p className="truncate text-[11px] text-white/75">
          {LEVEL_LABEL[interview.experience]} · {timeAgo(interview.createdAt)}
        </p>
      </div>
    </Link>
  );
}

export function PublicInterviewFeedCardSkeleton() {
  return <div className="skeleton-shimmer aspect-square rounded-2xl bg-muted" />;
}
