import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  AudioLines,
  Download,
  Gauge,
  Loader2,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";

export type RecordingStatus = "NONE" | "PROCESSING" | "READY" | "FAILED";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const WAVE_BARS = 72;
const SKIP_SECONDS = 10;

// A deterministic pseudo-waveform. Audio-only recordings have no visual, so we render
// a stable, organic-looking bar field that fills as playback advances — it reads as a
// "recording" and doubles as the scrubber. Seeded so it never reflows between renders.
function useWaveform(count: number): number[] {
  return useMemo(() => {
    const bars: number[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      // Layer a few sines + a cheap hash so the shape has both flow and texture.
      const envelope = Math.sin(t * Math.PI); // taper the ends
      const wobble =
        Math.sin(t * 34) * 0.5 + Math.sin(t * 11 + 1.7) * 0.3 + Math.sin(t * 71) * 0.2;
      const hash = ((Math.sin(i * 127.1) * 43758.5453) % 1 + 1) % 1;
      const h = 0.28 + envelope * 0.5 + Math.abs(wobble) * 0.28 + hash * 0.14;
      bars.push(Math.max(0.12, Math.min(1, h)));
    }
    return bars;
  }, [count]);
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ln-lift flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      {children}
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
  spin,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  spin?: boolean;
}) {
  return (
    <Shell>
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-ink-subtle",
            spin && "text-primary",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-tertiary">
            {description}
          </p>
        </div>
      </div>
    </Shell>
  );
}

type RecordingResponse = {
  status: RecordingStatus;
  url: string | null;
  durationMs: number | null;
};

export default function RecordingPlayer({
  interviewId,
  status,
  durationMs,
}: {
  interviewId: string;
  status: RecordingStatus;
  durationMs?: number | null;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrubRef = useRef<HTMLDivElement | null>(null);

  const [url, setUrl] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [scrubbing, setScrubbing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const waveform = useWaveform(WAVE_BARS);

  // Prefer the live media duration once known; fall back to the value the worker
  // probed at upload time (streamed Ogg/Opus can report an unusable duration).
  const duration =
    mediaDuration > 0 && Number.isFinite(mediaDuration)
      ? mediaDuration
      : durationMs
        ? durationMs / 1000
        : 0;
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const bufferedFrac = duration > 0 ? Math.min(1, buffered / duration) : 0;

  // Fetch the presigned URL once the recording is ready.
  useEffect(() => {
    if (status !== "READY") return;
    let cancelled = false;
    axios
      .get<{ data: RecordingResponse }>(
        `${BACKEND_URL}/interview/${interviewId}/recording`,
        { withCredentials: true },
      )
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        if (data?.url) setUrl(data.url);
        else setLoadFailed(true);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [status, interviewId]);

  const seekTo = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio || duration <= 0) return;
      const clamped = Math.max(0, Math.min(duration, seconds));
      audio.currentTime = clamped;
      setCurrent(clamped);
    },
    [duration],
  );

  const seekToFraction = useCallback(
    (clientX: number) => {
      const el = scrubRef.current;
      if (!el || duration <= 0) return;
      const rect = el.getBoundingClientRect();
      const frac = (clientX - rect.left) / rect.width;
      seekTo(frac * duration);
    },
    [duration, seekTo],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setLoadFailed(true));
    else audio.pause();
  }, []);

  const changeSpeed = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
    setSpeed(rate);
  }, []);

  // Pointer-drag scrubbing on the waveform.
  useEffect(() => {
    if (!scrubbing) return;
    const onMove = (e: PointerEvent) => seekToFraction(e.clientX);
    const onUp = () => setScrubbing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [scrubbing, seekToFraction]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowLeft":
        e.preventDefault();
        seekTo(current - 5);
        break;
      case "ArrowRight":
        e.preventDefault();
        seekTo(current + 5);
        break;
      case "j":
        e.preventDefault();
        seekTo(current - SKIP_SECONDS);
        break;
      case "l":
        e.preventDefault();
        seekTo(current + SKIP_SECONDS);
        break;
    }
  };

  const onDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await axios.get<{ data: RecordingResponse }>(
        `${BACKEND_URL}/interview/${interviewId}/recording?download=1`,
        { withCredentials: true },
      );
      const link = res.data?.data?.url;
      if (!link) throw new Error("no url");
      const a = document.createElement("a");
      a.href = link;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      toast.error("Couldn't download the recording. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Non-playable states ──────────────────────────────────────────────────
  if (status === "PROCESSING") {
    return (
      <StateCard
        spin
        icon={<Loader2 className="size-5 animate-spin" />}
        title="Preparing your recording"
        description="We're finalizing the audio from your session. This page updates on its own once it's ready."
      />
    );
  }
  if (status === "NONE" || status === "FAILED" || loadFailed) {
    return (
      <StateCard
        icon={<MicOff className="size-5" />}
        title="No recording available"
        description="This interview doesn't have a saved recording. New sessions are recorded automatically."
      />
    );
  }

  return (
    <Shell>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setMediaDuration(d);
            e.currentTarget.playbackRate = speed;
          }}
          onTimeUpdate={(e) => {
            if (!scrubbing) setCurrent(e.currentTarget.currentTime);
          }}
          onProgress={(e) => {
            const b = e.currentTarget.buffered;
            if (b.length) setBuffered(b.end(b.length - 1));
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setLoadFailed(true)}
        />
      )}

      <div
        className="flex flex-col gap-5 outline-none"
        role="group"
        aria-label="Interview recording player"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AudioLines className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Interview recording
            </span>
            <span className="text-[11px] text-ink-tertiary">
              Audio · you and the interviewer
            </span>
          </div>
        </div>

        {/* Waveform scrubber */}
        <div
          ref={scrubRef}
          className="group relative flex h-16 cursor-pointer items-center gap-[2px] select-none touch-none"
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            setScrubbing(true);
            seekToFraction(e.clientX);
          }}
        >
          {waveform.map((h, i) => {
            const barFrac = (i + 0.5) / WAVE_BARS;
            const played = barFrac <= progress;
            const isBuffered = barFrac <= bufferedFrac;
            return (
              <span
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-colors duration-150",
                  played
                    ? "bg-primary"
                    : isBuffered
                      ? "bg-foreground/25"
                      : "bg-foreground/12",
                )}
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            );
          })}
          {/* Playhead */}
          {duration > 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-0 h-full w-px bg-primary/70"
              style={{ left: `${progress * 100}%` }}
            />
          )}
        </div>

        {/* Transport */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => seekTo(current - SKIP_SECONDS)}
              className="relative flex size-9 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Rewind ${SKIP_SECONDS} seconds`}
            >
              <RotateCcw className="size-[18px]" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-brand-hover"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 translate-x-px fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={() => seekTo(current + SKIP_SECONDS)}
              className="relative flex size-9 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Forward ${SKIP_SECONDS} seconds`}
            >
              <RotateCw className="size-[18px]" />
            </button>
            <span className="ml-2 ln-mono text-xs tabular-nums text-ink-subtle">
              {formatTime(current)}
              <span className="text-ink-tertiary"> / {formatTime(duration)}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-subtle transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Playback speed"
                >
                  <Gauge className="size-4" />
                  <span className="ln-mono tabular-nums">{speed}×</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[6rem]">
                {SPEEDS.map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => changeSpeed(rate)}
                    className={cn(
                      "justify-between ln-mono tabular-nums",
                      rate === speed && "text-primary",
                    )}
                  >
                    {rate}×{rate === 1 && <span className="text-ink-tertiary">Normal</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              aria-label="Download recording"
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
