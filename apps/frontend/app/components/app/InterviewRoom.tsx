import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { TokenSource, ConnectionState } from "livekit-client";
import {
  type AgentState,
  useAgent,
  useSession,
  useSessionMessages,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  CircleDot,
  LayoutGrid,
  Loader2,
  MessageSquareText,
} from "lucide-react";
import { motion } from "motion/react";
import { BACKEND_URL } from "~/lib/config";
import { cn } from "~/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { AgentControlBar } from "../agents-ui/agent-control-bar";
import { AgentSessionProvider } from "../agents-ui/agent-session-provider";
import { AgentAudioVisualizerGrid } from "../agents-ui/agent-audio-visualizer-grid";
import { AgentAudioOrb } from "../agents-ui/agent-audio-orb";
import { AgentChatTranscript } from "../agents-ui/agent-chat-transcript";

type TokenResponse = { server_url: string; participant_token: string };

const BRAND_COLOR = "#5e6ad2";

type Visualizer = "grid";

function RoomShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      {children}
    </div>
  );
}

export default function InterviewRoom({
  interviewId,
}: {
  interviewId: string;
}) {
  const [creds, setCreds] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.post<TokenResponse>(
          `${BACKEND_URL}/interview/pre/${interviewId}/get-token`,
          {},
          { withCredentials: true },
        );
        if (!cancelled) setCreds(res.data);
      } catch {
        if (!cancelled)
          setError("Could not join the interview room. Please try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  if (error)
    return (
      <RoomShell>
        <div className="flex size-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
          <CircleDot className="size-5 text-destructive" />
        </div>
        <p className="max-w-sm text-sm text-ink-subtle">{error}</p>
      </RoomShell>
    );

  if (!creds)
    return (
      <RoomShell>
        <Loader2 className="size-5 animate-spin text-ink-subtle" />
        <p className="text-sm text-ink-subtle">Connecting to your room…</p>
      </RoomShell>
    );

  return <InterviewSession creds={creds} />;
}

const STATUS_LABEL: Partial<Record<AgentState, string>> = {
  disconnected: "Reconnecting",
  connecting: "Connecting",
  "pre-connect-buffering": "Connecting",
  initializing: "Getting ready",
  idle: "Getting ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  failed: "Connection issue",
};

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function InterviewSession({ creds }: { creds: TokenResponse }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [visualizer, setVisualizer] = useState<Visualizer>("grid");

  const tokenSource = useMemo(
    () =>
      TokenSource.literal({
        serverUrl: creds.server_url,
        participantToken: creds.participant_token,
      }),
    [creds.server_url, creds.participant_token],
  );

  const session = useSession(tokenSource);
  const { microphoneTrack: agentAudioTrack, state } = useAgent(session);
  const { messages } = useSessionMessages(session);
  const { start, end, isConnected, connectionState } = session;

  useEffect(() => {
    start({
      tracks: {
        microphone: { enabled: true },
        camera: { enabled: false },
      },
    }).catch(() => setError("Connection error. Please try again."));
    return () => {
      void end();
    };
  }, [start, end]);

  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (isConnected && startedAtRef.current == null) {
      startedAtRef.current = Date.now();
    }
  }, [isConnected]);
  useEffect(() => {
    if (!isConnected) return;
    const id = setInterval(() => {
      if (startedAtRef.current != null) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isConnected]);

  const wasConnected = useRef(false);
  useEffect(() => {
    if (isConnected) {
      wasConnected.current = true;
    } else if (
      wasConnected.current &&
      connectionState === ConnectionState.Disconnected
    ) {
      navigate("/result");
    }
  }, [isConnected, connectionState, navigate]);

  if (error)
    return (
      <RoomShell>
        <div className="flex size-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
          <CircleDot className="size-5 text-destructive" />
        </div>
        <p className="max-w-sm text-sm text-ink-subtle">{error}</p>
      </RoomShell>
    );

  const statusLabel = STATUS_LABEL[state] ?? "Connecting";

  return (
    <AgentSessionProvider session={session}>
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5 items-center justify-center">
              {isConnected && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#27a644]/60" />
              )}
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  isConnected ? "bg-[#27a644]" : "bg-ink-tertiary",
                )}
              />
            </span>
            <span className="text-sm font-medium text-foreground">
              {isConnected ? "Live" : statusLabel}
            </span>
            {isConnected && (
              <span className="ln-mono text-[13px] tabular-nums text-ink-subtle">
                · {formatElapsed(elapsed)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-subtle sm:inline">
              QuickHire · Interviewer
            </span>
            <ToggleGroup
              type="single"
              size="sm"
              value={visualizer}
              onValueChange={(v) => v && setVisualizer(v as Visualizer)}
              className="rounded-md border border-border bg-secondary p-0.5"
            >
              <ToggleGroupItem value="grid" aria-label="Grid visualizer">
                <LayoutGrid className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="orb" aria-label="Orb visualizer">
                <CircleDot className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <main className="flex shrink-0 flex-col items-center justify-center gap-8 px-6 py-10 lg:flex-1 lg:py-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative grid place-items-center"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute size-[min(70vw,420px)] rounded-full opacity-40 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(94,106,210,0.45) 0%, transparent 70%)",
                }}
              />

              <AgentAudioVisualizerGrid
                size="md"
                color={BRAND_COLOR}
                radius={4}
                interval={120}
                rowCount={12}
                columnCount={12}
                state={state}
                audioTrack={agentAudioTrack}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <motion.p
                key={statusLabel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="text-lg font-medium text-foreground"
              >
                {statusLabel}
              </motion.p>
              <p className="text-sm text-ink-subtle">
                Answer out loud whenever you're ready.
              </p>
            </motion.div>
          </main>

          <motion.aside
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="flex min-h-0 flex-1 flex-col border-t border-border bg-card lg:w-[400px] lg:flex-none lg:border-t-0 lg:border-l xl:w-[440px]"
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="ln-eyebrow">Transcript</span>
              {messages.length > 0 && (
                <span className="ln-mono text-[12px] text-ink-tertiary">
                  {messages.length}
                </span>
              )}
            </div>
            <div className="relative min-h-0 flex-1">
              {messages.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full border border-border bg-secondary">
                    <MessageSquareText className="size-4 text-ink-tertiary" />
                  </div>
                  <p className="text-sm text-ink-subtle">
                    The conversation will appear here
                  </p>
                  <p className="max-w-[220px] text-xs text-ink-tertiary">
                    Your questions and answers are transcribed live.
                  </p>
                </div>
              )}
              <AgentChatTranscript
                agentState={state}
                messages={messages}
                className="h-full"
              />
            </div>
          </motion.aside>
        </div>

        <footer className="flex shrink-0 items-center justify-center px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <AgentControlBar
            variant="livekit"
            isChatOpen={false}
            isConnected={isConnected}
            onDisconnect={() => setConfirmOpen(true)}
            controls={{
              leave: true,
              microphone: true,
              screenShare: false,
              camera: false,
              chat: true,
            }}
          />
        </footer>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End the interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This ends your session and takes you to your results. You won't be
              able to return to this interview.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void end()}>
              End call
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AgentSessionProvider>
  );
}
